# 生成指南

如何使用完成的风格画像 JSON 在阶段三生成产出。

## 输出格式

### 格式 A：风格 Prompt Markdown（默认）

生成结构化 `.md` 文件，可直接作为 AI Prompt 用于页面生成。

**必需章节：**

```
<role>
  前端专家 + UI/UX 设计师上下文
</role>

<design-system>
  # 设计哲学
  {来自 design_philosophy}

  ## 设计 Token 系统
  ### 色彩
  {来自 design_tokens.colors — 表格格式}
  ### 字体排版
  {来自 design_tokens.typography}
  ### 圆角与形状
  {来自 design_tokens.radius}
  ### 阴影与效果
  {来自 design_tokens.shadows}

  ## 组件样式
  ### 按钮
  {来自 component_styles.buttons}
  ### 卡片
  {来自 component_styles.cards}
  ### 输入框
  {来自 component_styles.inputs}
  ### 区块
  {来自 component_styles.sections}

  ## 视觉特效
  {来自 visual_effects — 仅已启用的效果}

  ## 使用指南
  {来自 usage_guide.do / dont / signature_traits}
</design-system>
```

### 格式 B：CSS 变量

生成包含所有设计 Token 的 `:root` 块：

```css
:root {
  /* 色彩 */
  --color-bg: {colors.background};
  --color-fg: {colors.foreground};
  --color-primary: {colors.primary.hex};
  --color-secondary: {colors.secondary.hex};
  --color-accent: {colors.accent.hex};
  --color-muted: {colors.muted};
  --color-border: {colors.border};

  /* 字体 */
  --font-heading: {typography.heading_font};
  --font-body: {typography.body_font};

  /* 圆角 */
  --radius-sm: {radius.small};
  --radius-md: {radius.medium};
  --radius-lg: {radius.large};

  /* 阴影 */
  --shadow-low: {shadows.levels.low};
  --shadow-med: {shadows.levels.medium};
  --shadow-high: {shadows.levels.high};

  /* 动效 */
  --ease: {motion.easing};
  --duration-micro: {motion.duration_scale.micro};
  --duration-normal: {motion.duration_scale.normal};
  --duration-macro: {motion.duration_scale.macro};
}
```

### 格式 C：HTML 页面

给定 DNA JSON + 用户内容，生成自包含 HTML 文件：

1. 将 `design_tokens` 映射为 `:root` 中的 CSS 自定义属性
2. 将 `design_style` 字段用于指导主观布局决策
3. 使用适当技术实现 `visual_effects`
4. 所有 CSS 和 JS 内联 — 单文件，无外部依赖（字体除外）

## 优先级顺序

从 DNA JSON 生成时的优先级：

1. **色彩与字体** — 决定 80% 的视觉身份
2. **间距与布局** — 结构节奏
3. **形状与层次** — 表面处理
4. **设计风格** — 情绪、个性、构图
5. **视觉特效** — 特殊渲染层
6. **动效与交互** — 在静态布局稳固后增强

## 质量检查

生成后验证：

- [ ] 所有颜色引用 DNA 调色板 — 无自创颜色
- [ ] 字体匹配 DNA 字体族和字阶
- [ ] 圆角值与 DNA 一致
- [ ] 组件样式匹配 DNA 描述
- [ ] 视觉特效匹配 DNA 的强度和技术层级
- [ ] 使用指南中「应该做」的已遵循
- [ ] 使用指南中「不应该做」的已避免
- [ ] 标志性视觉特征在产出中清晰可见
- [ ] 无应为变量的硬编码值
- [ ] 响应式布局在常见断点下正常工作
