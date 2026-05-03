'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import DecisionPanel from '@/components/DecisionPanel';
import ConstructionPanel from '@/components/ConstructionPanel';
import BudgetCalculator from '@/components/BudgetCalculator';
import RenovationJourney from '@/components/RenovationJourney';
import { parseProgress } from '@/lib/parseProgress';
import { parseConstruction } from '@/lib/parseConstruction';
import { ProgressData, Decision } from '@/lib/progressTypes';
import { ConstructionData } from '@/lib/constructionTypes';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useProjectStore } from '@/hooks/useProjectStore';
import { buildProjectContext } from '@/lib/buildProjectContext';

const MermaidBlock = dynamic(() => import('@/components/MermaidBlock'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-400 py-4">图表加载中...</div>,
});

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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function exportDecisionsPdf(progress: ProgressData, projectName?: string) {
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
<title>装修方案 - ${escapeHtml(dateStr)}</title>
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
<h1>🏠 ${projectName ? escapeHtml(projectName) + ' — ' : ''}装修需求方案</h1>
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
    <td>${escapeHtml(d.label)}</td><td>${escapeHtml(d.category)}</td>
    <td>${escapeHtml(d.value) || '—'}</td><td>${formatMoney(d.estimated_cost)}</td>
  </tr>`).join('')}
</table>`;

  if (pending.length > 0) {
    html += `<h2>⏳ 待定项目</h2>
<table>
  <tr><th>项目</th><th>分类</th><th>状态</th></tr>
  ${pending.map((d) => `<tr>
    <td>${escapeHtml(d.label)}</td><td>${escapeHtml(d.category)}</td>
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

const STAGE_LABELS: Record<string, string> = {
  basic_info: '基本信息',
  renovation_mode: '装修模式',
  hard_decoration: '硬装方案',
  main_materials: '主材选择',
  soft_furnishing: '软装方向',
  appliances: '家电清单',
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sendTip, setSendTip] = useState<string | null>(null);
  const [mode, setMode] = useState<'quest' | 'construction'>('quest');
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

  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    createProject,
    deleteProject,
    addSessionToProject,
    mergeProgress,
    mergeConstruction,
    renameProject,
  } = useProjectStore();

  // Project-level data for the right panel
  const projectProgress: ProgressData | null = useMemo(() => {
    if (!activeProject || activeProject.mode !== 'quest') return null;
    if (activeProject.decisions.length === 0) return null;
    return {
      current_stage: activeProject.currentStage,
      budget: activeProject.budget,
      timeline: activeProject.timeline,
      decisions: activeProject.decisions,
    };
  }, [activeProject]);

  const projectConstruction: ConstructionData | null = useMemo(() => {
    if (!activeProject || activeProject.mode !== 'construction') return null;
    return activeProject.constructionData;
  }, [activeProject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Restore messages when switching sessions
  useEffect(() => {
    const session = sessions.find((s) => s.id === currentId);
    if (session) {
      setMessages(session.messages);
      if (session.projectId) {
        setActiveProjectId(session.projectId);
        const proj = projects.find((p) => p.id === session.projectId);
        if (proj) setMode(proj.mode);
      }
    }
  }, [currentId, sessions, projects, setActiveProjectId]);

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
    async (content: string, image?: string | null, targetSessionId?: string) => {
      if (!content.trim() && !image) return;
      if (isLoading) {
        setSendTip('AI 正在回复，请稍候再发...');
        setTimeout(() => setSendTip(null), 2000);
        return;
      }

      let sessionId = targetSessionId || currentId;
      if (!sessionId) {
        sessionId = createSession(activeProjectId || undefined,
          activeProject ? (STAGE_LABELS[activeProject.currentStage] || activeProject.currentStage) : undefined
        );
        if (activeProjectId) {
          addSessionToProject(activeProjectId, sessionId);
        }
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

      // Build project context for AI
      const projectContext = activeProject && activeProject.decisions.length > 0
        ? buildProjectContext(activeProject)
        : undefined;

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
            projectContext,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || '请求出了点问题，请稍后再试');
        }

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

        // Parse and merge into project store
        if (mode === 'construction') {
          const { construction: parsed } = parseConstruction(assistantContent);
          if (parsed && activeProjectId) {
            mergeConstruction(activeProjectId, parsed);
            if (!panelOpen && parsed.stages.length > 0) setPanelOpen(true);
          }
        } else {
          const { progress: parsed } = parseProgress(assistantContent);
          if (parsed && activeProjectId) {
            mergeProgress(activeProjectId, parsed);
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
        const errMsg = error instanceof Error ? error.message : '请求出了点问题，请稍后再试';
        const errorMessages = [
          ...newMessages,
          {
            role: 'assistant' as const,
            content: `⚠️ ${errMsg}`,
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
    [messages, isLoading, currentId, createSession, updateSession, pendingImage, panelOpen, mode, activeProjectId, activeProject, addSessionToProject, mergeProgress, mergeConstruction]
  );

  const handleStartMode = (selectedMode: 'quest' | 'construction') => {
    const baseName = selectedMode === 'quest' ? '装修方案' : '施工跟进';
    const today = new Date().toISOString().slice(0, 10);
    const dateName = `${baseName} · ${today}`;
    const sameNameCount = projects.filter((p) => p.name.startsWith(dateName)).length;
    const name = sameNameCount === 0 ? dateName : `${dateName} (${sameNameCount + 1})`;
    const projectId = createProject(name, selectedMode);
    setMode(selectedMode);

    const sessionId = createSession(projectId,
      selectedMode === 'quest' ? '基本信息' : '施工开始'
    );
    addSessionToProject(projectId, sessionId);

    const firstMsg = selectedMode === 'quest' ? '开始装修闯关' : '开始施工跟进';
    // 直接传 sessionId，避免闭包陷阱（setTimeout 会捕获旧的 sendMessage，此时 currentId 还是 null）
    sendMessage(firstMsg, null, sessionId);
  };

  const handleNewChat = () => {
    setMessages([]);
    setPanelOpen(false);
    clearCurrent();
  };

  const handleDeleteProject = useCallback((id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      proj.sessionIds.forEach((sid) => deleteSession(sid));
    }
    deleteProject(id);
  }, [projects, deleteProject, deleteSession]);

  const handleNewProject = () => {
    setMessages([]);
    setPanelOpen(false);
    setMode('quest');
    clearCurrent();
    setActiveProjectId(null);
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
    if (projectProgress) exportDecisionsPdf(projectProgress, activeProject?.name);
  };

  // Get sessions for active project
  const projectSessions = useMemo(() => {
    if (!activeProjectId) return sessions;
    return sessions.filter((s) => s.projectId === activeProjectId);
  }, [sessions, activeProjectId]);

  // Whether to show mode selection (no active project)
  const showModeSelection = messages.length === 0 && !activeProjectId;
  // Whether to show "new chat within project" welcome
  const showProjectWelcome = messages.length === 0 && activeProjectId && !currentId;

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={projectSessions}
        currentId={currentId}
        onSelect={switchSession}
        onNew={activeProjectId ? handleNewChat : handleNewProject}
        onDelete={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          const proj = projects.find((p) => p.id === id);
          if (proj) setMode(proj.mode);
          clearCurrent();
          setMessages([]);
        }}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={renameProject}
      />

      <div className="flex-1 flex min-w-0">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="打开侧边栏"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 shrink-0 min-h-[44px] min-w-[44px]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {activeProject
                  ? `${mode === 'construction' ? '🔧' : '🏠'} ${activeProject.name}`
                  : '🏠 AI 装修助手'}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {mode === 'construction' ? '盯质量、控预算、管进度' : '一步步帮你搞定装修方案'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(projectProgress || projectConstruction) && (
                <button
                  onClick={() => setPanelOpen(!panelOpen)}
                  aria-label={mode === 'construction' ? '查看施工进度' : '查看装修方案'}
                  className={`px-3 py-1.5 text-sm rounded-lg hover:opacity-80 transition-colors border whitespace-nowrap min-h-[44px] ${
                    mode === 'construction'
                      ? 'text-blue-600 bg-blue-50 border-blue-200'
                      : 'text-orange-600 bg-orange-50 border-orange-200'
                  }`}
                >
                  {mode === 'construction' ? '🔧 进度' : '📋 方案'}
                </button>
              )}
              {activeProjectId && (
                <button
                  onClick={handleNewChat}
                  className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50
                    rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 whitespace-nowrap"
                >
                  ✨ 新对话
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto chat-container px-4 py-6 space-y-4">
            {showModeSelection ? (
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
                    onClick={() => handleStartMode('quest')}
                    className="flex-1 p-5 bg-white border-2 border-orange-200 rounded-2xl
                      hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100
                      transition-all text-left"
                  >
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="font-bold text-gray-800 mb-1">装修闯关</div>
                    <div className="text-sm text-gray-500">
                      还没开工？一步步做决策，导出方案给装修公司报价
                    </div>
                  </button>

                  <button
                    onClick={() => handleStartMode('construction')}
                    className="flex-1 p-5 bg-white border-2 border-blue-200 rounded-2xl
                      hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100
                      transition-all text-left"
                  >
                    <div className="text-3xl mb-2">🔧</div>
                    <div className="font-bold text-gray-800 mb-1">施工跟进</div>
                    <div className="text-sm text-gray-500">
                      已经开工？帮你盯质量、控预算、管进度
                    </div>
                  </button>
                </div>

                {projects.length > 0 && (
                  <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 mb-2">或继续已有项目</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProjectId(p.id);
                            setMode(p.mode);
                            clearCurrent();
                            setMessages([]);
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200
                            rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {p.mode === 'construction' ? '🔧' : '🏠'} {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-3 w-full max-w-lg px-4">
                  <RenovationJourney onAsk={(q) => sendMessage(q)} />
                </div>
              </div>
            ) : showProjectWelcome ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-4xl mb-3">
                  {mode === 'construction' ? '🔧' : '🏗️'}
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {activeProject?.name}
                </h3>
                <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
                  {projectProgress && projectProgress.decisions.length > 0
                    ? `已有 ${projectProgress.decisions.filter(d => d.status === 'confirmed').length} 项决策，继续讨论新话题`
                    : '开始新的对话，继续你的装修之旅'}
                </p>
                <button
                  onClick={() => sendMessage(
                    mode === 'construction' ? '继续施工跟进' : '继续装修闯关'
                  )}
                  className={`px-6 py-2.5 text-white rounded-xl text-sm font-medium
                    transition-colors shadow-lg ${
                    mode === 'construction'
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                  }`}
                >
                  💬 继续对话
                </button>
                {mode === 'quest' && (
                  <div className="mt-4 w-full max-w-sm">
                    <BudgetCalculator onAsk={(q) => sendMessage(q)} />
                  </div>
                )}
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
                  aria-label="上传效果图"
                  className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50
                    rounded-xl transition-colors shrink-0 disabled:opacity-40 min-h-[44px] min-w-[44px]"
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
            {sendTip && (
              <p className="text-xs text-orange-500 text-center mt-1 animate-pulse">
                {sendTip}
              </p>
            )}
            <p className="text-xs text-gray-400 text-center mt-1">
              {mode === 'construction'
                ? '告诉我施工进展 · 拍照给我看现场 · 说"通过"进入下一阶段'
                : '输入"跳过"跳过当前问题 · 输入"导出"生成方案文档 · 支持上传效果图'}
            </p>
          </div>
        </div>

        {/* Side Panel — reads from project-level data */}
        {mode === 'construction' ? (
          <ConstructionPanel
            data={projectConstruction}
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        ) : (
          <DecisionPanel
            progress={projectProgress}
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
