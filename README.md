# AI 对话助手

一个功能完整的AI对话应用，实现了类似ChatGPT的用户界面和交互体验。

## 功能特性

- ✅ 完整的消息流渲染系统
- ✅ 流式响应打字机效果
- ✅ Markdown和代码高亮支持
- ✅ 特殊卡片消息类型
- ✅ 本地数据持久化
- ✅ 消息状态管理
- ✅ 快捷操作（复制、重新生成）

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- react-markdown
- react-syntax-highlighter
- lucide-react

## 快速开始

### 安装依赖
\`\`\`bash
npm.cmd install
\`\`\`

### 启动开发服务器
\`\`\`bash
npm.cmd run dev
\`\`\`

访问: http://localhost:5173


## 项目结构

\`\`\`
src/
├── App.tsx              # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
\`\`\`

## 使用说明

1. 在输入框输入消息
2. 按 Enter 发送，Shift + Enter 换行
3. 支持 Markdown 语法
4. 输入"推荐文章"可触发卡片消息
5. 鼠标悬停在AI消息上显示操作按钮
6. 刷新页面后历史记录自动加载

## 开发者

- 使用 React Hooks 进行状态管理
- 采用 TypeScript 保证类型安全
- 使用 Tailwind CSS 快速构建UI
- localStorage 实现数据持久化



---


##  mock

### src/App.tsx
```json
// Mock AI回复数据
const mockResponses = [
  "你好！我是AI助手，很高兴为你服务。有什么我可以帮助你的吗？",
  "这是一个很好的问题！让我来为你详细解答：\n\n1. 首先，我们需要了解基本概念\n2. 然后，分析具体场景\n3. 最后，给出解决方案\n\n希望这些信息对你有帮助！",
  "当然可以！这里有一段示例代码：\n\n```javascript\nfunction greeting(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greeting('World'));\n```\n\n这段代码展示了如何创建一个简单的问候函数。",
  "我理解你的需求。根据你的描述，我建议采用以下方案：\n\n**方案优势**：\n- 易于实现\n- 性能良好\n- 维护成本低\n\n你觉得这个方案如何？",
];

// 模拟卡片数据
const mockCardResponse: Message = {
  id: 'card-1',
  role: 'assistant',
  content: '我找到了一篇相关文章，推荐给你：',
  timestamp: Date.now(),
  status: 'sent',
  cardData: {
    type: 'article',
    title: '前端开发最佳实践指南',
    description: '深入探讨现代前端开发的核心理念、工具链选择和性能优化技巧',
    url: 'https://example.com/article'
  }
};
```

---

