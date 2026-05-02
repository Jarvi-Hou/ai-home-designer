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
    case 'completed': return 'text-green-600';
    case 'in_progress': return 'text-blue-600';
    case 'inspecting': return 'text-orange-600';
    case 'issue': return 'text-red-600';
    default: return 'text-gray-400';
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
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-40
          transform transition-transform duration-300 overflow-y-auto
          lg:static lg:translate-x-0 lg:shrink-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">🔧 施工进度</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 lg:hidden"
            >
              ✕
            </button>
          </div>

          {!data ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="text-3xl mb-3">🏗️</div>
              <p>开始对话后</p>
              <p>施工进度会自动记录在这里</p>
            </div>
          ) : (
            <>
              {/* Overall progress */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-medium">
                    {data.overall_status || '准备开工'}
                  </span>
                  <span className="text-blue-500">
                    {completedCount}/{totalStages} 阶段
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(completedCount / totalStages) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Budget tracking */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>💰 费用跟踪</span>
                  <span>
                    {data.budget.planned_total
                      ? `实际 ${formatMoney(data.budget.actual_total)} / 计划 ${formatMoney(data.budget.planned_total)}`
                      : `已花费 ${formatMoney(data.budget.actual_total)}`}
                  </span>
                </div>
                {data.budget.planned_total && (
                  <>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetDiff && budgetDiff > 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (data.budget.actual_total / data.budget.planned_total) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    {budgetDiff !== null && budgetDiff !== 0 && (
                      <div className={`text-xs text-right ${budgetDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {budgetDiff > 0 ? `超支 ${formatMoney(budgetDiff)}` : `节省 ${formatMoney(Math.abs(budgetDiff))}`}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>📅 工期</span>
                  <span>
                    {data.timeline.start && data.timeline.expected_end
                      ? `${data.timeline.start} → ${data.timeline.expected_end}`
                      : data.timeline.start
                      ? `${data.timeline.start} 开工`
                      : '待确定'}
                  </span>
                </div>
              </div>

              {/* Stage list */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-medium">施工阶段</div>
                {CONSTRUCTION_STAGES.map((stageDef) => {
                  const stage = data.stages.find((s) => s.id === stageDef.id);
                  const status = stage?.status || 'not_started';
                  const isCurrent = stage?.is_current || false;

                  return (
                    <div
                      key={stageDef.id}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{stageIcon(status)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium ${
                              isCurrent ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {stageDef.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full animate-pulse">
                                当前
                              </span>
                            )}
                            {status === 'issue' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
                                问题
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className={statusColor(status)}>{statusLabel(status)}</span>
                            {stage?.actual_cost !== null && stage?.actual_cost !== undefined && (
                              <span>· {formatMoney(stage.actual_cost)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Checklist for current stage */}
                      {isCurrent && stage && stage.checklist.length > 0 && (
                        <div className="mt-2 pl-7 space-y-1">
                          <div className="text-[10px] text-gray-400 font-medium">验收清单</div>
                          {stage.checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-1.5 text-xs">
                              <span>
                                {item.passed === true ? '✅' : item.passed === false ? '❌' : '⬜'}
                              </span>
                              <span className={item.passed === false ? 'text-red-600' : 'text-gray-600'}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Issue notes */}
                      {status === 'issue' && stage?.notes && (
                        <div className="mt-1.5 pl-7 text-xs text-red-500">
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
