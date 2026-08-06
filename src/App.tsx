import { ChatArea } from './components/ChatArea'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'

function App() {
  return <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 md:flex-row"><Sidebar /><ChatArea /><SettingsModal /></div>
}

export default App
