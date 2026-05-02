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
            <h3 className="font-bold text-gray-800 text-sm">📋 我的装修方案</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 lg:hidden"
            >
              ✕
            </button>
          </div>

          {!progress ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="text-3xl mb-3">🏗️</div>
              <p>开始对话后</p>
              <p>你的装修决策会自动记录在这里</p>
            </div>
          ) : (
            <>
              {/* Stage progress */}
              <div className="flex items-center gap-1">
                {STAGES.map((stage, i) => (
                  <div key={stage.id} className="flex items-center flex-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        i < currentIdx
                          ? 'bg-orange-500 text-white'
                          : i === currentIdx
                          ? 'bg-orange-100 border-2 border-orange-500 text-orange-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={stage.label}
                    >
                      {i < currentIdx ? '✓' : i + 1}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-0.5 ${
                          i < currentIdx ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center">
                进度 {confirmedCount}/{totalItems > 0 ? totalItems : '—'}
              </div>

              {/* Budget bar */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>💰 预算</span>
                  <span>
                    {progress.budget.total
                      ? `已分配 ${formatMoney(progress.budget.allocated)} / ${formatMoney(progress.budget.total)}`
                      : '待确定'}
                  </span>
                </div>
                {progress.budget.total && (
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (progress.budget.allocated / progress.budget.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🕐 时间线</span>
                  <span>
                    {progress.timeline.start && progress.timeline.end
                      ? `${progress.timeline.start} → ${progress.timeline.end}`
                      : '待确定'}
                  </span>
                </div>
              </div>

              {/* Decision list */}
              <div className="space-y-1.5">
                <div className="text-xs text-gray-500 font-medium">决策记录</div>
                {progress.decisions.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-3">
                    还没有决策记录，回答问题后会自动出现
                  </div>
                ) : (
                  progress.decisions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onDiscussItem(d)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-gray-100
                        hover:bg-orange-50 hover:border-orange-200 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">
                          {d.status === 'confirmed'
                            ? '✅'
                            : d.status === 'revisiting'
                            ? '🔄'
                            : '⏳'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {d.label}
                            </span>
                            {d.is_new && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-orange-500 text-white rounded-full animate-pulse">
                                新
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {d.value || '待定'}
                            {d.estimated_cost !== null && (
                              <span className="ml-1 text-orange-500">
                                · {formatMoney(d.estimated_cost)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-orange-400 text-xs">›</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Export button */}
              <button
                onClick={onExportPdf}
                disabled={confirmedCount === 0}
                className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium
                  hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
