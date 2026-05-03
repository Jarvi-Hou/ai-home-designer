'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import DecisionPanel from '@/components/DecisionPanel';
import ConstructionPanel from '@/components/ConstructionPanel';
import ModeSelectionScreen from '@/components/ModeSelectionScreen';
import ProjectWelcomeScreen from '@/components/ProjectWelcomeScreen';
import MessageBubble from '@/components/MessageBubble';
import ChatInputBar from '@/components/ChatInputBar';
import { parseProgress } from '@/lib/parseProgress';
import { parseConstruction } from '@/lib/parseConstruction';
import { ProgressData, Decision } from '@/lib/progressTypes';
import { ConstructionData } from '@/lib/constructionTypes';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useProjectStore } from '@/hooks/useProjectStore';
import { buildProjectContext } from '@/lib/buildProjectContext';

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
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
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
  <div class="summary-card"><div class="label">总预算</div><div class="value">${formatMoney(progress.budget.total)}</div></div>
  <div class="summary-card"><div class="label">已分配</div><div class="value">${formatMoney(progress.budget.allocated)}</div></div>
  <div class="summary-card"><div class="label">时间线</div><div class="value" style="font-size:16px">${
    progress.timeline.start && progress.timeline.end
      ? `${progress.timeline.start} → ${progress.timeline.end}`
      : '待确定'
  }</div></div>
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

  html += `<div class="footer">由 装修参谋 AI 生成 · 请将此文档交给装修公司作为报价参考</div></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
}

const STAGE_LABELS: Record<string, string> = {
  basic_info: '基本信息', renovation_mode: '装修模式', hard_decoration: '硬装方案',
  main_materials: '主材选择', soft_furnishing: '软装方向', appliances: '家电清单',
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

  const { sessions, currentId, createSession, updateSession, deleteSession, switchSession, clearCurrent } = useChatHistory();
  const { projects, activeProjectId, activeProject, setActiveProjectId, createProject, deleteProject,
    addSessionToProject, mergeProgress, mergeConstruction, renameProject } = useProjectStore();

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
    if (messages.length > 0) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        if (activeProjectId) addSessionToProject(activeProjectId, sessionId);
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

      const projectContext = activeProject && activeProject.decisions.length > 0
        ? buildProjectContext(activeProject) : undefined;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role, content: m.content, ...(m.image ? { image: m.image } : {}),
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

        setMessages([...newMessages, { role: 'assistant' as const, content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              assistantContent += json.content || '';
              setMessages([...newMessages, { role: 'assistant' as const, content: assistantContent }]);
            } catch { /* skip */ }
          }
        }

        // Fallback: if AI omitted [PROGRESS] block in quest mode, append current state
        // so the panel always has data and mergeProgress is called
        if (mode !== 'construction' && activeProjectId && !assistantContent.includes('[PROGRESS]')) {
          const fallback = activeProject ? {
            current_stage: activeProject.currentStage,
            budget: activeProject.budget,
            timeline: activeProject.timeline,
            decisions: activeProject.decisions.map((d) => ({ ...d, is_new: false })),
          } : { current_stage: 'basic_info', budget: { total: null, allocated: 0 }, timeline: { start: null, end: null }, decisions: [] };
          assistantContent += `\n\n[PROGRESS]\n${JSON.stringify(fallback)}\n[/PROGRESS]`;
        }

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
            if (!panelOpen && parsed.decisions.length > 0) setPanelOpen(true);
          }
        }

        const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
        setMessages(finalMessages);
        if (sessionId) updateSession(sessionId, finalMessages);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '请求出了点问题，请稍后再试';
        const errorMessages = [...newMessages, { role: 'assistant' as const, content: `⚠️ ${errMsg}` }];
        setMessages(errorMessages);
        if (sessionId) updateSession(sessionId, errorMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, currentId, createSession, updateSession, panelOpen, mode, activeProjectId, activeProject, addSessionToProject, mergeProgress, mergeConstruction]
  );

  const handleStartMode = (selectedMode: 'quest' | 'construction') => {
    const baseName = selectedMode === 'quest' ? '装修方案' : '施工跟进';
    const today = new Date().toISOString().slice(0, 10);
    const dateName = `${baseName} · ${today}`;
    const sameNameCount = projects.filter((p) => p.name.startsWith(dateName)).length;
    const name = sameNameCount === 0 ? dateName : `${dateName} (${sameNameCount + 1})`;
    const projectId = createProject(name, selectedMode);
    setMode(selectedMode);
    const sessionId = createSession(projectId, selectedMode === 'quest' ? '基本信息' : '施工开始');
    addSessionToProject(projectId, sessionId);
    sendMessage(selectedMode === 'quest' ? '开始装修闯关' : '开始施工跟进', null, sessionId);
  };

  const handleNewChat = () => { setMessages([]); setPanelOpen(false); clearCurrent(); };
  const handleNewProject = () => { setMessages([]); setPanelOpen(false); setMode('quest'); clearCurrent(); setActiveProjectId(null); };

  const handleDeleteProject = useCallback((id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (proj) proj.sessionIds.forEach((sid) => deleteSession(sid));
    deleteProject(id);
  }, [projects, deleteProject, deleteSession]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('图片不能超过 10MB'); return; }
    try { setPendingImage(await compressImage(file)); } catch { alert('图片处理失败，请换一张试试'); }
    e.target.value = '';
  };

  const projectSessions = useMemo(() => {
    if (!activeProjectId) return sessions;
    return sessions.filter((s) => s.projectId === activeProjectId);
  }, [sessions, activeProjectId]);

  const showModeSelection = messages.length === 0 && !activeProjectId;
  const showProjectWelcome = messages.length === 0 && activeProjectId && !currentId;
  const confirmedCount = activeProject?.decisions.filter((d: Decision) => d.status === 'confirmed').length ?? 0;

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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0 shadow-sm">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="打开侧边栏"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-slate-900 truncate tracking-tight">
                {activeProject ? `${mode === 'construction' ? '🔧' : '🏠'} ${activeProject.name}` : '🏠 装修参谋'}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {mode === 'construction' ? '盯质量 · 控预算 · 管进度' : '一步步帮你搞定装修方案'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeProject && (
                <button
                  onClick={() => setPanelOpen(!panelOpen)}
                  aria-label={mode === 'construction' ? '查看施工进度' : '查看装修方案'}
                  className={`px-3.5 py-1.5 text-sm rounded-xl hover:opacity-90 transition-all border whitespace-nowrap min-h-[44px] font-medium ${
                    mode === 'construction'
                      ? 'text-blue-600 bg-blue-50 border-blue-200'
                      : 'text-slate-700 bg-slate-100 border-slate-200'
                  }`}
                >
                  {mode === 'construction' ? '🔧 进度' : '📋 方案'}
                </button>
              )}
              {activeProjectId && (
                <button
                  onClick={handleNewChat}
                  className="px-3.5 py-1.5 text-sm text-slate-600 bg-slate-50 rounded-xl
                    hover:bg-slate-100 transition-colors border border-slate-200 whitespace-nowrap font-medium"
                >
                  ✨ 新对话
                </button>
              )}
            </div>
          </header>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto chat-container px-4 py-6 space-y-4 bg-slate-50">
            {showModeSelection ? (
              <ModeSelectionScreen
                projects={projects}
                onStartMode={handleStartMode}
                onSelectProject={(id) => {
                  setActiveProjectId(id);
                  const proj = projects.find((p) => p.id === id);
                  if (proj) setMode(proj.mode);
                  clearCurrent();
                  setMessages([]);
                }}
                onAsk={(q) => sendMessage(q)}
              />
            ) : showProjectWelcome ? (
              <ProjectWelcomeScreen
                projectName={activeProject?.name}
                mode={mode}
                confirmedCount={confirmedCount}
                onContinue={() => sendMessage(mode === 'construction' ? '继续施工跟进' : '继续装修闯关')}
                onAsk={(q) => sendMessage(q)}
              />
            ) : (
              displayMessages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  isStreaming={isLoading && i === displayMessages.length - 1}
                />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <ChatInputBar
            input={input}
            isLoading={isLoading}
            pendingImage={pendingImage}
            sendTip={sendTip}
            mode={mode}
            onInputChange={setInput}
            onSend={() => sendMessage(input, pendingImage)}
            onImageSelect={handleImageSelect}
            onClearImage={() => setPendingImage(null)}
          />
        </div>

        {/* Side Panel */}
        {mode === 'construction' ? (
          <ConstructionPanel data={projectConstruction} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
        ) : (
          <DecisionPanel
            progress={projectProgress}
            onDiscussItem={(d: Decision) => sendMessage(`我想修改关于「${d.label}」的决定`)}
            onExportPdf={() => { if (projectProgress) exportDecisionsPdf(projectProgress, activeProject?.name); }}
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
