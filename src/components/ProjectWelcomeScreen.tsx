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
  const isConstruction = mode === 'construction';
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg ${
        isConstruction ? 'bg-blue-600' : 'bg-slate-900'
      }`}>
        <span className="text-3xl">{isConstruction ? '🔧' : '🏗️'}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1.5 text-center">{projectName}</h3>
      <p className="text-slate-500 text-sm mb-7 text-center max-w-xs leading-relaxed">
        {confirmedCount > 0
          ? `已有 ${confirmedCount} 项决策记录，继续讨论新话题`
          : '开始新的对话，继续你的装修之旅'}
      </p>
      <button
        onClick={onContinue}
        className={`px-7 py-2.5 text-white rounded-2xl text-sm font-semibold
          transition-all shadow-lg active:scale-95 ${
          isConstruction
            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            : 'bg-slate-900 hover:bg-slate-700 shadow-slate-200'
        }`}
      >
        💬 继续对话
      </button>
      {mode === 'quest' && (
        <div className="mt-5 w-full max-w-sm">
          <BudgetCalculator onAsk={onAsk} />
        </div>
      )}
    </div>
  );
}
