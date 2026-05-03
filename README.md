# 🏠 装修参谋 — AI 驱动的装修决策顾问

**装修不踩坑，AI 帮你一步步做决策，生成方案直接给装修公司报价。**

> 不是又一个"问 AI 装修建议"的工具。装修参谋会主动引导你走完 6 个决策关卡，全程记录你的选择，最终输出一份结构化的装修需求文档。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJarvi-hou%2Fai-home-designer&env=MIMO_API_KEY,MIMO_API_BASE,MIMO_MODEL&envDescription=MiMo%20API%20configuration&envLink=https%3A%2F%2Fxiaomimimo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/Jarvi-Hou/ai-home-designer/actions/workflows/test.yml/badge.svg)](https://github.com/Jarvi-Hou/ai-home-designer/actions/workflows/test.yml)

**Live Demo → [ai-home-designer-eosin.vercel.app](https://ai-home-designer-eosin.vercel.app)**

---

## 为什么不直接问 ChatGPT？

| 功能 | ChatGPT / 通用 AI | 装修参谋 |
|------|------------------|---------|
| 回答装修问题 | ✅ | ✅ |
| 主动引导决策，不需要你会提问 | ❌ | ✅ |
| 实时记录每个选择，右侧面板可见 | ❌ | ✅ |
| 地区价格系数（北京×1.3 vs 武汉×1.0） | ❌ | ✅ |
| 施工验收标准（打压/防水/空鼓数据） | ❌ | ✅ |
| 走完全程导出需求文档 | ❌ | ✅ |
| 施工中途问题 + 与工头沟通话术 | ❌ | ✅ |

---

## 核心功能

### 🎮 装修闯关（规划阶段）
RPG 式 6 关决策流程，每次只问一件事，给出 2-3 个选项 + 推荐理由：
1. **基本信息** — 城市、面积、预算，自动计算区间和档次
2. **装修模式** — 全包 / 半包 / 清包，费用差异说清楚
3. **硬装方案** — 水电、防水、吊顶（不可逆工程，优先决策）
4. **主材选择** — 瓷砖、地板、橱柜、卫浴（三档推荐）
5. **软装方向** — 风格、窗帘、灯具
6. **家电清单** — 空调、热水器、洗衣机

右侧面板实时记录每个决策，走完全程可导出方案。

### 🔧 施工跟进（施工阶段）
已开工？AI 切换为"现场监督模式"：
- 各阶段验收标准（打压 0.8MPa/30分钟、防水 48 小时、空鼓≤5%）
- 发现问题时给出**与工头沟通的具体话术**
- 追踪水电 → 防水 → 泥工 → 木工 → 油漆全流程进度

### 📋 多项目管理
同时管理多套房装修，数据完全隔离，浏览器刷新后自动恢复。

---

## 快速开始（15 分钟跑起来）

### 前置条件
- Node.js 18+
- [小米 MiMo API Key](https://xiaomimimo.com)（注册即得）

### 1. 克隆 & 安装

```bash
git clone https://github.com/Jarvi-Hou/ai-home-designer.git
cd ai-home-designer
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
MIMO_API_KEY=你的_API_Key
MIMO_API_BASE=https://token-plan-cn.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
```

### 3. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始使用。

---

## 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJarvi-hou%2Fai-home-designer&env=MIMO_API_KEY,MIMO_API_BASE,MIMO_MODEL&envDescription=MiMo%20API%20configuration&envLink=https%3A%2F%2Fxiaomimimo.com)

只需填写 1 个必须的环境变量（`MIMO_API_KEY`），其余有默认值。无需数据库，零额外依赖。

---

## 技术栈

- **框架**：[Next.js 14](https://nextjs.org/) (App Router + Server Actions)
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **AI 模型**：[小米 MiMo-V2.5-Pro](https://xiaomimimo.com/)（OpenAI 兼容接口，1M 上下文）
- **图表渲染**：[Mermaid.js](https://mermaid.js.org/)（决策流程图、甘特图、费用饼图）
- **存储**：localStorage（无需后端数据库）
- **部署**：[Vercel](https://vercel.com/)（Serverless）

## 项目结构

```
src/
├── app/
│   ├── api/chat/route.ts        # MiMo API 流式转发
│   ├── page.tsx                  # 主界面（对话 + 双模式）
│   └── globals.css
├── components/
│   ├── Sidebar.tsx               # 项目列表侧边栏
│   ├── DecisionPanel.tsx         # 右侧装修决策面板
│   ├── ConstructionPanel.tsx     # 右侧施工进度面板
│   ├── MermaidBlock.tsx          # Mermaid 图表渲染
│   └── RenovationJourney.tsx     # 快捷问题入口
├── hooks/
│   ├── useChatHistory.ts         # 对话历史持久化
│   └── useProjectStore.ts        # 多项目状态管理
└── lib/
    ├── prompts.ts                 # 装修顾问 System Prompt（核心）
    ├── parseProgress.ts           # PROGRESS 数据块解析
    ├── parseConstruction.ts       # 施工数据块解析
    ├── mergeDecisions.ts          # 决策合并逻辑
    └── buildProjectContext.ts     # 项目上下文注入
tests/
├── unit/                          # Jest 单元测试（36 个）
└── user-journey/                  # 用户旅程测试任务书（10 个）
```

---

## 路线图

- [x] 装修闯关 — 6关 RPG 式决策流程
- [x] 施工跟进 — 双模式架构
- [x] 右侧决策面板 — 实时记录
- [x] 多项目管理 — 完全数据隔离
- [x] 多标签页同步 — localStorage storage 事件
- [x] Mermaid 图表 — 决策对比 / 甘特图 / 费用饼图
- [x] 导出方案 — 装修需求 PDF
- [x] 单元测试覆盖（36个，关键解析逻辑）
- [ ] 社交分享卡片（一键截图方案）
- [ ] 深色模式
- [ ] 户型图上传分析（MiMo 多模态）
- [ ] 对接本地装修公司报价（B端）
- [ ] iOS / Android 原生 App

---

## 贡献指南

欢迎任何形式的贡献！详见 [CONTRIBUTING.md](CONTRIBUTING.md)

特别欢迎：
- 🏗️ **装修行业从业者** — 补充施工验收标准、品牌数据、地区价格
- 🎨 **UI/UX 设计师** — 移动端体验、分享卡片设计
- 💻 **开发者** — page.tsx 组件拆分、新功能实现
- 📝 **文档** — README 翻译（EN/JP）

新手可以从 [good first issue](https://github.com/Jarvi-Hou/ai-home-designer/labels/good%20first%20issue) 开始。

---

## License

[MIT](LICENSE) — 自由使用、修改、商业化，保留 License 即可。

---

如果这个项目对你有用，请给个 ⭐ Star —— 这是我继续维护最大的动力！
