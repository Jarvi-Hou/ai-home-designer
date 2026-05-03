'use client';

import { ConstructionData, ConstructionStage, CONSTRUCTION_STAGES } from '@/lib/constructionTypes';

function formatMoney(n: number | null): string {
  if (n === null) return '待定';
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${n}元`;
}

function stageIcon(status: ConstructionStage['status']): string {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔨';
    case 'inspecting': return '🔍';
    case 'issue': return '⚠️';
    default: return '⬜';
  }
}

function statusLabel(status: ConstructionStage['status']): string {
  switch (status) {
    case 'completed': return '已完成';
    case 'in_progress': return '施工中';
    case 'inspecting': return '验收中';
    case 'issue': return '有问题';
    default: return '未开始';
  }
}

function statusColor(status: ConstructionStage['status']): string {
  switch (status) {
    case 'completed': return 'text-emerald-400';
    case 'in_progress': return 'text-blue-400';
    case 'inspecting': return 'text-amber-400';
    case 'issue': return 'text-red-400';
    default: return 'text-slate-600';
  }
}

export default function ConstructionPanel({
  data,
  isOpen,
  onClose,
}: {
  data: ConstructionData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const completedCount = data
    ? data.stages.filter((s) => s.status === 'completed').length
    : 0;
  const totalStages = CONSTRUCTION_STAGES.length;

  const budgetDiff =
    data?.budget.planned_total && data.budget.actual_total
      ? data.budget.actual_total - data.budget.planned_total
      : null;

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
            <h3 className="font-semibold text-white text-sm tracking-wide">🔧 施工进度</h3>
            <button
              onClick={onClose}
              aria-label="关闭进度面板"
              className="text-slate-500 hover:text-white transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {!data ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl mb-4">🏗️</div>
              <p className="text-slate-400 text-sm">开始对话后</p>
              <p className="text-slate-500 text-xs">施工进度会自动记录在这里</p>
            </div>
          ) : (
            <>
              {/* Overall progress */}
              <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-400">
                    {data.overall_status || '准备开工'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {completedCount}/{totalStages} 阶段完成
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-lg shadow-blue-500/40"
                    style={{ width: `${(completedCount / totalStages) * 100}%` }}
                  />
                </div>
              </div>

              {/* Budget tracking */}
              <div className="bg-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">💰 费用跟踪</span>
                  <span className="text-xs text-slate-300">
                    {data.budget.planned_total
                      ? `${formatMoney(data.budget.actual_total)} / ${formatMoney(data.budget.planned_total)}`
                      : `已花费 ${formatMoney(data.budget.actual_total)}`}
                  </span>
                </div>
                {data.budget.planned_total && (
                  <>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          budgetDiff && budgetDiff > 0
                            ? 'bg-red-500 shadow-lg shadow-red-500/30'
                            : 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                        }`}
                        style={{
                          width: `${Math.min(100, (data.budget.actual_total / data.budget.planned_total) * 100)}%`,
                        }}
                      />
                    </div>
                    {budgetDiff !== null && budgetDiff !== 0 && (
                      <div className={`text-[11px] text-right font-medium ${budgetDiff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {budgetDiff > 0 ? `超支 ${formatMoney(budgetDiff)}` : `节省 ${formatMoney(Math.abs(budgetDiff))}`}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">📅 工期</span>
                  <span className="text-xs text-slate-300">
                    {data.timeline.start && data.timeline.expected_end
                      ? `${data.timeline.start} → ${data.timeline.expected_end}`
                      : data.timeline.start
                      ? `${data.timeline.start} 开工`
                      : <span className="text-slate-600">待确定</span>}
                  </span>
                </div>
              </div>

              {/* Stage list */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">施工阶段</div>
                {CONSTRUCTION_STAGES.map((stageDef) => {
                  const stage = data.stages.find((s) => s.id === stageDef.id);
                  const status = stage?.status || 'not_started';
                  const isCurrent = stage?.is_current || false;

                  return (
                    <div
                      key={stageDef.id}
                      className={`px-3.5 py-3 rounded-2xl border transition-colors ${
                        isCurrent
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">{stageIcon(status)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium ${
                              isCurrent ? 'text-blue-300' : 'text-slate-300'
                            }`}>
                              {stageDef.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full animate-pulse font-medium">
                                当前
                              </span>
                            )}
                            {status === 'issue' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-medium">
                                问题
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={statusColor(status)}>{statusLabel(status)}</span>
                            {stage?.actual_cost !== null && stage?.actual_cost !== undefined && (
                              <span className="text-slate-600">· {formatMoney(stage.actual_cost)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Checklist for current stage */}
                      {isCurrent && stage && stage.checklist.length > 0 && (
                        <div className="mt-2.5 pl-8 space-y-1.5">
                          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">验收清单</div>
                          {stage.checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-1.5 text-xs">
                              <span>
                                {item.passed === true ? '✅' : item.passed === false ? '❌' : '⬜'}
                              </span>
                              <span className={item.passed === false ? 'text-red-400' : 'text-slate-400'}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Issue notes */}
                      {status === 'issue' && stage?.notes && (
                        <div className="mt-1.5 pl-8 text-xs text-red-400">
                          ⚠️ {stage.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
