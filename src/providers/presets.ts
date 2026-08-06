import type { Model, Provider } from '../types'

export type ProviderPresetId = 'openai' | 'deepseek' | 'anthropic' | 'gemini' | 'ollama' | 'openai-compatible'

export interface ProviderPreset {
  id: ProviderPresetId
  name: string
  baseUrl: string
  models: string[]
}

/** Popular provider defaults. URLs may be changed after a preset is added. */
export const providerPresets: ProviderPreset[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'] },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'anthropic', name: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5'] },
  { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', models: ['llama3.2', 'qwen2.5'] },
  { id: 'openai-compatible', name: 'OpenAI compatible', baseUrl: 'https://api.openai.com/v1', models: [] },
]

export const getProviderPreset = (presetId: ProviderPresetId) => providerPresets.find((preset) => preset.id === presetId) ?? providerPresets[0]

export const providerFromPreset = (presetId: ProviderPresetId, id: string, name?: string): Provider => {
  const preset = getProviderPreset(presetId)
  return {
    id,
    name: name ?? preset.name,
    baseUrl: preset.baseUrl,
    apiKey: '',
    enabled: true,
    models: preset.models.map((modelId): Model => ({ id: modelId, name: modelId, providerId: id })),
  }
}
