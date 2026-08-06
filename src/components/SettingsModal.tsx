import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, Plus, Server, Key, Globe } from 'lucide-react';
import { Provider } from '../types';

export const SettingsModal: React.FC = () => {
  const { settingsOpen, setSettingsOpen, providers, updateProvider, addProvider } = useAppStore();
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');

  if (!settingsOpen) return null;

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[550px]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <Server size={18} className="text-blue-500" />
            <span>设置 & 供应商管理</span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧供应商列表 */}
          <div className="w-56 border-r border-zinc-800 p-2 overflow-y-auto space-y-1 bg-zinc-950/40">
            <div className="text-xs font-semibold text-zinc-500 px-2 py-1">模型供应商</div>
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProviderId(p.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition ${
                  selectedProviderId === p.id
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className={`w-2 h-2 rounded-full ${p.enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              </button>
            ))}

            <button
              onClick={() => {
                const newId = 'provider-' + Date.now();
                const newProv: Provider = {
                  id: newId,
                  name: '自定义供应商',
                  baseUrl: 'https://api.openai.com/v1',
                  apiKey: '',
                  enabled: true,
                  type: 'custom',
                  models: [{ id: 'gpt-4o', name: 'GPT-4o' }]
                };
                addProvider(newProv);
                setSelectedProviderId(newId);
              }}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs text-blue-400 hover:bg-blue-950/30 border border-blue-900/50 transition"
            >
              <Plus size={14} />
              <span>添加 Provider</span>
            </button>
          </div>

          {/* 右侧 Provider 详细配置 */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {currentProvider ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">供应商名称</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                    value={currentProvider.name}
                    onChange={(e) => updateProvider(currentProvider.id, { name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                    <Globe size={13} />
                    <span>Base URL</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 font-mono text-xs"
                    value={currentProvider.baseUrl}
                    onChange={(e) => updateProvider(currentProvider.id, { baseUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                    <Key size={13} />
                    <span>API Key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 font-mono text-xs"
                    value={currentProvider.apiKey}
                    onChange={(e) => updateProvider(currentProvider.id, { apiKey: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">包含模型列表 (逗号分隔)</label>
                  <textarea
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono"
                    value={currentProvider.models.map((m) => m.id).join(', ')}
                    onChange={(e) => {
                      const modelIds = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      updateProvider(currentProvider.id, {
                        models: modelIds.map((id) => ({ id, name: id }))
                      });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={currentProvider.enabled}
                      onChange={(e) => updateProvider(currentProvider.id, { enabled: e.target.checked })}
                      className="rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0"
                    />
                    <span>启用此 Provider</span>
                  </label>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
