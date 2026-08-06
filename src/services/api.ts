import type { ChatCompletionMessage, Provider, StreamCallback } from '../types'

export class ApiError extends Error {}

const endpoint = (baseUrl: string) => `${baseUrl.replace(/\/$/, '')}/chat/completions`

export async function streamChatCompletion(
  provider: Provider,
  model: string,
  messages: ChatCompletionMessage[],
  temperature: number,
  onDelta: StreamCallback,
  signal: AbortSignal,
): Promise<void> {
  if (!provider.apiKey.trim()) throw new ApiError('Add an API key in Settings before sending a message.')
  if (!model) throw new ApiError('Select a model in Settings before sending a message.')

  const response = await fetch(endpoint(provider.baseUrl), {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({ model, messages, temperature, stream: true }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new ApiError(detail || `Request failed (${response.status})`)
  }
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
