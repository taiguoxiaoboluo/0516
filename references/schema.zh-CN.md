# Style Sniffer Schema

三维度设计画像：
- **design_tokens** — 可度量值（色彩、字体、间距、圆角、阴影、边框、动效）
- **design_style** — 定性感知（情绪、视觉语言、构图、图像风格、交互质感）
- **visual_effects** — 特殊渲染（Canvas、WebGL、粒子、着色器、滚动动效、光标效果、玻璃拟态）

所有字段必须出现在最终 JSON 输出中。完整 JSON Schema 见 `lib/schema/schema.json`

## 顶层结构

### `meta`
| 字段 | 说明 |
|---|---|
| `name` | 设计画像名称 |
| `description` | 一行简介 |
| `source_references` | 用作参考的 URL 或图片路径 |
| `created_at` | ISO 8601 时间戳 |

### `design_philosophy`
| 字段 | 说明 |
|---|---|
| `core_essence` | 一段话描述设计哲学 |
| `vibe` | 3–6 个情绪关键词，如 `["沉静", "手工感", "温润"]` |
| `visual_dna` | 核心视觉特征，如 `["有机柔和", "字体优雅"]` |
| `fundamental_principles` | 本设计系统遵循的规则 |

---

## 维度一：`design_tokens`（结构化 / 可度量）

### `design_tokens.colors`
| 字段 | 说明 | 示例 |
|---|---|---|
| `palette_type` | 调色板类型 | `"analogous"`（类似色）、`"complementary"`（互补色） |
| `background` | 页面背景色 | `"#F9F8F4"` |
| `foreground` | 主文本色 | `"#2D3A31"` |
| `primary.hex` / `.role` | 主操作色 | `"#8C9A84"` / `"按钮、高亮"` |
| `secondary.hex` / `.role` | 辅助色 | `"#DCCFC2"` / `"卡片背景"` |
| `accent.hex` / `.role` | 强调色 | `"#C27B66"` / `"hover、CTA 点缀"` |
| `muted` | 柔和背景 | `"#F3F4F6"` |
| `border` | 默认边框色 | `"#E6E2DA"` |
| `semantic` | success / warning / error / info | hex 色值 |
| `contrast_strategy` | 对比度策略 | `"高对比"`、`"微妙层次"` |

### `design_tokens.typography`
| 字段 | 说明 |
|---|---|
| `heading_font` | 标题字体族 |
| `body_font` | 正文字体族 |
| `mono_font` | 等宽字体族 |
| `scale.{level}` | display、heading_1–3、body、body_small、caption 的 size/weight/line_height/tracking |
| `style_notes` | 如 `"几何无衬线带人文气息"` |

### `design_tokens.spacing`
| 字段 | 说明 |
|---|---|
| `base_unit` | 如 `"4px"` 或 `"0.25rem"` |
| `scale` | 间距梯度数组 |
| `content_density` | `"compact"`（紧凑）/ `"comfortable"`（舒适）/ `"spacious"`（宽松） |
| `section_rhythm` | 区块间垂直间距的变化节奏 |

### `design_tokens.radius`
| 字段 | 说明 |
|---|---|
| `small` / `medium` / `large` / `pill` | 圆角值 |
| `philosophy` | 如 `"硬朗几何"` 或 `"柔和有机"` |

### `design_tokens.shadows`
| 字段 | 说明 |
|---|---|
| `style` | `"none"`、`"soft-diffused"`（柔散）、`"hard-drop"`（硬投影）、`"layered"`（分层）、`"colored"`（彩色） |
| `levels.low/medium/high` | CSS 阴影值 |
| `depth_cues` | 如何传达深度感 |

### `design_tokens.borders`
| 字段 | 说明 |
|---|---|
| `usage` | `"none"`、`"subtle 1px"`、`"bold borders"` |
| `style` | 边框样式详情 |
| `divider_style` | 分隔线风格 |

