# 樱桃钨 (AinterReview)

![](public/logo.png)

一个基于 AI 驱动的智能访谈工具，帮助独立创作者生成高质量访谈稿。通过分析内容源，自动生成有深度的访谈问题，并支持多种写作风格的访谈稿生成。

> 本项目代码使用 [Qoder](https://qoder.com/?ref=ainterview) 自动生成，深度测评视频[可移步 B 站观看](https://www.bilibili.com/video/BV1wgezzUECm/?vd_source=fade59d07328dbcb9a0988b7ce98b49d)

## 🌟 项目特色

- **智能问题生成**：基于内容分析，自动生成既有趣又有用的访谈问题
- **多风格写作**：支持情感、科技、文学、商业四种写作风格
- **语音识别**：集成 API 语音识别，支持语音输入回答
- **流式输出**：实时显示 AI 生成内容，提供打字机效果
- **双模式生成**：快速模式和精细模式，满足不同场景需求
- **数据持久化**：自动保存访谈进度，支持断点续传

## 🚀 功能特性

### 核心功能
- 📝 **内容分析**：上传文档或输入网址，AI 自动分析并生成访谈背景
- 🤖 **智能提问**：围绕"有趣+有用"双重价值，生成个性化访谈问题
- 🎤 **语音输入**：支持中英文语音识别，提升回答效率
- 📖 **访谈稿生成**：多阶段生成结构化访谈稿，支持多种写作风格
- 💾 **自动保存**：实时保存访谈进度，刷新页面不丢失数据

### 技术特色
- ⚡ **流式处理**：基于 OpenAI SDK 的真正流式输出
- 🔐 **安全存储**：API 密钥加密存储，保护用户隐私
- 📱 **响应式设计**：基于 Mantine UI，适配多种设备
- 🔧 **模块化架构**：清晰的组件划分，易于维护和扩展

## 🛠 技术栈

### 前端框架
- **React 18** - 现代化前端框架，支持并发特性
- **Vite 4** - 极速开发服务器和构建工具
- **React Router DOM** - 单页应用路由管理

### UI 组件库
- **Mantine 6** - 高质量 React 组件库
- **Tabler Icons** - 丰富的图标库
- **React Hot Toast** - 优雅的通知组件

### 状态管理
- **Zustand** - 轻量级状态管理库
- **SWR** - 数据获取和缓存解决方案

### AI 集成
- **OpenAI SDK** - AI 服务调用和流式处理
- **Crypto-JS** - API 密钥加密存储

### 开发工具
- **ESLint** - 代码质量检查
- **PostCSS + Tailwind CSS** - 样式处理
- **Sass** - CSS 预处理器

## 📦 安装和运行

### 环境要求
- Node.js 16+ 
- npm 或 yarn/pnpm

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```
访问 http://localhost:5173

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🎯 使用指南

### 1. API 配置
首次使用需要配置 AI 服务：
- 支持 SiliconFlow、DeepSeek、OpenAI 等多个服务商
- 填入 API 密钥和选择模型
- 可选配置语音识别服务

### 2. 内容准备
- **网址输入**：粘贴相关网页链接
- **文本输入**：直接输入访谈背景材料
- **内容分析**：AI 自动分析并生成问题预览

### 3. 进行访谈
- 查看 AI 生成的访谈问题
- 可使用文字或语音方式回答
- 支持跳过问题或重新生成问题
- 至少回答 5 个问题后可生成访谈稿

### 4. 生成访谈稿
提供两种生成模式：

**快速模式**（2-3分钟）：
- 直接对问答记录进行风格润色
- 适合快速出稿，保持原始对话风格

**精细模式**（5-10分钟）：
- 生成提纲 → 章节生成 → 合并初稿 → 风格润色
- 适合深度文章，结构化内容

### 5. 风格选择
支持四种写作风格：
- **情感风格**：情感充沛，直击痛点，引发共鸣
- **科技风格**：理性客观，实用导向，专业深度  
- **文学风格**：文学性强，诗意优美，哲理思辨
- **商业风格**：数据驱动，分析深入，实操性强

## 📁 目录结构

```
AinterReview/
├── actions/           # CLI 命令模块
│   ├── api.js        # API 相关操作
│   ├── hi.js         # 打招呼命令
│   ├── make.js       # 创建文件命令
│   ├── product.js    # 产品相关操作
│   └── web.js        # Web 服务命令
├── lib/              # 核心库文件
│   ├── aiClient.js   # AI API 客户端
│   ├── apiConfig.js  # API 配置管理
│   ├── functions.js  # 通用函数库
│   ├── prompts.js    # AI 提示词模板
│   └── speechClient.js # 语音识别客户端
├── src/              # 前端源码
│   ├── blocks/       # UI 组件
│   │   ├── APIConfig.jsx         # API 配置页面
│   │   ├── ContentInput.jsx      # 内容输入组件
│   │   ├── InterviewResult.jsx   # 访谈结果展示
│   │   ├── InterviewSession.jsx  # 访谈会话界面
│   │   └── InterviewWorkspace.jsx # 访谈工作区
│   ├── hooks/        # 自定义 Hook
│   │   ├── useAPISpeechRecognition.jsx # API 语音识别
│   │   ├── useAppState.jsx       # 应用状态管理
│   │   ├── useInterviewStore.jsx # 访谈状态管理
│   │   └── useVersion.jsx        # 版本信息
│   ├── pages/        # 页面组件
│   │   ├── index.jsx    # 首页
│   │   └── interview.jsx # 访谈页面
│   ├── index.scss    # 全局样式
│   └── main.jsx      # 应用入口
├── package.json      # 项目配置
├── vite.config.js    # Vite 配置
└── README.md         # 项目说明
```

## 🔧 开发相关

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 React 最佳实践
- 组件采用函数式组件 + Hooks 模式

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋‍♂️ 常见问题

### Q: 支持哪些 AI 服务商？
A: 目前支持 SiliconFlow、DeepSeek、OpenAI 等兼容 OpenAI API 格式的服务商。

### Q: 语音识别准确率如何？
A: 使用专业的语音识别 API，支持中英文识别，准确率较高。建议在安静环境下使用。

### Q: 生成的访谈稿质量如何？
A: 基于先进的大语言模型，结合专业的提示词工程，能够生成高质量、结构化的访谈稿。

### Q: 数据安全如何保障？
A: API 密钥采用加密存储，访谈数据仅在本地保存，不会上传到服务器。

---

✨ **让 AI 助力你的创作之路，从一次有趣的访谈开始！**
