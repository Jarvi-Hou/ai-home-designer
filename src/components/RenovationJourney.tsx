'use client';

import { useState } from 'react';

interface Phase {
  icon: string;
  title: string;
  duration: string;
  costPercent: string;
  people: string;
  tasks: string[];
  checkpoints: string[];
  askPrompt: string;
}

const PHASES: Phase[] = [
  {
    icon: '📐',
    title: '设计定稿',
    duration: '1-2 周',
    costPercent: '—',
    people: '设计师',
    tasks: ['量房出图', '确定风格和方案', '签订设计合同', '出施工图纸'],
    checkpoints: ['效果图是否满意', '施工图是否标注清楚', '材料清单是否明确'],
    askPrompt: '我在设计定稿阶段，需要注意什么？如何跟设计师沟通才能让效果图落地？',
  },
  {
    icon: '📝',
    title: '签合同选公司',
    duration: '1 周',
    costPercent: '—',
    people: '装修公司/工长',
    tasks: ['比较 2-3 家报价', '确认材料品牌型号', '约定工期和付款节点', '签订施工合同'],
    checkpoints: ['合同是否写明增项上限', '付款比例是否合理（首期≤30%）', '违约条款是否双向约束'],
    askPrompt: '我要签装修合同了，合同里哪些条款最重要？常见的合同陷阱有哪些？',
  },
  {
    icon: '🔨',
    title: '拆改阶段',
    duration: '3-5 天',
    costPercent: '5%',
    people: '拆改工人',
    tasks: ['拆除旧装修', '砸墙/砌墙', '铲除旧墙皮', '清运建筑垃圾'],
    checkpoints: ['承重墙是否有物业审批', '新建墙体是否垂直', '垃圾清运是否包含在报价内'],
    askPrompt: '拆改阶段有哪些注意事项？哪些墙绝对不能拆？',
  },
  {
    icon: '🔌',
    title: '水电改造',
    duration: '1-2 周',
    costPercent: '15%',
    people: '水电工',
    tasks: ['确定开关插座位置', '水管电线铺设', '强弱电分离', '预留空调/热水器线路'],
    checkpoints: ['水管打压测试 0.8MPa 保压 30 分钟', '电线回路独立、厨卫用 4 平方线', '管线走向拍照留档'],
    askPrompt: '水电改造是最重要的隐蔽工程，我需要重点关注哪些验收标准？插座怎么规划？',
  },
  {
    icon: '🧱',
    title: '瓦工阶段',
    duration: '2-3 周',
    costPercent: '15%',
    people: '瓦工',
    tasks: ['卫生间/厨房/阳台做防水', '贴墙砖和地砖', '地面找平', '门槛石安装'],
    checkpoints: ['防水蓄水测试 48 小时', '瓷砖空鼓率 ≤ 5%', '地漏处坡度正确'],
    askPrompt: '瓦工阶段如何验收？瓷砖怎么选才不会踩雷？防水要做几遍？',
  },
  {
    icon: '🪚',
    title: '木工阶段',
    duration: '1-2 周',
    costPercent: '10%',
    people: '木工',
    tasks: ['吊顶制作', '背景墙造型', '现场柜体制作（如有）', '门套基层'],
    checkpoints: ['吊顶平整无开裂', '柜门开合顺畅', '板材环保等级 ≥ E0'],
    askPrompt: '木工阶段主要做什么？现场打柜子和全屋定制怎么选？',
  },
  {
    icon: '🎨',
    title: '油漆阶段',
    duration: '1-2 周',
    costPercent: '5%',
    people: '油漆工',
    tasks: ['墙面刮腻子（2-3 遍）', '打磨找平', '刷底漆+面漆', '修补收口'],
    checkpoints: ['墙面平整无刷痕', '无色差和透底', '阴阳角顺直'],
    askPrompt: '油漆阶段怎么验收？乳胶漆和硅藻泥怎么选？',
  },
  {
    icon: '🚪',
    title: '安装阶段',
    duration: '1-2 周',
    costPercent: '20%',
    people: '各品牌安装工',
    tasks: ['橱柜/衣柜安装', '室内门安装', '地板铺设', '灯具/开关面板安装', '卫浴洁具安装'],
    checkpoints: ['各项安装牢固无晃动', '门窗开合顺畅', '五金件品牌与合同一致'],
    askPrompt: '安装阶段需要协调哪些商家？安装顺序是什么？有什么容易出错的地方？',
  },
  {
    icon: '🛋️',
    title: '软装+家电进场',
    duration: '1 周',
    costPercent: '30%',
    people: '家具/家电商家',
    tasks: ['家具配送安装', '家电进场', '窗帘/灯饰安装', '装饰品摆放'],
    checkpoints: ['家具尺寸与空间匹配', '家电试运行正常', '整体效果与设计方案一致'],
    askPrompt: '软装和家电怎么搭配？有哪些高性价比的选择？',
  },
];

export default function RenovationJourney({
  onAsk,
}: {
  onAsk: (question: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600
          rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors text-sm"
      >
        🏗️ 装修全流程
      </button>
    );
  }

  return (
    <div className="w-full basis-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">🏗️ 装修全流程（9 大阶段）</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <p className="text-xs text-gray-500">
        从设计定稿到入住，点击每个阶段查看详情，点「咨询」可直接向 AI 提问
      </p>

      <div className="space-y-2">
        {PHASES.map((phase, i) => {
          const isExpanded = expandedIdx === i;
          return (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xl shrink-0">{phase.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {i + 1}. {phase.title}
                    </span>
                    <span className="text-xs text-gray-400">{phase.duration}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {phase.people} · 费用占比 {phase.costPercent}
                  </div>
                </div>
                <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">📋 主要任务</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {phase.tasks.map((t, j) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <span className="text-orange-400 mt-0.5">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">✅ 验收要点</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {phase.checkpoints.map((c, j) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      onAsk(phase.askPrompt);
                      setShow(false);
                    }}
                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm
                      hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    💬 咨询这个阶段
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 text-center pt-1">
        总工期约 2-4 个月施工 + 2-3 个月通风 ≈ 半年
      </div>
    </div>
  );
}
