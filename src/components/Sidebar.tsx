import { Languages, MessageSquarePlus, Settings, Trash2 } from 'lucide-react'
import { useI18n, useI18nStore } from '../i18n'
import { useChatStore } from '../store/useChatStore'

export function Sidebar() {
  const { sessions, activeSessionId, createSession, selectSession, deleteSession, setSettingsOpen } = useChatStore()
  const { language, t } = useI18n()
  const toggleLanguage = useI18nStore((state) => state.toggleLanguage)

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 p-3 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="text-lg font-bold tracking-tight text-sky-400">LiteChat</h1>
        <div className="flex items-center gap-1">
          <button onClick={toggleLanguage} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white" title={t('language')} aria-label={t('language')}><Languages size={16} />{language === 'zh-CN' ? '中' : 'EN'}</button>
          <button onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title={t('settings')} aria-label={t('settings')}><Settings size={18} /></button>
        </div>
      </div>
      <button onClick={createSession} className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"><MessageSquarePlus size={17} /> {t('newChat')}</button>
      <nav className="flex max-h-36 gap-1 overflow-x-auto md:max-h-none md:flex-1 md:flex-col md:overflow-y-auto">
        {sessions.map((session, index) => {
          const sessionId = typeof session.id === 'string' ? session.id : ''
          return <div key={sessionId || `session-${index}`} className={`group flex min-w-40 items-center rounded-lg ${activeSessionId === sessionId ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
            <button onClick={() => selectSession(sessionId)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">{session.title || t('newChat')}</button>
            <button onClick={() => deleteSession(sessionId)} className="mr-1 rounded p-1.5 opacity-60 hover:bg-slate-700 hover:text-rose-300 md:opacity-0 md:group-hover:opacity-100" title={t('deleteChat')} aria-label={t('deleteChat')}><Trash2 size={15} /></button>
          </div>
        })}
      </nav>
      <p className="mt-3 hidden text-xs text-slate-600 md:block">{t('chatsStored')}</p>
    </aside>
  )
}
