import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Model, Provider, Session } from '../types'
import { createId } from '../utils/id'

const id = createId
const now = () => Date.now()

const defaultProvider: Provider = {
  id: 'openai',
  name: 'OpenAI compatible',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  enabled: true,
  models: [{ id: 'gpt-4o-mini', name: 'GPT-4o mini', providerId: 'openai' }],
}

const createSession = (provider: Provider, model = provider.models[0]): Session => ({
  id: id(),
  title: 'New chat',
  messages: [],
  providerId: provider.id,
  modelId: model?.id ?? '',
  systemPrompt: '',
  temperature: 0.7,
  createdAt: now(),
  updatedAt: now(),
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * localStorage survives application upgrades, so never trust its old or manually edited shape.
 * In particular, an invalid active ID must not leave a session list without a selected session.
 */
const restoreState = (persistedState: unknown, currentState: ChatState) => {
  if (!isRecord(persistedState)) return currentState

  const providers = Array.isArray(persistedState.providers)
    ? persistedState.providers.filter(isRecord).map((provider): Provider => ({
      id: typeof provider.id === 'string' && provider.id ? provider.id : id(),
      name: typeof provider.name === 'string' ? provider.name : 'Unnamed provider',
      baseUrl: typeof provider.baseUrl === 'string' ? provider.baseUrl : '',
      apiKey: typeof provider.apiKey === 'string' ? provider.apiKey : '',
      enabled: typeof provider.enabled === 'boolean' ? provider.enabled : true,
      models: Array.isArray(provider.models) ? provider.models.filter(isRecord).map((model): Model => ({
        id: typeof model.id === 'string' ? model.id : '',
        name: typeof model.name === 'string' ? model.name : (typeof model.id === 'string' ? model.id : ''),
        providerId: typeof model.providerId === 'string' ? model.providerId : (typeof provider.id === 'string' ? provider.id : ''),
        ...(typeof model.contextWindow === 'number' ? { contextWindow: model.contextWindow } : {}),
      })).filter((model) => model.id) : [],
    }))
    : currentState.providers
  const sessions = Array.isArray(persistedState.sessions)
    ? persistedState.sessions.filter(isRecord).map((session): Session => ({
      id: typeof session.id === 'string' && session.id ? session.id : id(),
      title: typeof session.title === 'string' ? session.title : 'New chat',
      messages: Array.isArray(session.messages) ? session.messages.filter(isRecord).map((message): Message => ({
        id: typeof message.id === 'string' && message.id ? message.id : id(),
        role: message.role === 'system' || message.role === 'user' || message.role === 'assistant' ? message.role : 'assistant',
        content: typeof message.content === 'string' ? message.content : '',
        createdAt: typeof message.createdAt === 'number' ? message.createdAt : now(),
      })) : [],
      providerId: typeof session.providerId === 'string' ? session.providerId : '',
      modelId: typeof session.modelId === 'string' ? session.modelId : '',
      systemPrompt: typeof session.systemPrompt === 'string' ? session.systemPrompt : '',
      temperature: typeof session.temperature === 'number' ? session.temperature : 0.7,
      createdAt: typeof session.createdAt === 'number' ? session.createdAt : now(),
      updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : now(),
    }))
    : currentState.sessions
  const requestedActiveId = typeof persistedState.activeSessionId === 'string' ? persistedState.activeSessionId : null
  const activeSessionId = sessions.some((session) => session.id === requestedActiveId)
    ? requestedActiveId
    : sessions[0]?.id ?? null

  return { ...currentState, providers, sessions, activeSessionId }
}

interface ChatState {
  providers: Provider[]
  sessions: Session[]
  activeSessionId: string | null
  settingsOpen: boolean
  addProvider: (provider: Provider) => void
  updateProvider: (provider: Provider) => void
  updateProviderModels: (providerId: string, models: Model[]) => void
  removeProvider: (providerId: string) => void
  createSession: () => void
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSession: (sessionId: string, changes: Partial<Session>) => void
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, content: string) => void
  setSettingsOpen: (open: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      providers: [defaultProvider],
      sessions: [],
      activeSessionId: null,
      settingsOpen: false,
      addProvider: (provider) => set((state) => ({ providers: [...state.providers, provider] })),
      updateProvider: (provider) => set((state) => ({
        providers: state.providers.map((item) => item.id === provider.id ? provider : item),
      })),
      updateProviderModels: (providerId, models) => set((state) => ({
        providers: state.providers.map((provider) => provider.id === providerId
          ? { ...provider, models: models.map((model) => ({ ...model, providerId })) }
          : provider),
      })),
      removeProvider: (providerId) => set((state) => {
        const sessions = state.sessions.filter((session) => session.providerId !== providerId)
        return {
          providers: state.providers.filter((provider) => provider.id !== providerId),
          sessions,
          activeSessionId: sessions.some((session) => session.id === state.activeSessionId)
            ? state.activeSessionId
            : sessions[0]?.id ?? null,
        }
      }),
      createSession: () => {
        const provider = get().providers.find((item) => item.enabled) ?? get().providers[0]
        if (!provider) return
        const session = createSession(provider)
        set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: session.id }))
      },
      selectSession: (sessionId) => set((state) => ({
        activeSessionId: state.sessions.some((session) => session.id === sessionId)
          ? sessionId
          : state.sessions[0]?.id ?? null,
      })),
      deleteSession: (sessionId) => set((state) => {
        const sessions = state.sessions.filter((session) => session.id !== sessionId)
        return {
          sessions,
          activeSessionId: state.activeSessionId === sessionId ? sessions[0]?.id ?? null : state.activeSessionId,
        }
      }),
      updateSession: (sessionId, changes) => set((state) => ({
        sessions: state.sessions.map((session) => session.id === sessionId
          ? { ...session, ...changes, updatedAt: now() }
          : session),
      })),
      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map((session) => session.id === sessionId ? {
          ...session,
          title: session.messages.length === 0 && message.role === 'user'
            ? message.content.trim().slice(0, 48) || 'New chat' : session.title,
          messages: [...session.messages, message],
          updatedAt: now(),
        } : session),
      })),
      updateMessage: (sessionId, messageId, content) => set((state) => ({
        sessions: state.sessions.map((session) => session.id === sessionId ? {
          ...session,
          messages: session.messages.map((message) => message.id === messageId ? { ...message, content } : message),
          updatedAt: now(),
        } : session),
      })),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    }),
    {
      name: 'litechat-store',
      partialize: (state) => ({
        providers: state.providers,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      merge: restoreState,
    },
  ),
)
