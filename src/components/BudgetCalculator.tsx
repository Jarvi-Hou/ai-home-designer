'use client';

import { useState } from 'react';

interface BudgetResult {
  total: number;
  硬装: number;
  主材: number;
  软装: number;
  家电: number;
  unitPrice: number;
  level: string;
}

const LEVELS = [
  { label: '经济型', desc: '满足基本居住', min: 800, max: 1200 },
  { label: '舒适型', desc: '品质与性价比兼顾', min: 1200, max: 2000 },
  { label: '品质型', desc: '注重设计和材料', min: 2000, max: 3500 },
  { label: '豪华型', desc: '高端定制', min: 3500, max: 5000 },
];

export default function BudgetCalculator({
  onAsk,
}: {
  onAsk: (question: string) => void;
}) {
  const [area, setArea] = useState('');
  const [levelIdx, setLevelIdx] = useState(1);
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [show, setShow] = useState(false);

  const calculate = () => {
    const a = parseFloat(area);
    if (!a || a <= 0) return;
    const level = LEVELS[levelIdx];
    const unitPrice = Math.round((level.min + level.max) / 2);
    const total = unitPrice * a;
    setResult({
      total,
      硬装: Math.round(total * 0.4),
      主材: Math.round(total * 0.3),
      软装: Math.round(total * 0.2),
      家电: Math.round(total * 0.1),
      unitPrice,
      level: level.label,
    });
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600
          rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors text-sm"
      >
        🧮 预算计算器
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">🧮 装修预算计算器</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* 面积输入 */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">房屋面积（㎡）</label>
        <input
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="例如：90"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {/* 档次选择 */}
      <div>
        <label className="text-sm text-gray-600 mb-2 block">装修档次</label>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((level, i) => (
            <button
              key={i}
              onClick={() => setLevelIdx(i)}
              className={`px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                levelIdx === i
                  ? 'bg-orange-50 border-orange-400 text-orange-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{level.label}</div>
              <div className="text-xs opacity-70">
                {level.min}-{level.max} 元/㎡
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={!area || parseFloat(area) <= 0}
        className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium
          hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        计算预算
      </button>

      {/* 结果 */}
      {result && (
        <div className="space-y-3 pt-2">
          <div className="text-center">
            <div className="text-sm text-gray-500">预估总价（{result.level}）</div>
            <div className="text-3xl font-bold text-orange-500 mt-1">
              ¥{(result.total / 10000).toFixed(1)}
              <span className="text-base font-normal text-gray-400"> 万</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              约 {result.unitPrice} 元/㎡ × {area}㎡
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '🔨 硬装', value: result.硬装, pct: '40%' },
              { label: '🧱 主材', value: result.主材, pct: '30%' },
              { label: '🛋️ 软装', value: result.软装, pct: '20%' },
              { label: '📺 家电', value: result.家电, pct: '10%' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-lg p-3 text-center"
              >
                <div className="text-xs text-gray-500">
                  {item.label}（{item.pct}）
                </div>
                <div className="font-semibold text-gray-800 mt-1">
                  ¥{(item.value / 10000).toFixed(1)}万
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              onAsk(
                `我的房子 ${area} 平方米，预算 ${(result.total / 10000).toFixed(
                  1
                )} 万（${result.level}），请给我详细的装修预算分配建议和材料推荐。`
              )
            }
            className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg text-sm
              hover:bg-orange-100 transition-colors border border-orange-200"
          >
            💬 让 AI 给我详细建议
          </button>
        </div>
      )}
    </div>
  );
}
