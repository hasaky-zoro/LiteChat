import { create } from 'zustand';
import { Provider, Conversation, Message } from '../types';

interface AppState {
  // Providers
  providers: Provider[];
  activeProviderId: string | null;
  activeModelId: string | null;
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // UI State
  sidebarOpen: boolean;
  settingsOpen: boolean;
  
  // Actions
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Provider) => void;
  updateProvider: (id: string, provider: Partial<Provider>) => void;
  setActiveProviderAndModel: (providerId: string, modelId: string) => void;
  
  // Conversation Actions
  createConversation: (title?: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, messageId: string, content: Partial<Message>) => void;
  
  // UI Actions
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
}

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'aps-9929',
    name: 'APS 9929 (Custom)',
    baseUrl: 'https://aps.59697989.xyz/v1',
    apiKey: '',
    enabled: true,
    type: 'custom',
    models: [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', contextWindow: 1048576 },
      { id: 'gpt-5.6-luna', name: 'GPT 5.6 Luna', contextWindow: 200000 },
      { id: 'gpt-5.6-terra', name: 'GPT 5.6 Terra', contextWindow: 200000 },
      { id: 'gpt-image-2', name: 'GPT Image 2' }
    ]
  },
  {
    id: 'openai-official',
    name: 'OpenAI (Official)',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    enabled: false,
    type: 'openai',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 }
    ]
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  providers: DEFAULT_PROVIDERS,
  activeProviderId: 'aps-9929',
  activeModelId: 'gemini-3.6-flash',
  
  conversations: [],
  activeConversationId: null,
  
  sidebarOpen: true,
  settingsOpen: false,
  
  setProviders: (providers) => set({ providers }),
  addProvider: (provider) => set((state) => ({ providers: [...state.providers, provider] })),
  updateProvider: (id, updated) => set((state) => ({
    providers: state.providers.map((p) => (p.id === id ? { ...p, ...updated } : p))
  })),
  setActiveProviderAndModel: (providerId, modelId) => set({ activeProviderId: providerId, activeModelId: modelId }),
  
  createConversation: (title = '新对话') => {
    const { activeProviderId, activeModelId } = get();
    const id = Date.now().toString();
    const newConv: Conversation = {
      id,
      title,
      providerId: activeProviderId || 'aps-9929',
      modelId: activeModelId || 'gemini-3.6-flash',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: id
    }));
    return id;
  },
  
  selectConversation: (id) => set({ activeConversationId: id }),
  
  deleteConversation: (id) => set((state) => {
    const filtered = state.conversations.filter((c) => c.id !== id);
    const activeConversationId = state.activeConversationId === id
      ? (filtered[0]?.id || null)
      : state.activeConversationId;
    return { conversations: filtered, activeConversationId };
  }),
  
  addMessage: (conversationId, msgData) => {
    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newMsg: Message = {
      ...msgData,
      id: msgId,
      timestamp: Date.now()
    };
    
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            updatedAt: Date.now(),
            messages: [...conv.messages, newMsg]
          };
        }
        return conv;
      })
    }));
    
    return msgId;
  },
  
  updateMessage: (conversationId, messageId, content) => set((state) => ({
    conversations: state.conversations.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map((m) => (m.id === messageId ? { ...m, ...content } : m))
        };
      }
      return conv;
    })
  })),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open })
}));
