'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import DecisionPanel from '@/components/DecisionPanel';
import ConstructionPanel from '@/components/ConstructionPanel';
import { parseProgress } from '@/lib/parseProgress';
import { parseConstruction } from '@/lib/parseConstruction';
import { ProgressData, Decision } from '@/lib/progressTypes';
import { ConstructionData } from '@/lib/constructionTypes';

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

function exportDecisionsPdf(progress: ProgressData) {
  const confirmed = progress.decisions.filter((d) => d.status === 'confirmed');
  const pending = progress.decisions.filter((d) => d.status !== 'confirmed');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const formatMoney = (n: number | null) => {
    if (n === null) return '待定';
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
    return `${n}元`;
  };

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>装修方案 - ${dateStr}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
  h1 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 8px; }
  h2 { color: #444; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
  th { background: #f8f8f8; }
  .summary { display: flex; gap: 20px; margin: 16px 0; }
  .summary-card { flex: 1; background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 12px; color: #888; }
  .summary-card .value { font-size: 20px; font-weight: bold; color: #ea580c; margin-top: 4px; }
  .pending { color: #999; font-style: italic; }
  .footer { margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style></head><body>
<h1>🏠 装修需求方案</h1>
<p>生成时间：${now.toLocaleString('zh-CN')}</p>

<div class="summary">
  <div class="summary-card">
    <div class="label">总预算</div>
    <div class="value">${formatMoney(progress.budget.total)}</div>
  </div>
  <div class="summary-card">
    <div class="label">已分配</div>
    <div class="value">${formatMoney(progress.budget.allocated)}</div>
  </div>
  <div class="summary-card">
    <div class="label">时间线</div>
    <div class="value" style="font-size:16px">${
      progress.timeline.start && progress.timeline.end
        ? `${progress.timeline.start} → ${progress.timeline.end}`
        : '待确定'
    }</div>
  </div>
</div>

<h2>✅ 已确定项目</h2>
<table>
  <tr><th>项目</th><th>分类</th><th>决策</th><th>预估费用</th></tr>
  ${confirmed.map((d) => `<tr>
    <td>${d.label}</td><td>${d.category}</td>
    <td>${d.value || '—'}</td><td>${formatMoney(d.estimated_cost)}</td>
  </tr>`).join('')}
</table>`;

  if (pending.length > 0) {
    html += `<h2>⏳ 待定项目</h2>
<table>
  <tr><th>项目</th><th>分类</th><th>状态</th></tr>
  ${pending.map((d) => `<tr>
    <td>${d.label}</td><td>${d.category}</td>
    <td class="pending">${d.status === 'revisiting' ? '修改中' : '待定'}</td>
  </tr>`).join('')}
</table>`;
  }

  html += `<div class="footer">
  由 AI 家居设计师 生成 · 请将此文档交给装修公司作为报价参考
</div></body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'quest' | 'construction'>('quest');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [construction, setConstruction] = useState<ConstructionData | null>(null);
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

  // Restore progress when switching sessions
  useEffect(() => {
    const session = sessions.find((s) => s.id === currentId);
    if (session) {
      setMessages(session.messages);
      const lastAssistant = [...session.messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        const { construction: restoredC } = parseConstruction(lastAssistant.content);
        if (restoredC) {
          setMode('construction');
          setConstruction(restoredC);
          setProgress(null);
        } else {
          const { progress: restored } = parseProgress(lastAssistant.content);
          setProgress(restored);
          setConstruction(null);
          if (restored) setMode('quest');
        }
      } else {
        setProgress(null);
        setConstruction(null);
      }
    }
  }, [currentId, sessions]);

  const displayMessages = useMemo(() => {
    return messages.map((msg) => {
      if (msg.role === 'assistant' && msg.content) {
        const { displayContent: d1 } = parseProgress(msg.content);
        const { displayContent: d2 } = parseConstruction(d1);
        return { ...msg, content: d2 };
      }
      return msg;
    });
  }, [messages]);

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
            mode,
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
              // skip
            }
          }
        }

        // Parse progress/construction from final content
        if (mode === 'construction') {
          const { construction: parsed } = parseConstruction(assistantContent);
          if (parsed) {
            setConstruction(parsed);
            if (!panelOpen) setPanelOpen(true);
          }
        } else {
          const { progress: parsed } = parseProgress(assistantContent);
          if (parsed) {
            setProgress(parsed);
            if (!panelOpen && parsed.decisions.length > 0) {
              setPanelOpen(true);
            }
          }
        }

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
    [messages, isLoading, currentId, createSession, updateSession, pendingImage, panelOpen, mode]
  );

  const handleNewChat = () => {
    setMessages([]);
    setProgress(null);
    setConstruction(null);
    setPanelOpen(false);
    setMode('quest');
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

  const handleDiscussItem = (decision: Decision) => {
    sendMessage(`我想修改关于「${decision.label}」的决定`);
  };

  const handleExportPdf = () => {
    if (progress) exportDecisionsPdf(progress);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={switchSession}
        onNew={handleNewChat}
        onDelete={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex min-w-0">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
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
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {mode === 'construction' ? '🔧 施工跟进' : '🏠 装修闯关'}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {mode === 'construction' ? '盯质量、控预算、管进度' : '一步步帮你搞定装修方案'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(progress || construction) && (
                <button
                  onClick={() => setPanelOpen(!panelOpen)}
                  className={`px-3 py-1.5 text-sm rounded-lg hover:opacity-80 transition-colors border whitespace-nowrap ${
                    mode === 'construction'
                      ? 'text-blue-600 bg-blue-50 border-blue-200'
                      : 'text-orange-600 bg-orange-50 border-orange-200'
                  }`}
                >
                  {mode === 'construction' ? '🔧 进度' : '📋 方案'}
                  {mode === 'quest' && progress && progress.decisions.filter((d) => d.is_new).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full">
                      {progress.decisions.filter((d) => d.is_new).length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleNewChat}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50
                  rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 whitespace-nowrap"
              >
                ✨ 新对话
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto chat-container px-4 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl mb-4">🏠</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  AI 装修助手
                </h2>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                  选择你当前的阶段，开始装修之旅
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg px-4">
                  <button
                    onClick={() => {
                      setMode('quest');
                      sendMessage('开始装修闯关');
                    }}
                    className="flex-1 p-5 bg-white border-2 border-orange-200 rounded-2xl
                      hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100
                      transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="font-bold text-gray-800 mb-1">装修闯关</div>
                    <div className="text-sm text-gray-500">
                      还没开工？一步步做决策，导出方案给装修公司报价
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMode('construction');
                      sendMessage('开始施工跟进');
                    }}
                    className="flex-1 p-5 bg-white border-2 border-blue-200 rounded-2xl
                      hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100
                      transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">🔧</div>
                    <div className="font-bold text-gray-800 mb-1">施工跟进</div>
                    <div className="text-sm text-gray-500">
                      已经开工？帮你盯质量、控预算、管进度
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              displayMessages.map((msg, i) => (
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
                          isLoading && i === displayMessages.length - 1
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
                                const isStreamingThis = isLoading && i === displayMessages.length - 1;
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
                  placeholder="回答问题、输入你的选择...（Enter 发送）"
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
              {mode === 'construction'
                ? '告诉我施工进展 · 拍照给我看现场 · 说&ldquo;通过&rdquo;进入下一阶段'
                : '输入&ldquo;跳过&rdquo;跳过当前问题 · 输入&ldquo;导出&rdquo;生成方案文档 · 支持上传效果图'}
            </p>
          </div>
        </div>

        {/* Side Panel */}
        {mode === 'construction' ? (
          <ConstructionPanel
            data={construction}
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        ) : (
          <DecisionPanel
            progress={progress}
            onDiscussItem={handleDiscussItem}
            onExportPdf={handleExportPdf}
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
