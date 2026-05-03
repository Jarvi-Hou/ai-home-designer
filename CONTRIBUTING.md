# 贡献指南

感谢你考虑为装修参谋做贡献！以下是参与方式。

## 快速开始

1. Fork 这个仓库
2. 创建你的功能分支：`git checkout -b feat/your-feature`
3. 本地运行（见 [README 快速开始](README.md#快速开始15-分钟跑起来)）
4. 运行测试：`npm test`
5. 提交 PR

## 贡献类型

### 🏗️ 专业知识（最欢迎）
装修行业从业者可以直接编辑 `src/lib/prompts.ts`：
- 补充地区价格数据
- 更新品牌分档（新品牌/停产品牌）
- 补充施工验收标准
- 添加常见坑点提醒

### 💻 代码贡献
- **Good First Issue**：见 [Issues 列表](https://github.com/Jarvi-Hou/ai-home-designer/labels/good%20first%20issue)
- **page.tsx 组件拆分**：当前 818 行，欢迎拆分为独立子组件
- **移动端体验优化**：响应式布局改进

### 📝 文档
- README 英文翻译
- 补充 API 文档

## 提交规范

使用语义化提交信息：
```
feat: 新功能描述
fix: Bug 修复描述
docs: 文档更新
refactor: 代码重构（无功能变化）
test: 测试相关
```

## 测试要求

PR 合并前需要：
- `npm test` 全部通过（当前 36 个单元测试）
- 如果修改了 `prompts.ts`，请在 [Live Demo](https://ai-home-designer-eosin.vercel.app) 手动验证 AI 回复

## 专业知识贡献者

如果你是装修行业从业者（设计师、项目经理、施工队长等），欢迎直接提 Issue 描述你发现的知识错误或缺漏，我们会快速处理。你的真实经验是这个项目最宝贵的资产。

## 行为准则

- 友善、尊重，欢迎新手
- Issue 和 PR 请用中文或英文
- 技术讨论聚焦于问题本身
