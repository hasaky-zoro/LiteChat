import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Model, Provider, Session } from '../types'

const id = () => crypto.randomUUID()
const now = () => Date.now()

const defaultProvider: Provider = {
  id: 'openai',
  name: 'OpenAI compatible',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  enabled: true,
  models: [{ id: 'gpt-4o-mini', name: 'GPT-4o mini', providerId: 'openai' }],
}

const createSession = (provider = defaultProvider, model = provider.models[0]): Session => ({
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

interface ChatState {
  providers: Provider[]
  sessions: Session[]
  activeSessionId: string | null
  settingsOpen: boolean
  addProvider: (provider: Provider) => void
  updateProvider: (provider: Provider) => void
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
      removeProvider: (providerId) => set((state) => ({
        providers: state.providers.filter((provider) => provider.id !== providerId),
        sessions: state.sessions.filter((session) => session.providerId !== providerId),
        activeSessionId: state.activeSessionId && state.sessions.some((session) => session.id === state.activeSessionId && session.providerId === providerId)
          ? null : state.activeSessionId,
      })),
      createSession: () => {
        const provider = get().providers.find((item) => item.enabled) ?? get().providers[0]
        if (!provider) return
        const session = createSession(provider)
        set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: session.id }))
      },
      selectSession: (sessionId) => set({ activeSessionId: sessionId }),
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
    },
  ),
)
