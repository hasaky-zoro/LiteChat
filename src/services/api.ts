import type { ChatCompletionMessage, Model, Provider, StreamCallback } from '../types'

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const normaliseBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/$/, '')
const completionEndpoint = (baseUrl: string) => {
  const base = normaliseBaseUrl(baseUrl)
  return /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`
}
const modelsEndpoint = (baseUrl: string) => {
  const base = normaliseBaseUrl(baseUrl)
  if (/\/models$/i.test(base)) return base
  return /\/chat\/completions$/i.test(base) ? base.replace(/\/chat\/completions$/i, '/models') : `${base}/models`
}

const headersFor = (apiKey: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
})

const errorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()
  let detail = text
  try {
    const payload = JSON.parse(text) as { error?: { message?: string } | string; message?: string }
    detail = typeof payload.error === 'string' ? payload.error : payload.error?.message ?? payload.message ?? text
  } catch {
    // Some compatible APIs return plain text or HTML error pages.
  }
  if (response.status === 401) return detail || 'Invalid API key (401).'
  if (response.status === 403) return detail || 'API key is not authorized (403).'
  return detail || `Request failed (${response.status}).`
}

const requireConnectionDetails = (provider: Provider) => {
  if (!normaliseBaseUrl(provider.baseUrl)) throw new ApiError('Add a Base URL before making a request.')
}

/** Fetch models from OpenAI-compatible `/models` APIs and Ollama's compatible response shape. */
export async function fetchProviderModels(provider: Provider): Promise<Model[]> {
  requireConnectionDetails(provider)
  let response: Response
  try {
    response = await fetch(modelsEndpoint(provider.baseUrl), { headers: headersFor(provider.apiKey) })
  } catch (cause) {
    throw new ApiError(cause instanceof Error ? `Could not reach provider: ${cause.message}` : 'Could not reach provider.')
  }
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)

  const payload = await response.json() as {
    data?: Array<{ id?: string; name?: string; model?: string; display_name?: string }>
    models?: Array<{ id?: string; name?: string; model?: string; display_name?: string }>
  }
  const entries = payload.data ?? payload.models ?? []
  const seen = new Set<string>()
  return entries.flatMap((entry) => {
    const id = (entry.id ?? entry.model ?? entry.name ?? '').trim()
    if (!id || seen.has(id)) return []
    seen.add(id)
    return [{ id, name: (entry.display_name ?? entry.name ?? id).trim() || id, providerId: provider.id }]
  })
}

export interface ConnectionTestResult {
  latencyMs: number
  status: number
}

/** Send a small non-streaming completion to verify credentials and model availability. */
export async function testProviderConnection(provider: Provider, model: string): Promise<ConnectionTestResult> {
  requireConnectionDetails(provider)
  if (!model.trim()) throw new ApiError('Select a model to test.')
  const startedAt = performance.now()
  let response: Response
  try {
    response = await fetch(completionEndpoint(provider.baseUrl), {
      method: 'POST',
      headers: headersFor(provider.apiKey),
      body: JSON.stringify({
        model: model.trim(),
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
        temperature: 0,
        stream: false,
      }),
    })
  } catch (cause) {
    throw new ApiError(cause instanceof Error ? `Could not reach provider: ${cause.message}` : 'Could not reach provider.')
  }
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)
  return { latencyMs: Math.round(performance.now() - startedAt), status: response.status }
}

export async function streamChatCompletion(
  provider: Provider,
  model: string,
  messages: ChatCompletionMessage[],
  temperature: number,
  onDelta: StreamCallback,
  signal: AbortSignal,
): Promise<void> {
  requireConnectionDetails(provider)
  if (!model) throw new ApiError('Select a model in Settings before sending a message.')

  const response = await fetch(completionEndpoint(provider.baseUrl), {
    method: 'POST',
    signal,
    headers: headersFor(provider.apiKey),
    body: JSON.stringify({ model, messages, temperature, stream: true }),
  })
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)
  if (!response.body) throw new ApiError('The server did not return a streaming response.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> }
          const content = chunk.choices?.[0]?.delta?.content
          if (content) onDelta(content)
        } catch {
          // Ignore non-JSON SSE events sent by some compatible providers.
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export const createAbortController = () => new AbortController()
