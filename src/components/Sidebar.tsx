import { MessageSquarePlus, Settings, Trash2 } from 'lucide-react'
import { useChatStore } from '../store/useChatStore'

export function Sidebar() {
  const { sessions, activeSessionId, createSession, selectSession, deleteSession, setSettingsOpen } = useChatStore()
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 p-3 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="text-lg font-bold tracking-tight text-sky-400">LiteChat</h1>
        <button onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title="Settings"><Settings size={18} /></button>
      </div>
      <button onClick={createSession} className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"><MessageSquarePlus size={17} /> New chat</button>
      <nav className="flex max-h-36 gap-1 overflow-x-auto md:max-h-none md:flex-1 md:flex-col md:overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className={`group flex min-w-40 items-center rounded-lg ${activeSessionId === session.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
            <button onClick={() => selectSession(session.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">{session.title}</button>
            <button onClick={() => deleteSession(session.id)} className="mr-1 rounded p-1.5 opacity-60 hover:bg-slate-700 hover:text-rose-300 md:opacity-0 md:group-hover:opacity-100" title="Delete chat"><Trash2 size={15} /></button>
          </div>
        ))}
      </nav>
      <p className="mt-3 hidden text-xs text-slate-600 md:block">Your chats and settings stay in this browser.</p>
    </aside>
  )
}
