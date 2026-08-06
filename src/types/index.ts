export type MessageRole = 'system' | 'user' | 'assistant'

export interface Model {
  id: string
  name: string
  providerId: string
  contextWindow?: number
}

export interface Provider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: Model[]
  enabled: boolean
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  providerId: string
  modelId: string
  systemPrompt: string
  temperature: number
  createdAt: number
  updatedAt: number
}

export interface ChatCompletionMessage {
  role: MessageRole
  content: string
}

export type StreamCallback = (content: string) => void
