# LiteChat 💬

轻量级、跨平台 AI 对话客户端，支持自定义模型供应商与 API 接入。设计理念与核心功能架构参考 [Cherry Studio](https://github.com/CherryHQ/cherry-studio)。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ 核心特性 (Features)

1. **多端支持 (Multi-Platform Support)**
   - 桌面端 (Windows / macOS / Linux) & Web 端支持。
   - 采用 Electron / Tauri + React / Vue 架构，实现跨平台一致的 UI/UX。

2. **自定义供应商与模型 (Custom Provider & Model Management)**
   - 自由配置 OpenAI、Claude (Anthropic)、Gemini (Google)、Ollama、DeepSeek 以及任意兼容 OpenAI 接口标准的 API 供应商。
   - 支持自定义 Model ID、Base URL、API Key 以及请求头。

3. **多会话与助手（Prompt / Assistant Library）**
   - 支持创建不同系统提示词（System Prompt）的 AI 助手。
   - 灵活的会话管理，支持会话导入、导出与历史记录检索。

4. **流式响应与丰富渲染 (Streaming & Rich Text Rendering)**
   - 实时打字机流式输出。
   - 支持 Markdown 格式、代码高亮、MathJax/KaTeX 语法渲染。

5. **隐私与本地数据存储 (Privacy First)**
   - 所有配置与聊天记录加密存储于本地设备，无服务端转存。

---

## 🛠 技术选型方案 (Tech Stack Recommendation)

推荐采用以下两种方案之一进行项目开发：

### 方案 A: Tauri v2 + React + TypeScript + Tailwind CSS (推荐)
- **优势**: 体积超小（< 20MB）、内存占用极低、性能强劲、原生多端支持（桌面端及移动端）。
- **前端状态**: Zustand / Jotai + TanStack Query。

### 方案 B: Electron + React + TypeScript + Tailwind CSS
- **优势**: 生态极其成熟、Web/桌面代码复用率高、API 兼容性极佳。

---

## 📂 项目目录结构架构 (Project Architecture)

```text
LiteChat/
├── src/
│   ├── assets/              # 静态资源 (图标、图片等)
│   ├── components/          # UI 通用组件
│   │   ├── chat/            # 聊天窗口、输入框、消息列表
│   │   ├── sidebar/         # 会话列表、助手切换
│   │   ├── settings/        # 供应商设置、模型管理
│   │   └── ui/              # 基础 UI 组件 (Button, Modal, Input 等)
│   ├── config/              # 默认配置与预设 Provider
│   ├── hooks/               # React Hooks (流式接收、状态处理)
│   ├── services/            # 核心业务服务
│   │   ├── providers/       # OpenAI, Claude, Ollama, Custom 适配器
│   │   └── storage/         # 本地持久化 (IndexedDB / SQLite / LocalStorage)
│   ├── store/               # 全局状态管理 (Zustand)
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数 (Markdown 渲染、流处理)
├── public/
├── package.json
├── README.md
└── LICENSE
```

---

## 🚀 核心架构设计思路 (Inspired by Cherry Studio)

### 1. 统一 Provider 抽象接口

```typescript
export interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: Model[];
  type: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';
}

export interface Model {
  id: string;
  name: string;
  contextWindow?: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### 2. 流式 API 请求调度 (SSE / Stream Handler)

通过 Fetch API + `ReadableStream` 封装流式接收，统一抹平不同供应商的返回格式格式差异。

---

## 📄 开源协议 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
