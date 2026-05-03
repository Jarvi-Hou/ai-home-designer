'use client';

import { useState } from 'react';
import { ChatSession } from '@/hooks/useChatHistory';
import { Project } from '@/lib/projectTypes';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString())
    return '昨天';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50
          transform transition-transform duration-200 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 ${isOpen ? '' : 'md:-translate-x-full'}`}
      >
        {/* Header brand */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-sm">🏠</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">装修参谋</span>
          </div>

          {/* Project selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">项目</span>
              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + 新项目
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-3">
                选择模式开始第一个项目
              </div>
            ) : (
              <div className="space-y-0.5 max-h-36 overflow-y-auto">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer text-sm
                      transition-colors ${
                      p.id === activeProjectId
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                  >
                    <span className="shrink-0 text-base">
                      {p.mode === 'construction' ? '🔧' : '🏠'}
                    </span>
                    {editingId === p.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => {
                          if (editName.trim()) onRenameProject(p.id, editName.trim());
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editName.trim()) onRenameProject(p.id, editName.trim());
                            setEditingId(null);
                          }
                        }}
                        className="flex-1 min-w-0 text-sm bg-white border border-blue-400 rounded-lg px-1.5 py-0.5
                          focus:outline-none text-slate-900"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="flex-1 min-w-0 truncate text-sm"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingId(p.id);
                          setEditName(p.name);
                        }}
                      >
                        {p.name}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteProjectId(p.id);
                      }}
                      aria-label="删除项目"
                      className={`opacity-0 group-hover:opacity-100 transition-all text-xs p-0.5
                        min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg
                        ${p.id === activeProjectId
                          ? 'hover:bg-white/20 text-white/60 hover:text-white'
                          : 'hover:bg-slate-200 text-slate-400 hover:text-red-500'
                        }`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New chat button */}
        {activeProject && (
          <div className="px-3 py-2.5 border-b border-slate-100">
            <button
              onClick={() => {
                onNew();
                onClose();
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                text-white rounded-xl text-sm font-medium transition-colors ${
                activeProject.mode === 'construction'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-900 hover:bg-slate-700'
              }`}
            >
              ✨ 新对话
            </button>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-8">
              {activeProject ? '暂无对话记录' : '选择一个项目开始'}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-colors ${
                    session.id === currentId
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                onClick={() => {
                  onSelect(session.id);
                  onClose();
                }}
              >
                <span className="text-sm text-slate-400">💬</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm truncate font-medium">{session.title}</span>
                    {session.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0 font-medium">
                        {session.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(session.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  aria-label="删除会话"
                  className="opacity-0 group-hover:opacity-100 text-slate-400
                    hover:text-red-500 transition-all text-xs p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 text-center space-y-1">
          <a
            href="https://github.com/Jarvi-Hou/ai-home-designer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors block"
          >
            ⭐ GitHub · AI 家居设计师
          </a>
          <div className="text-[10px] text-slate-300">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
        </div>
      </aside>

      {/* Custom delete confirm modal */}
      {pendingDeleteProjectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPendingDeleteProjectId(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-72 mx-4">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🗑️</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1 text-center">确定删除此项目？</p>
            <p className="text-xs text-slate-400 mb-5 text-center">对话记录将保留在历史中</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDeleteProjectId(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDeleteProject(pendingDeleteProjectId);
                  setPendingDeleteProjectId(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
