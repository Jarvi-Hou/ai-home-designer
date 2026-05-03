'use client';

import RenovationJourney from '@/components/RenovationJourney';

interface Project {
  id: string;
  name: string;
  mode: 'quest' | 'construction';
}

interface Props {
  projects: Project[];
  onStartMode: (mode: 'quest' | 'construction') => void;
  onSelectProject: (id: string) => void;
  onAsk: (q: string) => void;
}

export default function ModeSelectionScreen({ projects, onStartMode, onSelectProject, onAsk }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Brand mark */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-xl mb-5">
          <span className="text-3xl">🏠</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">装修参谋</h2>
        <p className="text-slate-500 text-sm font-medium">装修不踩坑 — AI 帮你一步步做决策</p>
        <p className="text-slate-400 text-xs mt-1">走完全程，生成需求文档直接给装修公司报价</p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <button
          onClick={() => onStartMode('quest')}
          className="group relative overflow-hidden p-6 bg-white rounded-3xl border border-slate-200
            hover:border-slate-400 hover:shadow-xl hover:shadow-slate-100
            transition-all duration-200 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
              <span className="text-2xl">🎮</span>
            </div>
            <div className="font-semibold text-slate-900 mb-1.5 text-base">装修闯关</div>
            <div className="text-sm text-slate-500 leading-relaxed">
              还没开工？一步步做决策，导出方案给装修公司报价
            </div>
          </div>
          <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => onStartMode('construction')}
          className="group relative overflow-hidden p-6 bg-white rounded-3xl border border-slate-200
            hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50
            transition-all duration-200 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="font-semibold text-slate-900 mb-1.5 text-base">施工跟进</div>
            <div className="text-sm text-slate-500 leading-relaxed">
              已经开工？帮你盯质量、控预算、管进度
            </div>
          </div>
          <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-blue-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Existing projects */}
      {projects.length > 0 && (
        <div className="mt-8 text-center w-full max-w-lg">
          <p className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">继续已有项目</p>
          <div className="flex flex-wrap justify-center gap-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="px-3.5 py-1.5 text-sm bg-white border border-slate-200
                  rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors
                  text-slate-700 font-medium shadow-sm"
              >
                {p.mode === 'construction' ? '🔧' : '🏠'} {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick questions */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 w-full max-w-lg">
        <RenovationJourney onAsk={onAsk} />
      </div>
    </div>
  );
}
