import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar />
      <ChatArea />
      <SettingsModal />
    </div>
  );
}

export default App;
