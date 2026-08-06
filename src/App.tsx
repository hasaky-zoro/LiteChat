import { MessageCircle } from 'lucide-react'

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="max-w-md text-center">
        <MessageCircle aria-hidden="true" className="mx-auto mb-4 size-10 text-sky-400" />
        <h1 className="text-3xl font-semibold tracking-tight">LiteChat</h1>
        <p className="mt-2 text-slate-400">
          The chat experience is being prepared.
        </p>
      </section>
    </main>
  )
}

export default App
