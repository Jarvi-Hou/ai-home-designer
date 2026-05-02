'use client';

import { ChatSession } from '@/hooks/useChatHistory';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
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
}: SidebarProps) {
  return (
    <>
      {/* 遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-200 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 ${isOpen ? '' : 'md:-translate-x-full'}`}
      >
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
              bg-orange-500 text-white rounded-xl text-sm font-medium
              hover:bg-orange-600 transition-colors"
          >
            ✨ 新对话
          </button>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-8">
              暂无对话记录
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
                  <div className="text-sm truncate">{session.title}</div>
                  <div className="text-xs text-gray-400">
                    {formatTime(session.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400
                    hover:text-red-500 transition-all text-xs p-1"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部 */}
        <div className="p-3 border-t border-gray-100 text-center">
          <a
            href="https://github.com/Jarvi-Hou/ai-home-designer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ⭐ GitHub · AI 家居设计师
          </a>
        </div>
      </aside>
    </>
  );
}
