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

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-200 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 ${isOpen ? '' : 'md:-translate-x-full'}`}
      >
        {/* Project selector */}
        <div className="p-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">项目</span>
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="text-xs text-orange-500 hover:text-orange-600"
            >
              + 新项目
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-2">
              选择模式开始第一个项目
            </div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm
                    transition-colors ${
                    p.id === activeProjectId
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                >
                  <span className="shrink-0">
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
                      className="flex-1 min-w-0 text-sm bg-white border border-orange-300 rounded px-1.5 py-0.5
                        focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 truncate"
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
                      if (confirm('确定删除此项目？所有对话记录将保留。')) {
                        onDeleteProject(p.id);
                      }
                    }}
                    aria-label="删除项目"
                    className="opacity-0 group-hover:opacity-100 text-gray-400
                      hover:text-red-500 transition-all text-xs p-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New chat button */}
        {activeProject && (
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => {
                onNew();
                onClose();
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2
                text-white rounded-xl text-sm font-medium transition-colors ${
                activeProject.mode === 'construction'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              ✨ 新对话
            </button>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-8">
              {activeProject ? '暂无对话记录' : '选择一个项目开始'}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-colors ${
                    session.id === currentId
                      ? 'bg-orange-50 text-orange-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                onClick={() => {
                  onSelect(session.id);
                  onClose();
                }}
              >
                <span className="text-sm">💬</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm truncate">{session.title}</span>
                    {session.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">
                        {session.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(session.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  aria-label="删除会话"
                  className="opacity-0 group-hover:opacity-100 text-gray-400
                    hover:text-red-500 transition-all text-xs p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 text-center space-y-1">
          <a
            href="https://github.com/Jarvi-Hou/ai-home-designer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors block"
          >
            ⭐ GitHub · AI 家居设计师
          </a>
          <div className="text-[10px] text-gray-300">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
        </div>
      </aside>
    </>
  );
}
