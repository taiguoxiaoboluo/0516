# Style Sniffer Schema

Three-dimensional design profile:
- **design_tokens** — measurable values (color, typography, spacing, radius, shadows, borders, motion)
- **design_style** — qualitative perception (mood, visual language, composition, imagery, interaction feel)
- **visual_effects** — special rendering (Canvas, WebGL, particles, shaders, scroll effects, cursor effects, glassmorphism)

Every field must appear in the final JSON output. Full JSON Schema: `lib/schema/schema.json`

## Top-Level Structure

### `meta`
| Field | Description |
|---|---|
| `name` | Design profile name |
| `description` | One-line summary |
| `source_references` | URLs or image paths used as references |
| `created_at` | ISO 8601 timestamp |

### `design_philosophy`
| Field | Description |
|---|---|
| `core_essence` | One paragraph describing the design philosophy |
| `vibe` | 3–6 mood keywords, e.g. `["calm", "artisanal", "warm"]` |
| `visual_dna` | Core visual traits, e.g. `["organic softness", "typographic elegance"]` |
| `fundamental_principles` | Design rules this system follows |

---

## Dimension 1: `design_tokens` (Structural / Measurable)

### `design_tokens.colors`
| Field | Description | Example |
|---|---|---|
| `palette_type` | Palette classification | `"analogous"`, `"complementary"` |
| `background` | Page background hex | `"#F9F8F4"` |
| `foreground` | Primary text hex | `"#2D3A31"` |
| `primary.hex` / `.role` | Primary action color | `"#8C9A84"` / `"buttons, highlights"` |
| `secondary.hex` / `.role` | Supporting color | `"#DCCFC2"` / `"card backgrounds"` |
| `accent.hex` / `.role` | Highlight color | `"#C27B66"` / `"hover, CTA pops"` |
| `muted` | Subtle background | `"#F3F4F6"` |
| `border` | Default border color | `"#E6E2DA"` |
| `semantic` | success / warning / error / info | Hex values |
| `contrast_strategy` | How contrast is managed | `"high contrast"`, `"subtle layers"` |

### `design_tokens.typography`
| Field | Description |
|---|---|
| `heading_font` | Font family for headings |
| `body_font` | Font family for body text |
| `mono_font` | Font family for code/mono |
| `scale.{level}` | Size/weight/line_height/tracking for: display, heading_1–3, body, body_small, caption |
| `style_notes` | e.g. `"geometric sans with humanist touches"` |

### `design_tokens.spacing`
| Field | Description |
|---|---|
| `base_unit` | e.g. `"4px"` or `"0.25rem"` |
| `scale` | Array of spacing values |
| `content_density` | `"compact"` / `"comfortable"` / `"spacious"` |
| `section_rhythm` | How vertical spacing varies between sections |

### `design_tokens.radius`
| Field | Description |
|---|---|
| `small` / `medium` / `large` / `pill` | Border radius values |
| `philosophy` | e.g. `"sharp geometric"` or `"soft organic"` |

### `design_tokens.shadows`
| Field | Description |
|---|---|
| `style` | `"none"`, `"soft-diffused"`, `"hard-drop"`, `"layered"`, `"colored"` |
| `levels.low/medium/high` | CSS shadow values |
| `depth_cues` | How depth is communicated |

### `design_tokens.borders`
| Field | Description |
|---|---|
| `usage` | `"none"`, `"subtle 1px"`, `"bold borders"` |
| `style` | Border style details |
| `divider_style` | Section divider approach |

### `design_tokens.motion`
| Field | Description |
|---|---|
| `easing` | CSS easing function |
| `duration_scale.micro/normal/macro` | Duration values |
| `philosophy` | `"minimal functional"`, `"playful bouncy"`, `"cinematic"` |

---

## Dimension 2: `design_style` (Qualitative / Perceptual)

### `design_style.aesthetic`
| Field | Description |
|---|---|
| `mood` | 3–5 mood words |
| `genre` | e.g. `"luxury editorial"`, `"indie creative"` |
| `era_influence` | Historical design influence |
| `personality_traits` | As if the design were a person |
| `adjectives` | Descriptive adjectives |

### `design_style.visual_language`
| Field | Values |
|---|---|
| `complexity` | `"minimal"` / `"moderate"` / `"rich"` / `"maximal"` |
| `ornamentation` | `"none"` / `"subtle-accents"` / `"decorative"` / `"heavily-ornamented"` |
| `whitespace_usage` | `"tight"` / `"balanced"` / `"generous"` / `"dramatic"` |
| `contrast_level` | `"low"` / `"medium"` / `"high"` / `"extreme"` |
| `texture_usage` | e.g. `"paper grain overlay"`, `"noise texture"`, `"none"` |
| `focal_strategy` | e.g. `"single hero element"`, `"distributed interest"` |

### `design_style.composition`
| Field | Description |
|---|---|
| `hierarchy_method` | `"scale contrast"`, `"color weight"`, `"typographic hierarchy"` |
| `balance_type` | `"symmetric"` / `"asymmetric"` / `"radial"` / `"mosaic"` |
| `flow_direction` | Content flow direction |
| `negative_space_role` | Role of whitespace |

### `design_style.imagery`
| Field | Description |
|---|---|
| `photo_treatment` | `"desaturated"`, `"vibrant"`, `"duotone"`, `"grayscale"` |
| `illustration_style` | Illustration approach |
| `graphic_elements` | Decorative SVGs, gradients, patterns |
| `pattern_usage` | Pattern/texture usage |

### `design_style.interaction_feel`
| Field | Values |
|---|---|
| `hover_behavior` | Hover interaction description |
| `transition_personality` | `"snappy"` / `"smooth-glide"` / `"bouncy-elastic"` / `"fade-subtle"` |
| `microinteraction_density` | `"none"` / `"sparse"` / `"moderate"` / `"rich"` |

---

## Dimension 3: `visual_effects` (Special Rendering)

### `visual_effects.overview`
| Field | Values |
|---|---|
| `effect_intensity` | `"none"` / `"subtle-accent"` / `"moderate"` / `"heavy-immersive"` |
| `performance_tier` | `"lightweight"` / `"medium"` / `"heavy"` |
| `primary_technology` | `"CSS only"`, `"Canvas 2D"`, `"Three.js"`, `"GSAP"` |
| `fallback_strategy` | What happens on low-end devices |

### Other effect categories
- `background_effects` — gradient-animation, noise-field, mesh-gradient, video-bg
- `scroll_effects` — parallax layers, scroll-triggered animations
- `text_effects` — split-letter-animate, typewriter, glitch, gradient-fill
- `cursor_effects` — custom-cursor, magnetic-buttons, spotlight, trail
- `glassmorphism` — glass, neumorphic, frosted-layers
- `composite_notes` — Free-text for layered effects or ambiguity

---

## `component_styles`

| Field | Description |
|---|---|
| `buttons.primary/secondary/outline` | Button variant descriptions |
| `cards.style/appearance/interaction` | Card styling patterns |
| `inputs.normal/focus` | Input field styles |
| `navigation` | Navigation pattern |
| `sections.divider_style` | Section divider approach |
| `sections.background_strategy` | Section background strategy |

---

## `usage_guide`

| Field | Description |
|---|---|
| `do` | Things to do when applying this design |
| `dont` | Things to avoid |
| `signature_traits` | Most recognizable visual traits |
