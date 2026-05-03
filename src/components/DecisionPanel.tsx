'use client';

import { ProgressData, Decision } from '@/lib/progressTypes';

const STAGES = [
  { id: 'basic_info', label: '基本信息' },
  { id: 'renovation_mode', label: '装修模式' },
  { id: 'hard_decoration', label: '硬装方案' },
  { id: 'main_materials', label: '主材选择' },
  { id: 'soft_furnishing', label: '软装方向' },
  { id: 'appliances', label: '家电清单' },
];

function formatMoney(n: number | null): string {
  if (n === null) return '待定';
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${n}元`;
}

function stageIndex(stageId: string): number {
  const idx = STAGES.findIndex((s) => s.id === stageId);
  return idx === -1 ? 0 : idx;
}

export default function DecisionPanel({
  progress,
  onDiscussItem,
  onExportPdf,
  isOpen,
  onClose,
}: {
  progress: ProgressData | null;
  onDiscussItem: (decision: Decision) => void;
  onExportPdf: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const currentIdx = progress ? stageIndex(progress.current_stage) : 0;
  const confirmedCount = progress
    ? progress.decisions.filter((d) => d.status === 'confirmed').length
    : 0;
  const totalItems = progress ? progress.decisions.length : 0;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-40
          transform transition-transform duration-300 overflow-y-auto panel-scroll
          lg:static lg:translate-x-0 lg:shrink-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm tracking-wide">📋 装修方案</h3>
            <button
              onClick={onClose}
              aria-label="关闭方案面板"
              className="text-slate-500 hover:text-white transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {!progress ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl mb-4">🏗️</div>
              <p className="text-slate-400 text-sm">开始对话后</p>
              <p className="text-slate-500 text-xs">你的装修决策会自动记录在这里</p>
            </div>
          ) : (
            <>
              {/* Stage progress */}
              <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1">
                  {STAGES.map((stage, i) => (
                    <div key={stage.id} className="flex items-center flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                          i < currentIdx
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : i === currentIdx
                            ? 'bg-slate-700 border-2 border-blue-500 text-blue-400'
                            : 'bg-slate-700 text-slate-500'
                        }`}
                        title={stage.label}
                      >
                        {i < currentIdx ? '✓' : i + 1}
                      </div>
                      {i < STAGES.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-0.5 rounded-full ${
                            i < currentIdx ? 'bg-blue-500' : 'bg-slate-700'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">决策进度</span>
                  <span className="text-xs text-blue-400 font-semibold">
                    {confirmedCount}/{totalItems > 0 ? totalItems : '—'} 项已确认
                  </span>
                </div>
              </div>

              {/* Budget bar */}
              <div className="bg-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">💰 预算分配</span>
                  <span className="text-xs text-slate-300">
                    {progress.budget.total
                      ? `${formatMoney(progress.budget.allocated)} / ${formatMoney(progress.budget.total)}`
                      : <span className="text-slate-500">待确定</span>
                    }
                  </span>
                </div>
                {progress.budget.total ? (
                  <>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-lg shadow-blue-500/40"
                        style={{
                          width: `${Math.min(100, (progress.budget.allocated / progress.budget.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-600 text-right">
                      剩余 {formatMoney(progress.budget.total - progress.budget.allocated)}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-1.5 bg-slate-700 rounded-full" />
                )}
              </div>

              {/* Timeline */}
              <div className="bg-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">🕐 时间线</span>
                  <span className="text-xs text-slate-300">
                    {progress.timeline.start && progress.timeline.end
                      ? `${progress.timeline.start} → ${progress.timeline.end}`
                      : <span className="text-slate-500">待确定</span>
                    }
                  </span>
                </div>
              </div>

              {/* Decision list */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">决策记录</div>
                {progress.decisions.length === 0 ? (
                  <div className="text-xs text-slate-600 text-center py-4">
                    还没有决策记录，回答问题后会自动出现
                  </div>
                ) : (
                  progress.decisions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onDiscussItem(d)}
                      className="w-full text-left px-3.5 py-3 rounded-2xl border border-slate-800 bg-slate-800
                        hover:bg-slate-700 hover:border-slate-600 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">
                          {d.status === 'confirmed' ? '✅' : d.status === 'revisiting' ? '🔄' : '⏳'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-200 truncate">
                              {d.label}
                            </span>
                            {d.is_new && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full animate-pulse font-medium">
                                新
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {d.value || '待定'}
                            {d.estimated_cost !== null && (
                              <span className="ml-1 text-blue-400 font-medium">
                                · {formatMoney(d.estimated_cost)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-700 group-hover:text-slate-400 text-xs transition-colors">›</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Export button */}
              <button
                onClick={onExportPdf}
                disabled={confirmedCount === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold
                  hover:bg-blue-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors
                  shadow-lg shadow-blue-600/20"
              >
                📄 导出装修方案
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
