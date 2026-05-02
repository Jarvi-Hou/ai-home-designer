import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';

// 简单的内存速率限制：每个 IP 每分钟最多 10 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 每分钟最大请求数
const RATE_WINDOW = 60 * 1000; // 1 分钟

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// 定期清理过期记录
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((val, key) => {
    if (now > val.resetAt) rateLimitMap.delete(key);
  });
}, 60 * 1000);

export async function POST(req: NextRequest) {
  // 速率限制
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: '请求太频繁，请稍后再试（每分钟限 10 次）' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages } = await req.json();

  // 限制对话轮数，防止恶意消耗 token
  const trimmedMessages = messages.slice(-20).map(
    (m: { role: string; content: string; image?: string }) => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: 'image_url', image_url: { url: m.image } },
            { type: 'text', text: m.content || '请分析这张装修效果图' },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }
  );

  const apiKey = process.env.MIMO_API_KEY;
  const apiBase = process.env.MIMO_API_BASE || 'https://token-plan-cn.xiaomimimo.com/v1';
  const textModel = process.env.MIMO_MODEL || 'mimo-v2.5-pro';
  const visionModel = process.env.MIMO_VISION_MODEL || 'mimo-v2.5';
  const hasImage = messages.some((m: { image?: string }) => m.image);
  const model = hasImage ? visionModel : textModel;

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
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmedMessages],
      stream: true,
      max_tokens: 8000, // 装修建议内容较长，给足空间
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
