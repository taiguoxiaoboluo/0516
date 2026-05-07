---
name: style-sniffer
description: >-
  从图片、截图或 URL 中提取视觉设计身份，输出结构化风格 Prompt。
  三阶段工作流：(1) Structure — 展示完整 Schema，(2) Analyze — 从参考素材中提取设计 DNA 为 JSON，
  (3) Generate — 基于 DNA JSON 生成风格 Prompt 或 HTML 页面。
  触发词："提取风格"、"风格嗅探"、"分析设计"、"提取设计Token"、"截图提取设计"、
  "从URL提取风格"、"提取配色"、"提取字体"、"设计画像"、"style sniffer"、"sniff design"。
---

# Style Sniffer 🐕‍🦺 · 风格嗅探器

三阶段工作流：提取视觉设计身份，输出结构化风格 Prompt。

三个提取维度：

1. **设计 Token** — 可度量值（色彩、字体、间距、圆角、阴影、边框、动效）
2. **设计风格** — 定性感知（情绪、视觉语言、构图、图像风格、交互质感）
3. **视觉特效** — 特殊渲染（Canvas、WebGL、粒子、滚动动效、光标效果、玻璃拟态）

## 阶段说明

### 阶段一：Structure — 展示 Schema

当用户询问 Schema、结构或「你能提取什么」时：

1. 阅读 [references/schema.zh-CN.md](references/schema.zh-CN.md)
2. 展示三个维度及其字段说明
3. 解释每个维度捕获的内容：
   - **design_tokens**：可度量的 — hex 色值、像素尺寸、字体族
   - **design_style**：可感知的 — 情绪、个性、构图策略
   - **visual_effects**：可见但无法用基础 CSS 表达的 — WebGL、粒子、滚动动效
4. 询问用户是否需要自定义或扩展维度

### 阶段二：Analyze — 从参考素材中提取风格

当用户提供图片、截图或 URL 时：

1. 阅读 [references/schema.zh-CN.md](references/schema.zh-CN.md) 获取完整字段列表
2. 对每个参考素材：
   - 如果是图片/截图：直接分析视觉属性
   - 如果是 URL：抓取并分析页面的视觉设计
3. 对 Schema 中的每个字段，提取或推断一个值
4. 当多个参考素材冲突时，标注主导模式并提及变体
5. 输出完整的风格画像 JSON — 每个字段都有值，无空字符串
6. 输出后询问：「需要在生成之前调整任何值吗？」

**各维度分析方法：**

#### 维度一：design_tokens
- **色彩**：通过视觉采样提取主色调。按面积确定主色，按辅助角色确定次色，按 CTA 用途确定强调色。从最浅背景到最深文本映射中性色阶。
- **字体**：通过视觉特征识别字体族。根据标题/正文关系估算字阶比例。
- **间距**：通过元素间距评估密度。通过区块间隔一致性衡量节奏。
- **圆角**：相对元素高度测量 border-radius。标注理念（硬朗 vs. 有机）。
- **阴影**：分类阴影柔度、扩散和分层方式。
- **动效**：如可观察，记录缓动曲线和时长感受。

#### 维度二：design_style
- 综合整体印象 — 情绪、个性、构图策略
- 与风格原型对比（SaaS、编辑杂志、粗野主义、植物风等）
- 记录装饰程度和留白哲学

#### 维度三：visual_effects
- **从代码**：扫描 `<canvas>`、WebGL、Three.js、GSAP、Lottie、IntersectionObserver、SVG `<animate>`
- **从截图**：描述超出标准 CSS 的可见效果 — 粒子、3D、噪点纹理、视差、光标轨迹、玻璃拟态表面
- 对未出现的效果类别设置 `enabled: false`
- 评估 `effect_intensity` 和 `performance_tier`

### 阶段三：Generate — 生成风格 Prompt 或 HTML

当用户提供 DNA JSON（或阶段二提取完成后）：

1. 阅读 [references/generation-guide.zh-CN.md](references/generation-guide.zh-CN.md)
2. 解析 DNA JSON 的三个维度
3. 根据用户需求选择输出格式：

   **选项 A：风格 Prompt Markdown**（默认）
   - 生成结构化 `.md` 文件，格式参见 `references/generation-guide.zh-CN.md`
   - 包含：设计哲学、设计 Token 系统、组件样式、使用指南
   - 输出可直接作为 AI Prompt 用于页面生成

   **选项 B：CSS 变量**
   - 生成包含所有设计 Token 的 `:root` CSS 自定义属性块

   **选项 C：HTML 页面**
   - 给定 DNA JSON + 用户内容，生成自包含 HTML/CSS/JS 页面
   - Token 映射为 CSS 变量，风格字段指导主观设计决策，特效使用适当技术实现

4. 执行生成指南中的质量检查

**如果用户只提供内容没有 DNA JSON**，询问是否：
- 先分析一个参考（进入阶段二）
- 使用描述性风格（从描述中提取 DNA，再生成）

## 阶段组合

- **仅阶段一**：「展示 Schema」/「你能提取什么？」
- **仅阶段二**：「分析这个设计」（附带图片/URL）
- **阶段二 → 三**：「提取风格并生成 Prompt」
- **阶段一 → 二 → 三**：完整流水线
- **仅阶段三**：用户已有 DNA JSON

根据上下文判断需要哪些阶段并执行。
