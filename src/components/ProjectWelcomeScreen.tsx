'use client';

import BudgetCalculator from '@/components/BudgetCalculator';

interface Props {
  projectName?: string;
  mode: 'quest' | 'construction';
  confirmedCount: number;
  onContinue: () => void;
  onAsk: (q: string) => void;
}

export default function ProjectWelcomeScreen({ projectName, mode, confirmedCount, onContinue, onAsk }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl mb-3">
        {mode === 'construction' ? '🔧' : '🏗️'}
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">{projectName}</h3>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
        {confirmedCount > 0
          ? `已有 ${confirmedCount} 项决策，继续讨论新话题`
          : '开始新的对话，继续你的装修之旅'}
      </p>
      <button
        onClick={onContinue}
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
          <BudgetCalculator onAsk={onAsk} />
        </div>
      )}
    </div>
  );
}
