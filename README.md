# 🏠 AI 家居设计师

基于小米 MiMo 大模型的**智能装修助手**。输入你的户型和需求，获得专业级装修建议、材料推荐和预算清单。

> 装修不踩坑，从问 AI 开始。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJarvi-hou%2Fai-home-designer&env=MIMO_API_KEY,MIMO_API_BASE,MIMO_MODEL&envDescription=MiMo%20API%20configuration&envLink=https%3A%2F%2Fxiaomimimo.com)

## 功能亮点

- 🎨 **风格推荐** — 现代简约、北欧、新中式、奶油风等 8+ 主流风格智能匹配
- 💰 **预算规划** — 根据面积、城市、档次生成详细预算清单
- 🧱 **材料对比** — 瓷砖、地板、橱柜、卫浴等材料优劣分析和品牌推荐
- 🔧 **全包/半包决策** — 帮你分析哪种方式更适合你
- ⚠️ **避坑指南** — 水电、防水、甲醛、合同等常见陷阱提醒
- 📋 **流程梳理** — 从量房到入住的完整装修时间线
- ⚡ **流式回复** — 打字机效果，实时输出

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Jarvi-hou/ai-home-designer.git
cd ai-home-designer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 MiMo API Key：

```env
MIMO_API_KEY=你的_API_Key
MIMO_API_BASE=https://token-plan-cn.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
```

> 🔑 API Key 获取：访问 [xiaomimimo.com](https://xiaomimimo.com) 注册

### 4. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 一键部署

点击下方按钮，一键部署到 Vercel（免费）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJarvi-hou%2Fai-home-designer&env=MIMO_API_KEY,MIMO_API_BASE,MIMO_MODEL&envDescription=MiMo%20API%20configuration&envLink=https%3A%2F%2Fxiaomimimo.com)

部署时需要填写环境变量：
| 变量 | 说明 |
|------|------|
| `MIMO_API_KEY` | 小米 MiMo API 密钥 |
| `MIMO_API_BASE` | API 地址，默认 `https://token-plan-cn.xiaomimimo.com/v1` |
| `MIMO_MODEL` | 模型名称，默认 `mimo-v2.5-pro` |

## 技术栈

- **框架**：[Next.js 14](https://nextjs.org/) (App Router)
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **AI 模型**：[小米 MiMo-V2.5-Pro](https://xiaomimimo.com/)（OpenAI 兼容接口）
- **部署**：[Vercel](https://vercel.com/)

## 项目结构

```
src/
├── app/
│   ├── api/chat/route.ts   # MiMo API 流式转发
│   ├── layout.tsx           # 页面布局
│   ├── page.tsx             # 聊天主界面
│   └── globals.css          # 全局样式
└── lib/
    └── prompts.ts           # 装修顾问 System Prompt
```

## 路线图

- [x] 基础对话 + 流式输出
- [x] 专业装修顾问 System Prompt
- [x] 快捷问题入口
- [ ] 装修预算计算器（输入面积自动生成）
- [ ] 对话历史记录（本地存储）
- [ ] 深色模式
- [ ] 多模型切换
- [ ] 户型图上传分析（MiMo 多模态）

## 贡献

欢迎 PR 和 Issue！特别欢迎：
- 装修行业从业者补充专业知识
- UI/UX 改进建议
- 新功能提议

## License

[MIT](LICENSE)

---

如果觉得有用，请给个 ⭐ Star，这是对我最大的鼓励！
