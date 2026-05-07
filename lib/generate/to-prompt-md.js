/**
 * Convert a Style Sniffer JSON profile into a structured style prompt Markdown.
 * The output format matches the style prompts in cc_travel_plan.cc/training/prompts池/
 */
export function toPromptMarkdown(profile) {
  const sections = [];

  sections.push(buildRoleSection());
  sections.push('<design-system>');
  sections.push(buildPhilosophySection(profile));
  sections.push(buildTokenSection(profile));
  sections.push(buildComponentSection(profile));
  sections.push(buildEffectsSection(profile));
  sections.push(buildUsageSection(profile));
  sections.push('</design-system>');

  return sections.filter(Boolean).join('\n\n');
}

function buildRoleSection() {
  return `<role>
You are an expert frontend engineer, UI/UX designer, visual design specialist, and typography expert. Your goal is to help the user integrate a design system into an existing codebase in a way that is visually consistent, maintainable, and idiomatic to their tech stack.

Always aim to:
- Preserve or improve accessibility.
- Maintain visual consistency with the provided design system.
- Leave the codebase in a cleaner, more coherent state than you found it.
- Ensure layouts are responsive and usable across devices.
- Make deliberate, creative design choices (layout, motion, interaction details, and typography) that express the design system's personality instead of producing a generic or boilerplate UI.
</role>`;
}

function buildPhilosophySection(profile) {
  const philosophy = profile.design_philosophy || {};
  const style = profile.design_style?.aesthetic || {};

  let section = `# Design Philosophy\n`;

  if (philosophy.core_essence) {
    section += `\n${philosophy.core_essence}\n`;
  }

  if (philosophy.vibe?.length > 0) {
    section += `\n**Vibe**: ${philosophy.vibe.join(', ')}\n`;
  }

  if (philosophy.visual_dna?.length > 0) {
    section += `\n**Visual DNA**:\n`;
    philosophy.visual_dna.forEach(trait => {
      section += `- ${trait}\n`;
    });
  }

  if (style.mood?.length > 0) {
    section += `\n**Mood**: ${style.mood.join(', ')}\n`;
  }

  if (style.genre) {
    section += `**Genre**: ${style.genre}\n`;
  }

  if (style.personality_traits?.length > 0) {
    section += `**Personality**: ${style.personality_traits.join(', ')}\n`;
  }

  return section;
}

