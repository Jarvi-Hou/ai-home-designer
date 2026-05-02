'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import BudgetCalculator from '@/components/BudgetCalculator';
import RenovationJourney from '@/components/RenovationJourney';

const MermaidBlock = dynamic(() => import('@/components/MermaidBlock'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-400 py-4">图表加载中...</div>,
});
import { useChatHistory } from '@/hooks/useChatHistory';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

function compressImage(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportChat(messages: Message[]) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let text = `# AI 家居设计师 - 对话记录\n\n导出时间：${now.toLocaleString('zh-CN')}\n\n---\n\n`;
  for (const msg of messages) {
    const label = msg.role === 'user' ? '🙋 我' : '🏠 AI 设计师';
    text += `### ${label}\n\n${msg.content}\n\n---\n\n`;
  }
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `装修方案-${dateStr}.md`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sessions,
    currentId,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    clearCurrent,
  } = useChatHistory();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 切换对话时加载消息
  useEffect(() => {
    const session = sessions.find((s) => s.id === currentId);
    if (session) {
      setMessages(session.messages);
    }
  }, [currentId, sessions]);

  const sendMessage = useCallback(
    async (content: string, image?: string | null) => {
      if ((!content.trim() && !image) || isLoading) return;

      let sessionId = currentId;
      if (!sessionId) {
        sessionId = createSession();
      }

      const userMessage: Message = {
        role: 'user',
        content: content.trim() || (image ? '请帮我分析这张装修效果图' : ''),
        ...(image ? { image } : {}),
      };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      setPendingImage(null);
      setIsLoading(true);
      if (inputRef.current) inputRef.current.style.height = 'auto';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              ...(m.image ? { image: m.image } : {}),
            })),
          }),
        });

        if (!response.ok) throw new Error('请求失败');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应');

        const decoder = new TextDecoder();
        let assistantContent = '';

        const messagesWithAssistant = [
          ...newMessages,
          { role: 'assistant' as const, content: '' },
        ];
        setMessages(messagesWithAssistant);

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
              const updated = [
                ...newMessages,
                { role: 'assistant' as const, content: assistantContent },
              ];
              setMessages(updated);
            } catch {
              // 跳过
            }
          }
        }

        // 保存到历史
        const finalMessages = [
          ...newMessages,
          { role: 'assistant' as const, content: assistantContent },
        ];
        setMessages(finalMessages);
        if (sessionId) {
          updateSession(sessionId, finalMessages);
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessages = [
          ...newMessages,
          {
            role: 'assistant' as const,
            content: '抱歉，请求出了点问题，请稍后再试。',
          },
        ];
        setMessages(errorMessages);
        if (sessionId) {
          updateSession(sessionId, errorMessages);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, currentId, createSession, updateSession, pendingImage]
  );

  const handleNewChat = () => {
    setMessages([]);
    clearCurrent();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input, pendingImage);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('图片不能超过 10MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
    } catch {
      alert('图片处理失败，请换一张试试');
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={switchSession}
        onNew={handleNewChat}
        onDelete={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 主区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部 */}
        <header className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">🏠 AI 家居设计师</h1>
            <p className="text-xs text-gray-500 truncate">基于小米 MiMo · 专业装修顾问</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                onClick={() => exportChat(messages)}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50
                  rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 whitespace-nowrap"
              >
                📥 导出
              </button>
            )}
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 text-sm text-orange-600 bg-orange-50
                rounded-lg hover:bg-orange-100 transition-colors border border-orange-200 whitespace-nowrap"
            >
              ✨ 新对话
            </button>
          </div>
        </header>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto chat-container px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-4">🏡</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                你好，我是你的 AI 装修顾问
              </h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                15 年装修经验，帮你规划预算、推荐风格、选择材料、避开装修坑
              </p>

              {/* 工具入口 */}
              <div className="w-full max-w-lg mb-6 flex flex-wrap gap-3">
                <BudgetCalculator onAsk={sendMessage} />
                <RenovationJourney onAsk={sendMessage} />
              </div>

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
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="上传的图片"
                      className="max-w-full rounded-lg mb-2 max-h-60 object-cover"
                    />
                  )}
                  {msg.role === 'assistant' ? (
                    <div
                      className={`prose-chat text-[15px] leading-relaxed ${
                        isLoading && i === messages.length - 1
                          ? 'typing-cursor'
                          : ''
                      }`}
                    >
                      {msg.content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children }) {
                              const match = /language-mermaid/.exec(className || '');
                              const isStreamingThis = isLoading && i === messages.length - 1;
                              if (match && !isStreamingThis) {
                                return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
                              }
                              if (match) {
                                return (
                                  <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto">
                                    <code>{children}</code>
                                  </pre>
                                );
                              }
                              return (
                                <code className={`${className || ''} bg-gray-100 px-1.5 py-0.5 rounded text-sm`}>
                                  {children}
                                </code>
                              );
                            },
                            pre({ children }) {
                              return <>{children}</>;
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="thinking-dot" />
                          <span className="thinking-dot [animation-delay:0.2s]" />
                          <span className="thinking-dot [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content && (
                      <div className="text-[15px] leading-relaxed">
                        {msg.content}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {pendingImage && (
              <div className="relative inline-block mb-2">
                <img
                  src={pendingImage}
                  alt="待发送图片"
                  className="h-20 rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white
                    rounded-full text-xs flex items-center justify-center hover:bg-gray-800"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50
                  rounded-xl transition-colors shrink-0 disabled:opacity-40"
                title="上传效果图"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={pendingImage ? "描述你想了解的内容（可直接发送）..." : "描述你的装修需求...（Enter 发送，Shift+Enter 换行）"}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5
                  text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                  placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input, pendingImage)}
                disabled={(!input.trim() && !pendingImage) || isLoading}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium
                  hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors shrink-0"
              >
                {isLoading ? '回复中...' : '发送'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            AI 建议仅供参考，具体方案请以实际情况为准 · 支持上传效果图分析
          </p>
        </div>
      </div>
    </div>
  );
}
