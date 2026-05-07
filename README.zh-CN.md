<h1 align="center">🐕‍🦺 Style Sniffer · 风格嗅探器</h1>

<p align="center">
  <a href="README.md">English</a> | 中文
</p>

从截图、图片或网页 URL 中提取视觉设计 DNA，输出结构化风格 Prompt。一条命令搞定。

## 安装

全局安装：

```bash
npm install -g style-sniffer
```

或使用 npx 免安装运行：

```bash
npx style-sniffer sniff example.com
```

需要 Node.js 18+

## 使用方式

### CLI（命令行）

```bash
# 从 URL 提取设计风格
style-sniffer sniff example.com

# 保存 JSON + Prompt 到 output/ 目录
style-sniffer sniff example.com --save --prompt

# 仅输出原始 JSON
style-sniffer sniff example.com --json-only

# 使用移动端视口（390×844）
style-sniffer sniff example.com --mobile

# 查看完整 Schema
style-sniffer schema

# 从已有 JSON 生成风格 Prompt
style-sniffer generate profile.json --format prompt
```

### Agent Skill（智能体技能）

安装到你的 AI 智能体：

```bash
npx skills add style-sniffer
```

然后对智能体说：*「提取 example.com 的设计风格」*

### 网页界面

```bash
cd web && node server.js
```

浏览器打开 `http://localhost:3000`

## 三阶段工作流

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Phase 1    │      │  Phase 2    │      │  Phase 3    │
│  Structure  │ ───→ │  Analyze    │ ───→ │  Generate   │
│  展示 Schema │      │  提取风格    │      │  生成产出    │
└─────────────┘      └─────────────┘      └─────────────┘
```

| 阶段 | 输入 | 输出 |
|------|------|------|
| **Structure（结构）** | — | 完整 Schema 及字段说明 |
| **Analyze（分析）** | URL / 图片 / 截图 | 设计画像 JSON |
| **Generate（生成）** | JSON + 内容 | 风格 Prompt (.md) / CSS 变量 / HTML 页面 |

## 提取内容

| 维度 | 包含 |
|------|------|
| **设计 Token** | 色彩调色板、字体排版、间距节奏、圆角、阴影、边框、动效 |
| **设计风格** | 情绪、视觉语言、构图、图像风格、交互质感 |
| **视觉特效** | 滚动动效、光标效果、玻璃拟态、粒子特效 |
| **组件样式** | 按钮、卡片、输入框、导航、区块 |

## 项目结构

```
style-sniffer/
├── bin/cli.js                  # CLI 入口
├── lib/
│   ├── extract/from-url.js     # URL 提取（Playwright）
│   ├── generate/
│   │   ├── to-prompt-md.js     # JSON → 风格 Prompt
│   │   └── to-css-vars.js      # JSON → CSS 变量
│   └── schema/                 # Schema 定义
├── references/
│   ├── schema.md               # 完整 Schema 文档
│   └── generation-guide.md     # 生成指南
├── web/                        # 网页界面
├── SKILL.md                    # Agent Skill 入口
└── package.json
```

## 许可证

MIT
