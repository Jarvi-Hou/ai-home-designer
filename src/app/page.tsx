'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  '🏠 90平三室一厅，预算15万，推荐什么风格？',
  '💰 帮我做一份装修预算清单',
  '🔧 全包和半包怎么选？',
  '🎨 现在最流行什么装修风格？',
  '⚠️ 装修有哪些常见的坑？',
  '🧱 瓷砖怎么挑选不踩雷？',
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            assistantContent += json.content || '';
            setMessages([
              ...newMessages,
              { role: 'assistant', content: assistantContent },
            ]);
          } catch {
            // 跳过
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '抱歉，请求出了点问题，请稍后再试。',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* 顶部 */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">
          🏠 AI 家居设计师
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          基于小米 MiMo · 专业装修顾问，有问必答
        </p>
      </header>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto chat-container px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">🏡</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              你好，我是你的 AI 装修顾问
            </h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              15 年装修经验，帮你规划预算、推荐风格、选择材料、避开装修坑
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200
                    bg-white hover:bg-orange-50 hover:border-orange-300
                    transition-all text-sm text-gray-700 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`message-bubble flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className={`prose-chat text-[15px] leading-relaxed whitespace-pre-wrap ${
                      isLoading && i === messages.length - 1
                        ? 'typing-cursor'
                        : ''
                    }`}
                  >
                    {msg.content || '思考中...'}
                  </div>
                ) : (
                  <div className="text-[15px] leading-relaxed">{msg.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的装修需求...（Enter 发送，Shift+Enter 换行）"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
              placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium
              hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors shrink-0"
          >
            {isLoading ? '回复中...' : '发送'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          AI 建议仅供参考，具体方案请以实际情况为准
        </p>
      </div>
    </div>
  );
}
