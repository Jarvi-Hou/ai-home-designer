'use client';

import { useState } from 'react';

interface BudgetResult {
  total: number;
  硬装: number;
  硬装人工: number;
  硬装材料: number;
  主材: number;
  软装: number;
  家电: number;
  unitPrice: number;
  level: string;
  region: string;
}

const LEVELS = [
  { label: '经济型', desc: '能住就行，干净整洁', min: 800, max: 1200 },
  { label: '舒适型', desc: '大多数家庭首选', min: 1200, max: 2000 },
  { label: '品质型', desc: '设计感强，材料讲究', min: 2000, max: 3500 },
  { label: '豪华型', desc: '全屋定制，一线品牌', min: 3500, max: 5000 },
];

const REGIONS = [
  { label: '一线城市', examples: '北京/上海/广深', multiplier: 1.4 },
  { label: '新一线', examples: '杭州/成都/武汉', multiplier: 1.15 },
  { label: '二线城市', examples: '省会/重点城市', multiplier: 1.0 },
  { label: '三四线', examples: '地级市/县城', multiplier: 0.8 },
];

export default function BudgetCalculator({
  onAsk,
}: {
  onAsk: (question: string) => void;
}) {
  const [area, setArea] = useState('');
  const [levelIdx, setLevelIdx] = useState(1);
  const [regionIdx, setRegionIdx] = useState(2);
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [show, setShow] = useState(false);

  const calculate = () => {
    const a = parseFloat(area);
    if (!a || a <= 0) return;
    const level = LEVELS[levelIdx];
    const region = REGIONS[regionIdx];
    const basePrice = Math.round((level.min + level.max) / 2);
    const unitPrice = Math.round(basePrice * region.multiplier);
    const total = unitPrice * a;
    const hardTotal = Math.round(total * 0.4);
    setResult({
      total,
      硬装: hardTotal,
      硬装人工: Math.round(hardTotal * 0.55),
      硬装材料: Math.round(hardTotal * 0.45),
      主材: Math.round(total * 0.3),
      软装: Math.round(total * 0.2),
      家电: Math.round(total * 0.1),
      unitPrice,
      level: level.label,
      region: region.label,
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

      {/* 地区选择 */}
      <div>
        <label className="text-sm text-gray-600 mb-2 block">所在地区</label>
        <div className="grid grid-cols-2 gap-2">
          {REGIONS.map((region, i) => (
            <button
              key={i}
              onClick={() => setRegionIdx(i)}
              className={`px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                regionIdx === i
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{region.label}</div>
              <div className="text-xs opacity-70">{region.examples}</div>
            </button>
          ))}
        </div>
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
              <div className="text-xs opacity-70">{level.desc}</div>
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
            <div className="text-sm text-gray-500">
              预估总价（{result.region} · {result.level}）
            </div>
            <div className="text-3xl font-bold text-orange-500 mt-1">
              ¥{(result.total / 10000).toFixed(1)}
              <span className="text-base font-normal text-gray-400"> 万</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              约 {result.unitPrice} 元/㎡ × {area}㎡
            </div>
          </div>

          <div className="space-y-2">
            {/* 硬装（展开人工/材料） */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">🔨 硬装（房子的&ldquo;骨架&rdquo;）</span>
                <span className="font-semibold text-gray-800">
                  ¥{(result.硬装 / 10000).toFixed(1)}万
                  <span className="text-xs text-gray-400 font-normal"> · 40%</span>
                </span>
              </div>
              <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                <span>👷 人工 ¥{(result.硬装人工 / 10000).toFixed(1)}万</span>
                <span>🧱 材料 ¥{(result.硬装材料 / 10000).toFixed(1)}万</span>
              </div>
            </div>

            {/* 主材 */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">🪵 主材（看得见的&ldquo;大件&rdquo;）</span>
                <div className="text-xs text-gray-400 mt-0.5">瓷砖/地板/门/橱柜/卫浴</div>
              </div>
              <span className="font-semibold text-gray-800">
                ¥{(result.主材 / 10000).toFixed(1)}万
                <span className="text-xs text-gray-400 font-normal"> · 30%</span>
              </span>
            </div>

            {/* 软装 */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">🛋️ 软装（搬家能带走的）</span>
                <div className="text-xs text-gray-400 mt-0.5">沙发/床/窗帘/灯具</div>
              </div>
              <span className="font-semibold text-gray-800">
                ¥{(result.软装 / 10000).toFixed(1)}万
                <span className="text-xs text-gray-400 font-normal"> · 20%</span>
              </span>
            </div>

            {/* 家电 */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">📺 家电</span>
              <span className="font-semibold text-gray-800">
                ¥{(result.家电 / 10000).toFixed(1)}万
                <span className="text-xs text-gray-400 font-normal"> · 10%</span>
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onAsk(
                `我在${result.region}，房子 ${area} 平方米，预算 ${(
                  result.total / 10000
                ).toFixed(1)} 万（${
                  result.level
                }），请给我详细的装修预算分配建议、各项材料推荐（分经济/中端/高端品牌）、以及装修时间线。`
              )
            }
            className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg text-sm
              hover:bg-orange-100 transition-colors border border-orange-200"
          >
            💬 让 AI 给我详细方案
          </button>
        </div>
      )}
    </div>
  );
}
