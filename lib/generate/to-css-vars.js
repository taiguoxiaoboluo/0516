/**
 * Convert a Style Sniffer JSON profile into CSS custom properties.
 */
export function toCssVariables(profile) {
  const tokens = profile.design_tokens || {};
  const colors = tokens.colors || {};
  const typo = tokens.typography || {};
  const radius = tokens.radius || {};
  const shadows = tokens.shadows || {};
  const motion = tokens.motion || {};

  let css = `:root {\n`;
  css += `  /* Colors */\n`;
  css += `  --color-bg: ${colors.background || '#ffffff'};\n`;
  css += `  --color-fg: ${colors.foreground || '#000000'};\n`;
  css += `  --color-primary: ${colors.primary?.hex || '#3b82f6'};\n`;
  css += `  --color-secondary: ${colors.secondary?.hex || '#10b981'};\n`;
  css += `  --color-accent: ${colors.accent?.hex || '#f59e0b'};\n`;
  css += `  --color-muted: ${colors.muted || '#f3f4f6'};\n`;
  css += `  --color-border: ${colors.border || '#e5e7eb'};\n`;

  if (colors.semantic) {
    css += `\n  /* Semantic Colors */\n`;
    css += `  --color-success: ${colors.semantic.success || '#10b981'};\n`;
    css += `  --color-warning: ${colors.semantic.warning || '#f59e0b'};\n`;
    css += `  --color-error: ${colors.semantic.error || '#ef4444'};\n`;
    css += `  --color-info: ${colors.semantic.info || '#3b82f6'};\n`;
  }

  css += `\n  /* Typography */\n`;
  css += `  --font-heading: ${typo.heading_font || 'system-ui'}, sans-serif;\n`;
  css += `  --font-body: ${typo.body_font || 'system-ui'}, sans-serif;\n`;
  css += `  --font-mono: ${typo.mono_font || 'monospace'};\n`;

  css += `\n  /* Radius */\n`;
  css += `  --radius-sm: ${radius.small || '4px'};\n`;
  css += `  --radius-md: ${radius.medium || '8px'};\n`;
  css += `  --radius-lg: ${radius.large || '16px'};\n`;
  css += `  --radius-pill: ${radius.pill || '9999px'};\n`;

  if (shadows.levels) {
    css += `\n  /* Shadows */\n`;
    css += `  --shadow-low: ${shadows.levels.low || 'none'};\n`;
    css += `  --shadow-med: ${shadows.levels.medium || 'none'};\n`;
    css += `  --shadow-high: ${shadows.levels.high || 'none'};\n`;
  }

  if (motion.easing) {
    css += `\n  /* Motion */\n`;
    css += `  --ease: ${motion.easing};\n`;
    css += `  --duration-micro: ${motion.duration_scale?.micro || '100ms'};\n`;
    css += `  --duration-normal: ${motion.duration_scale?.normal || '200ms'};\n`;
    css += `  --duration-macro: ${motion.duration_scale?.macro || '500ms'};\n`;
  }

  css += `}\n`;
  return css;
}
