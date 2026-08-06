import { AlertCircle, CheckCircle2, Download, Languages, Loader2, Plus, Save, Trash2, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n, useI18nStore } from '../i18n'
import { ApiError, fetchProviderModels, testProviderConnection } from '../services/api'
import { useChatStore } from '../store/useChatStore'
import type { Provider } from '../types'
import { createId } from '../utils/id'

type TestState = { loading: boolean; message?: string; success?: boolean }

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, providers, activeSessionId, sessions, updateSession, updateProvider, updateProviderModels, addProvider, removeProvider } = useChatStore()
  const { language, t } = useI18n()
  const setLanguage = useI18nStore((state) => state.setLanguage)
  const [drafts, setDrafts] = useState<Provider[]>(providers)
  const [fetching, setFetching] = useState<Record<string, boolean>>({})
  const [tests, setTests] = useState<Record<string, TestState>>({})
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
  const session = activeSessionId ? sessions.find((item) => item.id === activeSessionId) : undefined

  useEffect(() => {
    if (!settingsOpen) return
    setDrafts(providers)
    setFetching({})
    setTests({})
    setSelectedModels(Object.fromEntries(providers.map((provider) => [provider.id, provider.models?.[0]?.id ?? ''])))
  }, [settingsOpen])

  if (!settingsOpen) return null

  const patch = (providerId: string, changes: Partial<Provider>) => setDrafts((items) => items.map((item) => item.id === providerId ? { ...item, ...changes } : item))
  const modelFor = (provider: Provider) => selectedModels[provider.id] ?? provider.models?.[0]?.id ?? ''
  const setSelectedModel = (providerId: string, model: string) => setSelectedModels((items) => ({ ...items, [providerId]: model }))

  const discoverModels = async (provider: Provider) => {
    setFetching((items) => ({ ...items, [provider.id]: true }))
    setTests((items) => ({ ...items, [provider.id]: { loading: false } }))
    try {
      const models = await fetchProviderModels(provider)
      if (!models.length) throw new ApiError(t('noModelsReturned'))
      patch(provider.id, { models })
      setSelectedModel(provider.id, models[0].id)
      if (providers.some((item) => item.id === provider.id)) updateProviderModels(provider.id, models)
      setTests((items) => ({ ...items, [provider.id]: { loading: false, success: true, message: t('foundModels', { count: models.length }) } }))
    } catch (cause) {
      setTests((items) => ({ ...items, [provider.id]: { loading: false, success: false, message: cause instanceof Error ? cause.message : t('unableToFetchModels') } }))
    } finally { setFetching((items) => ({ ...items, [provider.id]: false })) }
  }

  const testConnection = async (provider: Provider) => {
    const model = modelFor(provider)
    setTests((items) => ({ ...items, [provider.id]: { loading: true } }))
    try {
      const result = await testProviderConnection(provider, model)
      setTests((items) => ({ ...items, [provider.id]: { loading: false, success: true, message: t('connectionSuccess', { latency: result.latencyMs, status: result.status }) } }))
    } catch (cause) {
      setTests((items) => ({ ...items, [provider.id]: { loading: false, success: false, message: t('connectionFailed', { message: cause instanceof Error ? cause.message : t('unableToTestConnection') }) } }))
    }
  }

  const save = () => {
    providers.filter((provider) => !drafts.some((draft) => draft.id === provider.id)).forEach((provider) => removeProvider(provider.id))
    drafts.forEach((provider) => providers.some((item) => item.id === provider.id) ? updateProvider(provider) : addProvider(provider))
    setSettingsOpen(false)
  }

  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label={t('settings')}>
    <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><h2 className="text-lg font-semibold">{t('settings')}</h2><p className="mt-0.5 text-xs text-slate-400">{t('providerDescription')}</p></div><div className="flex items-center gap-2"><label className="m-0 flex items-center gap-1 text-xs"><Languages size={15} />{t('language')}<select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="m-0 w-auto px-2 py-1"><option value="zh-CN">中文</option><option value="en">English</option></select></label><button onClick={() => setSettingsOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={t('closeSettings')}><X /></button></div></header>
      <div className="space-y-5 p-5">
        {session && <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"><h3 className="font-semibold">{t('chatSettings')}</h3><label>{t('systemPrompt')}<textarea value={session.systemPrompt} onChange={(event) => updateSession(session.id, { systemPrompt: event.target.value })} placeholder={t('systemPromptHint')} rows={3} /></label><label>{t('temperature')}<input type="range" min="0" max="2" step="0.1" value={session.temperature} onChange={(event) => updateSession(session.id, { temperature: Number(event.target.value) })} /><span className="text-xs text-slate-400">{session.temperature} · {t('temperatureHint')}</span></label></div>}
        <h3 className="font-semibold">{t('providersAndModels')}</h3>{drafts.map((provider) => {
          const test = tests[provider.id]
          const isFetching = fetching[provider.id]
          return <div key={provider.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="mb-3 flex gap-2"><input value={provider.name} onChange={(e) => patch(provider.id, { name: e.target.value })} aria-label={t('providerName')} className="flex-1" placeholder={t('providerName')} /><button onClick={() => setDrafts((items) => items.filter((item) => item.id !== provider.id))} className="rounded p-2 text-rose-300 hover:bg-rose-950/50" title={t('removeProvider')} aria-label={t('removeProvider')}><Trash2 size={17} /></button></div>
            <label>{t('baseUrl')}<input value={provider.baseUrl} onChange={(e) => patch(provider.id, { baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></label>
            <label>{t('apiKey')}<input type="password" value={provider.apiKey} onChange={(e) => patch(provider.id, { apiKey: e.target.value })} placeholder={t('apiKeyHint')} /></label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-slate-300">{t('models')} <span className="text-slate-500">{t('modelsAvailable', { count: provider.models.length })}</span></span><button type="button" onClick={() => void discoverModels(provider)} disabled={isFetching} className="button-secondary disabled:cursor-not-allowed disabled:opacity-60">{isFetching ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}{isFetching ? t('fetchingModels') : t('fetchModels')}</button></div>
            <textarea value={provider.models.map((model) => model.id).join('\n')} onChange={(e) => { const models = e.target.value.split('\n').map((value) => value.trim()).filter(Boolean).map((id) => ({ id, name: id, providerId: provider.id })); patch(provider.id, { models }); if (!models.some((item) => item.id === modelFor(provider))) setSelectedModel(provider.id, models[0]?.id ?? '') }} placeholder="gpt-4o-mini" rows={3} aria-label={t('modelsInput', { provider: provider.name })} />
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-end gap-2"><label className="mt-0 flex-1">{t('modelToTest')}<select value={modelFor(provider)} onChange={(e) => setSelectedModel(provider.id, e.target.value)} disabled={!provider.models.length} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"><option value="">{t('selectModel')}</option>{provider.models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label><button type="button" onClick={() => void testConnection(provider)} disabled={test?.loading || !modelFor(provider)} className="button-primary disabled:cursor-not-allowed disabled:opacity-60">{test?.loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}{test?.loading ? t('testing') : t('testConnection')}</button></div>
            {test?.message && <p role="status" className={`mt-3 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs ${test.success ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-200'}`}>{test.success ? <CheckCircle2 className="mt-0.5 shrink-0" size={14} /> : <AlertCircle className="mt-0.5 shrink-0" size={14} />}<span>{test.message}</span></p>}</div>
          </div>
        })}</div>
      <footer className="flex justify-between border-t border-slate-800 px-5 py-4"><button onClick={() => { const provider: Provider = { id: createId(), name: t('newProvider'), baseUrl: 'https://api.openai.com/v1', apiKey: '', enabled: true, models: [] }; setDrafts((items) => [...items, provider]); setSelectedModel(provider.id, '') }} className="button-secondary"><Plus size={17} /> {t('addProvider')}</button><button onClick={save} className="button-primary"><Save size={17} /> {t('save')}</button></footer>
    </section>
  </div>
}