### `design_tokens.motion`
| 字段 | 说明 |
|---|---|
| `easing` | CSS 缓动函数 |
| `duration_scale.micro/normal/macro` | 时长值 |
| `philosophy` | `"极简功能型"`、`"活泼弹跳"`、`"电影感"` |

---

## 维度二：`design_style`（定性 / 感知）

### `design_style.aesthetic`
| 字段 | 说明 |
|---|---|
| `mood` | 3–5 个情绪词 |
| `genre` | 如 `"奢华编辑"`、`"独立创意"`、`"企业 SaaS"` |
| `era_influence` | 历史设计影响 |
| `personality_traits` | 假如这个设计是一个人 |
| `adjectives` | 描述性形容词 |

### `design_style.visual_language`
| 字段 | 可选值 |
|---|---|
| `complexity` | `"minimal"` / `"moderate"` / `"rich"` / `"maximal"` |
| `ornamentation` | `"none"` / `"subtle-accents"` / `"decorative"` / `"heavily-ornamented"` |
| `whitespace_usage` | `"tight"` / `"balanced"` / `"generous"` / `"dramatic"` |
| `contrast_level` | `"low"` / `"medium"` / `"high"` / `"extreme"` |
| `texture_usage` | 如 `"纸纹叠加"`、`"噪点纹理"`、`"无"` |
| `focal_strategy` | 如 `"单一主视觉"`、`"分散兴趣点"` |

### `design_style.composition`
| 字段 | 说明 |
|---|---|
| `hierarchy_method` | `"缩放对比"`、`"色彩权重"`、`"字体层级"` |
| `balance_type` | `"symmetric"` / `"asymmetric"` / `"radial"` / `"mosaic"` |
| `flow_direction` | 内容流向 |
| `negative_space_role` | 留白的角色 |

### `design_style.imagery`
| 字段 | 说明 |
|---|---|
| `photo_treatment` | `"降饱和"`、`"鲜艳"`、`"双色调"`、`"灰度"` |
| `illustration_style` | 插画风格 |
| `graphic_elements` | 装饰性 SVG、渐变、图案 |
| `pattern_usage` | 图案 / 纹理使用 |

### `design_style.interaction_feel`
| 字段 | 可选值 |
|---|---|
| `hover_behavior` | hover 交互描述 |
| `transition_personality` | `"snappy"` / `"smooth-glide"` / `"bouncy-elastic"` / `"fade-subtle"` |
| `microinteraction_density` | `"none"` / `"sparse"` / `"moderate"` / `"rich"` |

---

## 维度三：`visual_effects`（特殊渲染）

### `visual_effects.overview`
| 字段 | 可选值 |
|---|---|
| `effect_intensity` | `"none"` / `"subtle-accent"` / `"moderate"` / `"heavy-immersive"` |
| `performance_tier` | `"lightweight"` / `"medium"` / `"heavy"` |
| `primary_technology` | `"CSS only"`、`"Canvas 2D"`、`"Three.js"`、`"GSAP"` |
| `fallback_strategy` | 低端设备降级方案 |

### 其他效果类别
- `background_effects` — 渐变动画、噪点场、网格渐变、视频背景
- `scroll_effects` — 视差层、滚动触发动画
- `text_effects` — 逐字动画、打字机效果、故障风、渐变填充
- `cursor_effects` — 自定义光标、磁性按钮、聚光灯、轨迹
- `glassmorphism` — 玻璃、拟物、磨砂层
- `composite_notes` — 多层效果或不确定性的自由文本备注

---

## `component_styles`

| 字段 | 说明 |
|---|---|
| `buttons.primary/secondary/outline` | 按钮变体描述 |
| `cards.style/appearance/interaction` | 卡片样式模式 |
| `inputs.normal/focus` | 输入框样式 |
| `navigation` | 导航模式 |
| `sections.divider_style` | 区块分隔方式 |
| `sections.background_strategy` | 区块背景策略 |

---

## `usage_guide`

| 字段 | 说明 |
|---|---|
| `do` | 应用此设计时应该做的事 |
| `dont` | 应该避免的事 |
| `signature_traits` | 最具辨识度的视觉特征 |
