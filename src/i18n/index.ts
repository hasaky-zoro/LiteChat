import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'zh-CN' | 'en'
type Values = Record<string, string | number>

const messages = {
  'zh-CN': {
    language: '语言', settings: '设置', closeSettings: '关闭设置', newChat: '新建对话', deleteChat: '删除对话', chatsStored: '你的对话和设置仅保存在此浏览器中。',
    startConversation: '开始新对话', startConversationHint: '新建对话，然后在设置中配置模型供应商。', messageLiteChat: '发送消息给 LiteChat…', thinking: '思考中…', stop: '停止生成', send: '发送', missingProvider: '未找到模型供应商', noModelSelected: '未选择模型', somethingWentWrong: '发生了一些错误。',
    providersAndModels: '模型供应商', providerDescription: '探测可用模型，并在对话前验证模型响应。', providerName: '供应商名称', removeProvider: '删除供应商', baseUrl: '基础 URL', apiKey: 'API 密钥', apiKeyHint: 'sk-...（本地供应商无需填写）', models: '模型', modelsAvailable: '（{count} 个可用）', fetchModels: '探测模型', fetchingModels: '正在探测模型…', modelsInput: '{provider} 的模型，每行一个', modelToTest: '要测试的模型', selectModel: '选择模型', testConnection: '测试连通性', testing: '测试中…', addProvider: '添加供应商', save: '保存', saveSettings: '保存设置', chatSettings: '对话设置', systemPrompt: '系统提示词', systemPromptHint: '为当前对话设置模型行为。', temperature: '随机性 (Temperature)', temperatureHint: '较低的值更稳定，较高的值更有创造性。',
    newProvider: '新供应商', unnamedProvider: '未命名供应商', noModelsReturned: '供应商未返回任何模型。', foundModels: '找到 {count} 个模型。', unableToFetchModels: '无法探测模型。', connectionSuccess: '连接成功（{latency}ms · HTTP {status}）', connectionFailed: '连接失败：{message}', unableToTestConnection: '无法测试连接。',
  },
  en: {
    language: 'Language', settings: 'Settings', closeSettings: 'Close settings', newChat: 'New chat', deleteChat: 'Delete chat', chatsStored: 'Your chats and settings stay in this browser.',
    startConversation: 'Start a conversation', startConversationHint: 'Create a new chat, then configure your provider in Settings.', messageLiteChat: 'Message LiteChat…', thinking: 'Thinking…', stop: 'Stop', send: 'Send', missingProvider: 'Missing provider', noModelSelected: 'No model selected', somethingWentWrong: 'Something went wrong.',
    providersAndModels: 'Providers & models', providerDescription: 'Discover available models and verify a model response before chatting.', providerName: 'Provider name', removeProvider: 'Remove provider', baseUrl: 'Base URL', apiKey: 'API key', apiKeyHint: 'sk-... (not required by local providers)', models: 'Models', modelsAvailable: '({count} available)', fetchModels: 'Fetch models', fetchingModels: 'Fetching models…', modelsInput: '{provider} models, one per line', modelToTest: 'Model to test', selectModel: 'Select a model', testConnection: 'Test connection', testing: 'Testing…', addProvider: 'Add provider', save: 'Save', saveSettings: 'Save settings', chatSettings: 'Chat settings', systemPrompt: 'System Prompt', systemPromptHint: 'Set the model behavior for the current conversation.', temperature: 'Temperature', temperatureHint: 'Lower values are more focused; higher values are more creative.',
    newProvider: 'New provider', unnamedProvider: 'Unnamed provider', noModelsReturned: 'The provider returned no models.', foundModels: 'Found {count} models.', unableToFetchModels: 'Unable to fetch models.', connectionSuccess: 'Success ({latency}ms · HTTP {status})', connectionFailed: 'Failed: {message}', unableToTestConnection: 'Unable to test connection.',
  },
} as const

export type TranslationKey = keyof typeof messages['zh-CN']

export function translate(language: Language, key: TranslationKey, values: Values = {}) {
  return messages[language][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))
}

interface I18nState {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

export const useI18nStore = create<I18nState>()(persist(
  (set) => ({
    language: 'zh-CN',
    setLanguage: (language) => set({ language }),
    toggleLanguage: () => set((state) => ({ language: state.language === 'zh-CN' ? 'en' : 'zh-CN' })),
  }),
  { name: 'litechat-i18n' },
))

export function useI18n() {
  const language = useI18nStore((state) => state.language)
  return { language, t: (key: TranslationKey, values?: Values) => translate(language, key, values) }
}
