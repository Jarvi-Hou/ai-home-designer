import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const apiKey = process.env.MIMO_API_KEY;
  const apiBase = process.env.MIMO_API_BASE || 'https://token-plan-cn.xiaomimimo.com/v1';
  const model = process.env.MIMO_MODEL || 'mimo-v2.5-pro';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 MIMO_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error: `API 调用失败: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 转发流式响应
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              // 跳过无法解析的行
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
