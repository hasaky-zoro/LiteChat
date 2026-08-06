import React from 'react';
import { useAppStore } from '../store';
import { MessageSquarePlus, Settings, PanelLeft, Bot, Trash2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    sidebarOpen,
    toggleSidebar,
    setSettingsOpen,
    providers,
    activeProviderId,
    activeModelId,
    setActiveProviderAndModel
  } = useAppStore();

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 bg-zinc-900 border-r border-zinc-800 w-14">
        <button
          onClick={toggleSidebar}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          title="展开侧边栏"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={() => createConversation()}
          className="p-2 mt-4 text-blue-400 hover:bg-zinc-800 rounded-lg transition"
          title="新建对话"
        >
          <MessageSquarePlus size={18} />
        </button>
        <div className="mt-auto">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
            title="设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0">
      {/* 顶部标题栏 / 操作项 */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-zinc-100">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow">
            LC
          </div>
          <span>LiteChat</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* 新建对话按钮 */}
      <div className="p-3">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl shadow transition"
        >
          <MessageSquarePlus size={18} />
          <span>新建对话</span>
        </button>
      </div>

      {/* 模型选择器简易下拉框 */}
      <div className="px-3 pb-3 border-b border-zinc-800/60">
        <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
          <Bot size={12} />
          <span>当前模型</span>
        </div>
        <select
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 p-2 outline-none focus:border-blue-500"
          value={`${activeProviderId}:${activeModelId}`}
          onChange={(e) => {
            const [pId, mId] = e.target.value.split(':');
            setActiveProviderAndModel(pId, mId);
          }}
        >
          {providers.map((p) => (
            <optgroup key={p.id} label={p.name}>
              {p.models.map((m) => (
                <option key={m.id} value={`${p.id}:${m.id}`}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">暂无历史对话</div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded transition"
                  title="删除对话"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 底部设置 */}
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-2.5 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition text-sm"
        >
          <Settings size={18} />
          <span>设置与供应商</span>
        </button>
      </div>
    </aside>
  );
};
