import { Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Provider } from '../types'
import { useChatStore } from '../store/useChatStore'

const blankProvider = (): Provider => ({ id: crypto.randomUUID(), name: 'New provider', baseUrl: 'https://api.openai.com/v1', apiKey: '', enabled: true, models: [] })

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, providers, updateProvider, addProvider, removeProvider } = useChatStore()
  const [drafts, setDrafts] = useState<Provider[]>(providers)
  useEffect(() => { if (settingsOpen) setDrafts(providers) }, [settingsOpen, providers])
  if (!settingsOpen) return null
  const save = () => {
    providers.filter((provider) => !drafts.some((draft) => draft.id === provider.id)).forEach((provider) => removeProvider(provider.id))
    drafts.forEach((provider) => providers.some((item) => item.id === provider.id) ? updateProvider(provider) : addProvider(provider))
    setSettingsOpen(false)
  }
  const patch = (providerId: string, changes: Partial<Provider>) => setDrafts((items) => items.map((item) => item.id === providerId ? { ...item, ...changes } : item))
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label="Settings">
    <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><h2 className="text-lg font-semibold">Providers & models</h2><button onClick={() => setSettingsOpen(false)} className="rounded p-1 text-slate-400 hover:text-white"><X /></button></header>
      <div className="space-y-5 p-5">{drafts.map((provider) => <div key={provider.id} className="rounded-lg border border-slate-700 p-4">
        <div className="mb-3 flex gap-2"><input value={provider.name} onChange={(e) => patch(provider.id, { name: e.target.value })} aria-label="Provider name" className="flex-1" placeholder="Provider name" /><button onClick={() => setDrafts((items) => items.filter((item) => item.id !== provider.id))} className="rounded p-2 text-rose-300 hover:bg-rose-950/50" title="Remove provider"><Trash2 size={17} /></button></div>
        <label>Base URL<input value={provider.baseUrl} onChange={(e) => patch(provider.id, { baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></label>
        <label>API key<input type="password" value={provider.apiKey} onChange={(e) => patch(provider.id, { apiKey: e.target.value })} placeholder="sk-..." /></label>
        <label>Models <span className="text-slate-500">(one per line)</span><textarea value={provider.models.map((model) => model.id).join('\n')} onChange={(e) => patch(provider.id, { models: e.target.value.split('\n').map((value) => value.trim()).filter(Boolean).map((model) => ({ id: model, name: model, providerId: provider.id })) })} placeholder="gpt-4o-mini" rows={3} /></label>
      </div>)}</div>
      <footer className="flex justify-between border-t border-slate-800 px-5 py-4"><button onClick={() => setDrafts((items) => [...items, blankProvider()])} className="button-secondary"><Plus size={17} /> Add provider</button><button onClick={save} className="button-primary"><Save size={17} /> Save settings</button></footer>
    </section>
  </div>
}
