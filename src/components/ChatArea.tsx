import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Send, StopCircle, Bot, User } from 'lucide-react';
import { streamChatCompletion } from '../services/api';

export const ChatArea: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    providers,
    activeProviderId,
    activeModelId
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeProvider = providers.find((p) => p.id === (activeConversation?.providerId || activeProviderId));

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(input.trim().slice(0, 15));
    }

    const userText = input.trim();
    setInput('');

    // 1. 添加用户消息
    addMessage(convId, {
      conversationId: convId,
      role: 'user',
      content: userText,
      status: 'completed'
    });

    // 2. 创建 Assistant 占位消息
    const assistantMsgId = addMessage(convId, {
      conversationId: convId,
      role: 'assistant',
      content: '',
      status: 'streaming'
    });

    setIsGenerating(true);

    try {
      const currentConv = useAppStore.getState().conversations.find((c) => c.id === convId);
      const history = currentConv ? currentConv.messages.slice(0, -1) : []; // 不包含刚建立的空白 assistant 消息

      if (!activeProvider) {
        throw new Error('未配置模型供应商 Provider');
      }

      let accumulated = '';
      await streamChatCompletion({
        provider: activeProvider,
        modelId: activeConversation?.modelId || activeModelId || 'gemini-3.6-flash',
        messages: [...history, { id: 'temp', conversationId: convId, role: 'user', content: userText, timestamp: Date.now() }],
        onChunk: (chunk) => {
          accumulated += chunk;
          updateMessage(convId!, assistantMsgId, {
            content: accumulated,
            status: 'streaming'
          });
        }
      });

      updateMessage(convId, assistantMsgId, {
        status: 'completed'
      });
    } catch (err: any) {
      updateMessage(convId, assistantMsgId, {
        content: `请求失败: ${err.message || '未知错误'}`,
        status: 'error',
        error: err.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* 顶部对话标题 */}
      <div className="h-12 border-b border-zinc-800/80 px-4 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/30 backdrop-blur">
        <div className="font-medium text-zinc-200">
          {activeConversation ? activeConversation.title : '新对话'}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            {activeProvider?.name || 'Provider'}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300">
            {activeConversation?.modelId || activeModelId}
          </span>
        </div>
      </div>

      {/* 消息历史渲染区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500">
              <Bot size={24} />
            </div>
            <div className="text-sm font-medium text-zinc-300">LiteChat 轻量级 AI 客户端</div>
            <div className="text-xs max-w-sm">输入问题开启对话。支持自由配置 OpenAI Compatible / Custom 接口及流式响应。</div>
          </div>
        ) : (
          activeConversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl mx-auto ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-blue-400'
                }`}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.status === 'error'
                    ? 'bg-red-950/40 border border-red-800/60 text-red-200 rounded-tl-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                }`}
              >
                {msg.content || (msg.status === 'streaming' ? '思考中...' : '')}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部输入框 */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
        <div className="max-w-3xl mx-auto relative flex items-end bg-zinc-900 border border-zinc-800 focus-within:border-blue-500 rounded-2xl shadow-lg p-2 transition">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息，Enter 发送，Shift + Enter 换行..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none px-2 py-1"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition shadow"
            >
              {isGenerating ? <StopCircle size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
        <div className="text-[10px] text-center text-zinc-600 mt-2">
          LiteChat 支持自定义 API 代理与模型供应商
        </div>
      </div>
    </div>
  );
};
