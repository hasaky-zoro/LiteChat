import { Provider, Message } from '../types';

interface StreamOptions {
  provider: Provider;
  modelId: string;
  messages: Message[];
  onChunk: (chunk: string) => void;
}

export async function streamChatCompletion({
  provider,
  modelId,
  messages,
  onChunk
}: StreamOptions): Promise<void> {
  const url = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: formattedMessages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('未获取到 ReadableStream 响应流');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;

      if (trimmed === 'data: [DONE]') {
        return;
      }

      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.substring(6);
        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content || '';
          if (deltaContent) {
            onChunk(deltaContent);
          }
        } catch {
          // ignore parse errors for partial chunks
        }
      }
    }
  }
}
