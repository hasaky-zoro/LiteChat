export interface Model {
  id: string;
  name: string;
  contextWindow?: number;
  description?: string;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  type: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';
  models: Model[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'pending' | 'streaming' | 'completed' | 'error';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}
