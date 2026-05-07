# Generation Guide

How to use a completed Style Profile JSON to generate outputs in Phase 3.

## Output Formats

### Format A: Style Prompt Markdown (Default)

Generate a structured `.md` file that can be directly used as an AI prompt for page generation.

**Required sections:**

```
<role>
  Expert frontend engineer + UI/UX designer context
</role>

<design-system>
  # Design Philosophy
  {from design_philosophy}

  ## Design Token System
  ### Colors
  {from design_tokens.colors — table format}
  ### Typography
  {from design_tokens.typography}
  ### Radius & Shapes
  {from design_tokens.radius}
  ### Shadows & Effects
  {from design_tokens.shadows}

  ## Component Stylings
  ### Buttons
  {from component_styles.buttons}
  ### Cards
  {from component_styles.cards}
  ### Inputs
  {from component_styles.inputs}
  ### Sections
  {from component_styles.sections}

  ## Visual Effects
  {from visual_effects — only enabled effects}

  ## Usage Guide
  {from usage_guide.do / dont / signature_traits}
</design-system>
```

### Format B: CSS Variables

Generate a `:root` block mapping all design tokens:

```css
:root {
  /* Colors */
  --color-bg: {colors.background};
  --color-fg: {colors.foreground};
  --color-primary: {colors.primary.hex};
  --color-secondary: {colors.secondary.hex};
  --color-accent: {colors.accent.hex};
  --color-muted: {colors.muted};
  --color-border: {colors.border};

  /* Typography */
  --font-heading: {typography.heading_font};
  --font-body: {typography.body_font};

  /* Radius */
  --radius-sm: {radius.small};
  --radius-md: {radius.medium};
  --radius-lg: {radius.large};

  /* Shadows */
  --shadow-low: {shadows.levels.low};
  --shadow-med: {shadows.levels.medium};
  --shadow-high: {shadows.levels.high};

  /* Motion */
  --ease: {motion.easing};
  --duration-micro: {motion.duration_scale.micro};
  --duration-normal: {motion.duration_scale.normal};
  --duration-macro: {motion.duration_scale.macro};
}
```

### Format C: HTML Page

Given DNA JSON + user content, generate a self-contained HTML file:

1. Map `design_tokens` → CSS custom properties in `:root`
2. Apply `design_style` fields to guide subjective layout decisions
3. Implement `visual_effects` using appropriate technologies
4. All CSS and JS inline — single file, no external dependencies (except fonts)

## Priority Order

When generating from DNA JSON:

1. **Color & Typography** — define 80% of visual identity
2. **Spacing & Layout** — structural rhythm
3. **Shape & Elevation** — surface treatment
4. **Design Style** — mood, personality, composition
5. **Visual Effects** — special rendering layer
6. **Motion & Interaction** — enhance after static layout is solid

## Quality Checks

After generation, verify:

- [ ] All colors reference the DNA palette — no invented colors
- [ ] Typography matches DNA font families and scale
- [ ] Radius values are consistent with DNA
- [ ] Component styles match DNA descriptions
- [ ] Visual effects match DNA intensity and technology tier
- [ ] Usage guide "do" items are followed
- [ ] Usage guide "dont" items are avoided
- [ ] Signature traits are clearly present in the output
- [ ] No hardcoded values that should be variables
- [ ] Responsive layout works at common breakpoints
