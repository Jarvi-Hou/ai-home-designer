import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { CONSTRUCTION_PROMPT } from '@/lib/constructionPrompt';

export const maxDuration = 60; // Vercel Serverless Function timeout (seconds)

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

  const { messages, mode, projectContext } = await req.json();
  const basePrompt = mode === 'construction' ? CONSTRUCTION_PROMPT : SYSTEM_PROMPT;
  const systemPrompt = projectContext ? `${projectContext}\n\n${basePrompt}` : basePrompt;

  // 智能上下文管理：超过 16 条时，将早期消息压缩为摘要
  const allMessages = messages.map(
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

  let trimmedMessages;
  if (allMessages.length > 16) {
    const oldMessages = allMessages.slice(0, -12);
    const recentMessages = allMessages.slice(-12);
    const summaryText = oldMessages
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string | Array<{ type: string; text?: string }> }) =>
        typeof m.content === 'string' ? m.content : m.content.find((c: { type: string }) => c.type === 'text')?.text || ''
      )
      .join('；');
    const summaryMessage = {
      role: 'system' as const,
      content: `[对话历史摘要] 用户之前咨询过：${summaryText.slice(0, 500)}`,
    };
    trimmedMessages = [summaryMessage, ...recentMessages];
  } else {
    trimmedMessages = allMessages.slice(-20);
  }

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
      messages: [{ role: 'system', content: systemPrompt }, ...trimmedMessages],
      stream: true,
      max_tokens: 8000, // 装修建议内容较长，给足空间
    }),
  });

  if (!response.ok) {
    let userMessage: string;
    if (response.status === 401 || response.status === 403) {
      userMessage = '密钥无效或已过期，请检查 MIMO_API_KEY 配置';
    } else if (response.status === 429) {
      userMessage = '请求太频繁，请稍后再试';
    } else if (response.status >= 500) {
      userMessage = 'AI 服务暂时不可用，请稍后重试';
    } else {
      userMessage = `API 调用失败 (${response.status})`;
    }
    return new Response(
      JSON.stringify({ error: userMessage, code: response.status }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
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