function buildTokenSection(profile) {
  const tokens = profile.design_tokens || {};
  let section = `## Design Token System\n`;

  // Colors
  const colors = tokens.colors || {};
  section += `\n### Colors\n\n`;
  section += `| Token | Value | Usage |\n|---|---|---|\n`;
  section += `| **Background** | \`${colors.background || '-'}\` | Page background |\n`;
  section += `| **Foreground** | \`${colors.foreground || '-'}\` | Primary text |\n`;

  if (colors.primary?.hex) {
    section += `| **Primary** | \`${colors.primary.hex}\` | ${colors.primary.role || 'Primary actions'} |\n`;
  }
  if (colors.secondary?.hex) {
    section += `| **Secondary** | \`${colors.secondary.hex}\` | ${colors.secondary.role || 'Supporting color'} |\n`;
  }
  if (colors.accent?.hex) {
    section += `| **Accent** | \`${colors.accent.hex}\` | ${colors.accent.role || 'Highlights'} |\n`;
  }
  if (colors.muted) {
    section += `| **Muted** | \`${colors.muted}\` | Subtle backgrounds |\n`;
  }
  if (colors.border) {
    section += `| **Border** | \`${colors.border}\` | Borders, dividers |\n`;
  }

  if (colors.contrast_strategy) {
    section += `\n**Contrast Strategy**: ${colors.contrast_strategy}\n`;
  }

  // Typography
  const typo = tokens.typography || {};
  section += `\n### Typography\n\n`;
  section += `- **Headings**: \`${typo.heading_font || 'system-ui'}\`\n`;
  section += `- **Body**: \`${typo.body_font || 'system-ui'}\`\n`;

  if (typo.mono_font && typo.mono_font !== 'monospace') {
    section += `- **Mono**: \`${typo.mono_font}\`\n`;
  }

  if (typo.scale) {
    section += `\n**Type Scale**:\n`;
    for (const [level, values] of Object.entries(typo.scale)) {
      if (values && typeof values === 'object') {
        section += `- ${level}: ${values.size || '-'} / ${values.weight || '-'} / ${values.line_height || '-'}\n`;
      }
    }
  }

  if (typo.style_notes) {
    section += `\n**Notes**: ${typo.style_notes}\n`;
  }

  // Radius
  const radius = tokens.radius || {};
  section += `\n### Radius & Shapes\n\n`;
  section += `- **Small**: \`${radius.small || '-'}\`\n`;
  section += `- **Medium**: \`${radius.medium || '-'}\`\n`;
  section += `- **Large**: \`${radius.large || '-'}\`\n`;

  if (radius.philosophy) {
    section += `\n**Philosophy**: ${radius.philosophy}\n`;
  }

  // Shadows
  const shadows = tokens.shadows || {};
  section += `\n### Shadows & Effects\n\n`;
  section += `- **Style**: ${shadows.style || 'none'}\n`;

  if (shadows.levels) {
    if (shadows.levels.low && shadows.levels.low !== 'none') section += `- **Low**: \`${shadows.levels.low}\`\n`;
    if (shadows.levels.medium && shadows.levels.medium !== 'none') section += `- **Medium**: \`${shadows.levels.medium}\`\n`;
    if (shadows.levels.high && shadows.levels.high !== 'none') section += `- **High**: \`${shadows.levels.high}\`\n`;
  }

  // Borders
  const borders = tokens.borders || {};
  if (borders.usage && borders.usage !== 'none') {
    section += `\n### Borders\n\n`;
    section += `- **Usage**: ${borders.usage}\n`;
    if (borders.style) section += `- **Style**: ${borders.style}\n`;
  }

  return section;
}

function buildComponentSection(profile) {
  const components = profile.component_styles || {};
  let section = `## Component Stylings\n`;

  // Buttons
  const buttons = components.buttons || {};
  section += `\n### Buttons\n\n`;
  if (buttons.primary) section += `- **Primary**: ${buttons.primary}\n`;
  if (buttons.secondary) section += `- **Secondary**: ${buttons.secondary}\n`;
  if (buttons.outline) section += `- **Outline**: ${buttons.outline}\n`;

  // Cards
  const cards = components.cards || {};
  section += `\n### Cards\n\n`;
  if (cards.style) section += `- **Style**: ${cards.style}\n`;
  if (cards.appearance) section += `- **Appearance**: ${cards.appearance}\n`;
  if (cards.interaction) section += `- **Interaction**: ${cards.interaction}\n`;

  // Sections
  const sections_ = components.sections || {};
  if (sections_.background_strategy || sections_.divider_style) {
    section += `\n### Sections\n\n`;
    if (sections_.background_strategy) section += `- **Background**: ${sections_.background_strategy}\n`;
    if (sections_.divider_style) section += `- **Dividers**: ${sections_.divider_style}\n`;
  }

  return section;
}

function buildEffectsSection(profile) {
  const effects = profile.visual_effects || {};
  const overview = effects.overview || {};

  if (overview.effect_intensity === 'none') return null;

  let section = `## Visual Effects\n\n`;
  section += `- **Intensity**: ${overview.effect_intensity}\n`;
  section += `- **Technology**: ${overview.primary_technology}\n`;

  if (effects.composite_notes) {
    section += `\n${effects.composite_notes}\n`;
  }

  return section;
}

function buildUsageSection(profile) {
  const guide = profile.usage_guide || {};
  let section = `## Usage Guide\n`;

  if (guide.signature_traits?.length > 0) {
    section += `\n### Signature Traits\n`;
    guide.signature_traits.forEach(trait => { section += `- ${trait}\n`; });
  }

  if (guide.do?.length > 0) {
    section += `\n### Do\n`;
    guide.do.forEach(item => { section += `- ✅ ${item}\n`; });
  }

  if (guide.dont?.length > 0) {
    section += `\n### Don't\n`;
    guide.dont.forEach(item => { section += `- ❌ ${item}\n`; });
  }

  return section;
}
