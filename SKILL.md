---
name: style-sniffer
description: >-
  Extract visual design identity from images, screenshots, or URLs into
  structured style prompts. Three-phase workflow: (1) Structure — show the full
  schema, (2) Analyze — extract design DNA from references into JSON,
  (3) Generate — apply DNA JSON to produce style prompt or HTML page.
  Triggers on "extract style", "style sniffer", "sniff design", "analyze design",
  "extract design tokens", "design from screenshot", "style prompt from URL",
  "extract color palette", "extract typography", "design profile", "风格提取",
  "提取风格", "提取设计", "风格嗅探".
---

# Style Sniffer 🐕‍🦺 · 风格嗅探器

A 3-phase workflow for extracting visual design identity and outputting structured style prompts.

Three dimensions of extraction:

1. **Design Tokens** — measurable values (color, typography, spacing, radius, shadows, borders, motion)
2. **Design Style** — qualitative perception (mood, visual language, composition, imagery, interaction feel)
3. **Visual Effects** — special rendering (Canvas, WebGL, particles, scroll effects, cursor effects, glassmorphism)

## Phases

### Phase 1: Structure — Show the Schema

When the user asks for the schema, structure, or "what can you extract":

1. Read [references/schema.md](references/schema.md)
2. Present the three dimensions with field descriptions
3. Explain what each dimension captures:
   - **design_tokens**: What you can measure — hex values, pixel sizes, font families
   - **design_style**: What you can feel — mood, personality, composition strategy
   - **visual_effects**: What you can see but can't express in basic CSS — WebGL, particles, scroll effects
4. Ask if the user wants to customize or extend any dimensions

### Phase 2: Analyze — Extract Style from References

When the user provides images, screenshots, or URLs:

1. Read [references/schema.md](references/schema.md) for the full field list
2. For each reference:
   - If image/screenshot: analyze visual properties directly from the image
   - If URL: fetch and analyze the page's visual design
3. For every field in the schema, extract or infer a value
4. When multiple references conflict, note the dominant pattern and mention variants
5. Output a complete Style Profile JSON — every field populated, no empty strings
6. After output, ask: "Want to adjust any values before generating a prompt?"

**Analysis approach per dimension:**

#### Dimension 1: design_tokens
- **colors**: Extract dominant palette via visual sampling. Primary by area, secondary by supporting role, accent by CTA usage. Map neutral scale from lightest background to darkest text.
- **typography**: Identify font families by visual characteristics. Estimate scale ratios from heading/body relationships.
- **spacing**: Assess density by element proximity. Measure rhythm by section gap consistency.
- **radius**: Measure border-radius relative to element height. Note philosophy (sharp vs. organic).
- **shadows**: Classify shadow softness, spread, and layering.
- **motion**: If observable, note easing curves and duration feel.

#### Dimension 2: design_style
- Synthesize holistic impressions — mood, personality, composition strategy
- Compare against genre archetypes (SaaS, editorial, brutalist, botanical, etc.)
- Note ornamentation level and whitespace philosophy

#### Dimension 3: visual_effects
- **From code**: Scan for `<canvas>`, WebGL, Three.js, GSAP, Lottie, IntersectionObserver, SVG `<animate>`
- **From screenshots**: Describe visible effects beyond standard CSS — particles, 3D, noise textures, parallax, cursor trails, glassmorphic surfaces
- Set `enabled: false` for any effect category not present
- Rate `effect_intensity` and `performance_tier`

### Phase 3: Generate — Produce Style Prompt or HTML

When the user provides DNA JSON (or after Phase 2 extraction):

1. Read [references/generation-guide.md](references/generation-guide.md)
2. Parse the DNA JSON across all three dimensions
3. Choose output format based on user request:

   **Option A: Style Prompt Markdown** (default)
   - Generate a structured `.md` file matching the format in `references/generation-guide.md`
   - Include: Design Philosophy, Design Token System, Component Stylings, Usage Guide
   - The output should be directly usable as an AI prompt for page generation

   **Option B: CSS Variables**
   - Generate a `:root` block with all design tokens as CSS custom properties

   **Option C: HTML Page**
   - Given DNA JSON + user content, generate a self-contained HTML/CSS/JS page
   - Apply tokens as CSS variables, style fields as subjective design decisions, effects with appropriate technologies

4. Run quality checks from the generation guide

**If the user provides only content without DNA JSON**, ask whether to:
- Analyze a reference first (go to Phase 2)
- Use a described style (extract DNA from description, then generate)

## Phase Combinations

- **Phase 1 only**: "Show me the schema" / "What can you extract?"
- **Phase 2 only**: "Analyze this design" (with images/URLs)
- **Phase 2 → 3**: "Extract the style and generate a prompt"
- **Phase 1 → 2 → 3**: Full pipeline
- **Phase 3 only**: User already has DNA JSON

Detect which phase(s) are needed from context and execute accordingly.
