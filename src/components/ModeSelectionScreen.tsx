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
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-6xl mb-4">🏠</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">装修参谋</h2>
      <p className="text-gray-500 mb-1 text-center max-w-md font-medium">
        装修不踩坑 — AI 帮你一步步做决策
      </p>
      <p className="text-gray-400 mb-8 text-center max-w-md text-sm">
        走完全程，生成一份需求文档直接给装修公司报价
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg px-4">
        <button
          onClick={() => onStartMode('quest')}
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
          onClick={() => onStartMode('construction')}
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
                onClick={() => onSelectProject(p.id)}
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
        <RenovationJourney onAsk={onAsk} />
      </div>
    </div>
  );
}
