import { Send, Square, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createAbortController, streamChatCompletion } from '../services/api'
import { useChatStore } from '../store/useChatStore'
import type { Message } from '../types'

export function ChatArea() {
  const { sessions, activeSessionId, providers, addMessage, updateMessage } = useChatStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [streaming, setStreaming] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const session = sessions.find((item) => item.id === activeSessionId)
  const provider = providers.find((item) => item.id === session?.providerId)
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [session?.messages, streaming])
  const send = async () => {
    if (!session || !provider || !input.trim() || streaming) return
    const user: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), createdAt: Date.now() }
    const assistant: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', createdAt: Date.now() }
    setInput(''); setError(''); addMessage(session.id, user); addMessage(session.id, assistant); setStreaming(true)
    controller.current = createAbortController()
    try {
      const messages = [...(session.systemPrompt ? [{ role: 'system' as const, content: session.systemPrompt }] : []), ...session.messages, user].map(({ role, content }) => ({ role, content }))
      await streamChatCompletion(provider, session.modelId, messages, session.temperature, (delta) => {
        const current = useChatStore.getState().sessions.find((item) => item.id === session.id)?.messages.find((item) => item.id === assistant.id)?.content ?? ''
        updateMessage(session.id, assistant.id, current + delta)
      }, controller.current.signal)
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Something went wrong.')
    } finally { controller.current = null; setStreaming(false) }
  }
  if (!session) return <main className="flex flex-1 items-center justify-center p-6 text-center text-slate-400"><div><Sparkles className="mx-auto mb-3 text-sky-400" size={32} /><h2 className="text-xl font-semibold text-slate-200">Start a conversation</h2><p className="mt-1">Create a new chat, then configure your provider in Settings.</p></div></main>
  return <main className="flex min-w-0 flex-1 flex-col bg-slate-950"><header className="border-b border-slate-800 px-5 py-4"><h2 className="truncate font-semibold">{session.title}</h2><p className="truncate text-xs text-slate-500">{provider?.name ?? 'Missing provider'} · {session.modelId || 'No model selected'}</p></header>
    <div className="flex-1 overflow-y-auto"><div className="mx-auto max-w-3xl space-y-5 p-5">{session.messages.map((message) => <article key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-sky-500 px-4 py-3 text-slate-950' : 'prose prose-invert max-w-none text-slate-200'}>{message.role === 'assistant' ? <ReactMarkdown>{message.content || (streaming ? 'Thinking…' : '')}</ReactMarkdown> : message.content}</article>)}{error && <p className="rounded-lg bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}<div ref={bottom} /></div></div>
    <form onSubmit={(e) => { e.preventDefault(); void send() }} className="border-t border-slate-800 p-4"><div className="mx-auto flex max-w-3xl gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2 focus-within:border-sky-500"><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} placeholder="Message LiteChat…" rows={1} className="max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-1 focus:ring-0" />{streaming ? <button type="button" onClick={() => controller.current?.abort()} className="icon-button" title="Stop"><Square size={18} /></button> : <button disabled={!input.trim()} className="icon-button bg-sky-500 text-slate-950 disabled:opacity-40" title="Send"><Send size={18} /></button>}</div></form>
  </main>
}
