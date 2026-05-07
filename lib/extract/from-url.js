import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '..', '..');

export async function extract(url, options = {}) {
  const viewport = options.mobile
    ? { width: 390, height: 844 }
    : { width: 1920, height: 1080 };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    console.log('   🌐 Loading page...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('   🔍 Extracting design tokens...');

    const extractedData = await page.evaluate(() => {
      const body = document.body;
      const computedBody = getComputedStyle(body);
      const html = document.documentElement;
      const computedHtml = getComputedStyle(html);

      // ---- Color Extraction ----
      function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return rgb;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      }

      function getBackgroundColor() {
        const bodyBg = rgbToHex(computedBody.backgroundColor);
        const htmlBg = rgbToHex(computedHtml.backgroundColor);
        return bodyBg || htmlBg || '#ffffff';
      }

      function getTextColor() {
        return rgbToHex(computedBody.color) || '#000000';
      }

      function collectColors() {
        const colorMap = new Map();
        const elements = document.querySelectorAll('*');
        const sampleSize = Math.min(elements.length, 500);

        for (let i = 0; i < sampleSize; i++) {
          const element = elements[i];
          const style = getComputedStyle(element);

          const bgColor = rgbToHex(style.backgroundColor);
          if (bgColor && bgColor !== '#000000' && bgColor !== '#ffffff') {
            const count = colorMap.get(bgColor) || { count: 0, context: [] };
            count.count++;
            if (count.context.length < 3) {
              count.context.push(element.tagName.toLowerCase());
            }
            colorMap.set(bgColor, count);
          }

          const textColor = rgbToHex(style.color);
          if (textColor && textColor !== '#000000' && textColor !== '#ffffff') {
            const count = colorMap.get(textColor) || { count: 0, context: [] };
            count.count++;
            colorMap.set(textColor, count);
          }

          const borderColor = rgbToHex(style.borderColor);
          if (borderColor && borderColor !== '#000000' && borderColor !== '#ffffff') {
            const count = colorMap.get(borderColor) || { count: 0, context: [] };
            count.count++;
            colorMap.set(borderColor, count);
          }
        }

        return Array.from(colorMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 20)
          .map(([hex, data]) => ({ hex, count: data.count, context: data.context }));
      }

      // ---- Typography Extraction ----
      function collectFonts() {
        const fontMap = new Map();
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const bodyElements = document.querySelectorAll('p, span, li, td, div');

        let headingFont = null;
        let bodyFont = null;

        headingElements.forEach(element => {
          const style = getComputedStyle(element);
          const fontFamily = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
          if (!headingFont) headingFont = fontFamily;
          const count = fontMap.get(fontFamily) || { count: 0, role: 'heading' };
          count.count++;
          fontMap.set(fontFamily, count);
        });

        const bodySample = Array.from(bodyElements).slice(0, 100);
        bodySample.forEach(element => {
          const style = getComputedStyle(element);
          const fontFamily = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
          if (!bodyFont && element.textContent.trim().length > 20) bodyFont = fontFamily;
          const count = fontMap.get(fontFamily) || { count: 0, role: 'body' };
          count.count++;
          fontMap.set(fontFamily, count);
        });

        // Extract type scale from headings
        const typeScale = {};
        ['h1', 'h2', 'h3'].forEach(tag => {
          const element = document.querySelector(tag);
          if (element) {
            const style = getComputedStyle(element);
            typeScale[tag] = {
              size: style.fontSize,
              weight: style.fontWeight,
              line_height: style.lineHeight,
              tracking: style.letterSpacing
            };
          }
        });

        const firstP = document.querySelector('p');
        if (firstP) {
          const style = getComputedStyle(firstP);
          typeScale['body'] = {
            size: style.fontSize,
            weight: style.fontWeight,
            line_height: style.lineHeight,
            tracking: style.letterSpacing
          };
        }

        return { headingFont, bodyFont, fonts: Array.from(fontMap.entries()), typeScale };
      }

      // ---- Spacing Extraction ----
      function collectSpacing() {
        const spacingValues = [];
        const sections = document.querySelectorAll('section, [class*="section"], main > div');
        const sectionSample = Array.from(sections).slice(0, 10);

        sectionSample.forEach(section => {
          const style = getComputedStyle(section);
          spacingValues.push({
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            marginTop: style.marginTop,
            marginBottom: style.marginBottom
          });
        });

        const contentDensity = spacingValues.length > 0
          ? (parseInt(spacingValues[0]?.paddingTop) > 80 ? 'spacious' : parseInt(spacingValues[0]?.paddingTop) > 40 ? 'comfortable' : 'compact')
          : 'comfortable';

        return { spacingValues, contentDensity };
      }

      // ---- Radius Extraction ----
      function collectRadius() {
        const radiusValues = new Map();
        const elements = document.querySelectorAll('button, [class*="card"], [class*="btn"], input, img, [class*="container"]');

        elements.forEach(element => {
          const style = getComputedStyle(element);
          const radius = style.borderRadius;
          if (radius && radius !== '0px') {
            const count = radiusValues.get(radius) || 0;
            radiusValues.set(radius, count + 1);
          }
        });

        const sorted = Array.from(radiusValues.entries()).sort((a, b) => b[1] - a[1]);
        return sorted.map(([value, count]) => ({ value, count }));
      }

      // ---- Shadow Extraction ----
      function collectShadows() {
        const shadowValues = new Map();
        const elements = document.querySelectorAll('*');
        const sampleSize = Math.min(elements.length, 300);

        for (let i = 0; i < sampleSize; i++) {
          const style = getComputedStyle(elements[i]);
          const shadow = style.boxShadow;
          if (shadow && shadow !== 'none') {
            const count = shadowValues.get(shadow) || 0;
            shadowValues.set(shadow, count + 1);
          }
        }

        const sorted = Array.from(shadowValues.entries()).sort((a, b) => b[1] - a[1]);
        return sorted.slice(0, 5).map(([value, count]) => ({ value, count }));
      }

      // ---- Border Extraction ----
      function collectBorders() {
        let borderCount = 0;
        let noBorderCount = 0;
        const borderStyles = new Map();
        const elements = document.querySelectorAll('*');
        const sampleSize = Math.min(elements.length, 300);

        for (let i = 0; i < sampleSize; i++) {
          const style = getComputedStyle(elements[i]);
          const borderWidth = parseInt(style.borderWidth);
          if (borderWidth > 0) {
            borderCount++;
            const borderStyle = `${style.borderWidth} ${style.borderStyle}`;
            const count = borderStyles.get(borderStyle) || 0;
            borderStyles.set(borderStyle, count + 1);
          } else {
            noBorderCount++;
          }
        }

        const ratio = borderCount / (borderCount + noBorderCount);
        let usage = 'none';
        if (ratio > 0.3) usage = 'bold borders';
        else if (ratio > 0.1) usage = 'subtle 1px';
        else if (ratio > 0.02) usage = 'minimal';

        return { usage, borderCount, noBorderCount, styles: Array.from(borderStyles.entries()) };
      }

      // ---- CSS Variables Extraction ----
      function collectCssVariables() {
        const variables = {};
        const sheets = document.styleSheets;

        try {
          for (const sheet of sheets) {
            try {
              const rules = sheet.cssRules || sheet.rules;
              for (const rule of rules) {
                if (rule.selectorText === ':root' || rule.selectorText === 'html') {
                  const style = rule.style;
                  for (let i = 0; i < style.length; i++) {
                    const prop = style[i];
                    if (prop.startsWith('--')) {
                      variables[prop] = style.getPropertyValue(prop).trim();
                    }
                  }
                }
              }
            } catch (crossOriginError) {
              // Skip cross-origin stylesheets
            }
          }
        } catch (accessError) {
          // Skip inaccessible stylesheets
        }

        return variables;
      }

      // ---- Button Style Extraction ----
      function collectButtonStyles() {
        const buttons = document.querySelectorAll('button, [class*="btn"], a[class*="button"]');
        const styles = [];

        Array.from(buttons).slice(0, 5).forEach(button => {
          const style = getComputedStyle(button);
          styles.push({
            text: button.textContent.trim().slice(0, 30),
            backgroundColor: rgbToHex(style.backgroundColor),
            color: rgbToHex(style.color),
            borderRadius: style.borderRadius,
            border: style.border,
            padding: style.padding,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight
          });
        });

        return styles;
      }

      // ---- Run All Extractors ----
      return {
        backgroundColor: getBackgroundColor(),
        textColor: getTextColor(),
        colors: collectColors(),
        fonts: collectFonts(),
        spacing: collectSpacing(),
        radius: collectRadius(),
        shadows: collectShadows(),
        borders: collectBorders(),
        cssVariables: collectCssVariables(),
        buttonStyles: collectButtonStyles(),
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || ''
      };
    });

    console.log('   📸 Capturing evidence screenshots...');
    const evidence = await captureEvidence(page, url, extractedData);

    console.log('   🧬 Building design profile...');
    const profile = buildProfile(url, extractedData);
    profile.evidence = evidence;

    return profile;
  } finally {
    if (browser) await browser.close();
  }
}

async function captureEvidence(page, url, extractedData) {
  const snapshotsDir = join(projectRoot, 'web', 'snapshots');
  if (!existsSync(snapshotsDir)) mkdirSync(snapshotsDir, { recursive: true });

  const timestamp = Date.now();
  const evidence = { sections: [], timestamp };

  // 获取页面总高度和视口高度
  const dimensions = await page.evaluate(() => ({
    fullHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth
  }));

  // 按视口高度分段截图，每屏一张
  const sectionCount = Math.min(Math.ceil(dimensions.fullHeight / dimensions.viewportHeight), 8);

  for (let i = 0; i < sectionCount; i++) {
    const yOffset = i * dimensions.viewportHeight;
    const clipHeight = Math.min(dimensions.viewportHeight, dimensions.fullHeight - yOffset);
    if (clipHeight < 50) break;

    // 滚动到该区域
    await page.evaluate((y) => window.scrollTo(0, y), yOffset);
    await page.waitForTimeout(500);

    // 收集该视口区域内的视觉特效
    const sectionRange = { startY: yOffset, endY: yOffset + clipHeight };
    const sectionEffects = await page.evaluate((range) => {
      const { startY, endY } = range;
      const effects = [];
      const colorSet = new Set();
      const colors = [];
      const elements = document.querySelectorAll('*');

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        const absBottom = absTop + rect.height;
        if (absBottom < startY || absTop > endY) continue;
        if (rect.width < 20 || rect.height < 20) continue;

        const style = getComputedStyle(el);
        const tag = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0].slice(0, 30) : '');
        const bg = style.backgroundImage || '';

        // 视觉特效
        if (bg.includes('linear-gradient')) effects.push({ type: '线性渐变', value: bg.slice(0, 100), tag });
        else if (bg.includes('radial-gradient')) effects.push({ type: '径向渐变', value: bg.slice(0, 100), tag });
        else if (bg.includes('conic-gradient')) effects.push({ type: '锥形渐变', value: bg.slice(0, 100), tag });
        if (style.backdropFilter && style.backdropFilter !== 'none') effects.push({ type: '毛玻璃', value: style.backdropFilter, tag });
        if (style.mixBlendMode && style.mixBlendMode !== 'normal') effects.push({ type: '混合模式', value: style.mixBlendMode, tag });
        if (style.filter && style.filter !== 'none') effects.push({ type: '滤镜', value: style.filter, tag });
        if (style.boxShadow && style.boxShadow !== 'none') effects.push({ type: '阴影', value: style.boxShadow.slice(0, 80), tag });
        if (bg.includes('url(')) effects.push({ type: '背景图', value: 'url(...)', tag });

        // 颜色收集
        const bgColor = style.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && !colorSet.has(bgColor)) {
          colorSet.add(bgColor);
          colors.push({ color: bgColor, tag });
        }

        if (effects.length >= 10) break;
      }

      // 字体检测
      const textEls = document.querySelectorAll('h1, h2, h3, h4, p, span, a');
      const fontSet = new Set();
      const fonts = [];
      for (const el of textEls) {
        const rect = el.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        if (absTop < startY || absTop > endY) continue;
        const style = getComputedStyle(el);
        const fontKey = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        if (!fontSet.has(fontKey) && fontKey) {
          fontSet.add(fontKey);
          fonts.push({ font: fontKey, size: style.fontSize, weight: style.fontWeight, tag: el.tagName.toLowerCase() });
        }
      }

      return { effects: effects.slice(0, 8), colors: colors.slice(0, 6), fonts: fonts.slice(0, 4) };
    }, sectionRange);

    // 截图（滚动到位后直接截视口，避免 clip 坐标溢出）
    const shotPath = join(snapshotsDir, timestamp + '_section_' + i + '.png');
    await page.screenshot({ path: shotPath, fullPage: false });

    // 构建该 section 的描述
    const descriptions = [];

    if (sectionEffects.colors.length) {
      descriptions.push('**色彩**：检测到 ' + sectionEffects.colors.length + ' 种背景色 — ' + sectionEffects.colors.map(c => c.color).join('、'));
    }
    if (sectionEffects.fonts.length) {
      descriptions.push('**字体**：' + sectionEffects.fonts.map(f => f.font + '（' + f.size + '/' + f.weight + '，<' + f.tag + '>）').join('、'));
    }
    if (sectionEffects.effects.length) {
      const grouped = {};
      sectionEffects.effects.forEach(e => {
        if (!grouped[e.type]) grouped[e.type] = [];
        grouped[e.type].push(e);
      });
      Object.entries(grouped).forEach(([type, items]) => {
        const detail = items.map(e => '<' + e.tag + '> → `' + e.value + '`').join('；');
        descriptions.push('**' + type + '**：' + detail);
      });
    }
    if (descriptions.length === 0) {
      descriptions.push('该区域未检测到显著的视觉特效');
    }

    const sectionLabels = ['首屏 Hero', '第二屏', '第三屏', '第四屏', '第五屏', '第六屏', '第七屏', '第八屏'];

    evidence.sections.push({
      id: 'section_' + i,
      path: '/snapshots/' + timestamp + '_section_' + i + '.png',
      label: sectionLabels[i] || '第 ' + (i + 1) + ' 屏',
      descriptions
    });
  }

  // 回到顶部
  await page.evaluate(() => window.scrollTo(0, 0));

  return evidence;
}

function buildProfile(url, raw) {
  const topColors = raw.colors.slice(0, 6);
  const primaryColor = topColors[0] || { hex: '#3b82f6' };
  const secondaryColor = topColors[1] || { hex: '#10b981' };
  const accentColor = topColors[2] || { hex: '#f59e0b' };

  const radiusSorted = raw.radius.sort((a, b) => b.count - a.count);
  const smallRadius = radiusSorted[2]?.value || '4px';
  const mediumRadius = radiusSorted[1]?.value || '8px';
  const largeRadius = radiusSorted[0]?.value || '16px';

  const shadowStyle = raw.shadows.length === 0 ? 'none'
    : raw.shadows[0]?.value?.includes('rgba') ? 'soft-diffused' : 'hard-drop';

  return {
    meta: {
      name: raw.title || new URL(url).hostname,
      description: raw.metaDescription || `Design profile extracted from ${url}`,
      source_references: [url],
      created_at: new Date().toISOString()
    },
    design_philosophy: {
      core_essence: `Design identity extracted from ${raw.title || url}`,
      vibe: inferVibe(raw),
      visual_dna: inferVisualDna(raw),
      fundamental_principles: []
    },
    design_tokens: {
      colors: {
        palette_type: 'custom',
        background: raw.backgroundColor,
        foreground: raw.textColor,
        primary: { hex: primaryColor.hex, role: `Primary color (${primaryColor.context?.join(', ') || 'general'})` },
        secondary: { hex: secondaryColor.hex, role: `Secondary color` },
        accent: { hex: accentColor.hex, role: `Accent color` },
        muted: topColors[3]?.hex || '#f3f4f6',
        border: topColors[4]?.hex || '#e5e7eb',
        semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' },
        contrast_strategy: inferContrastStrategy(raw.backgroundColor, raw.textColor),
        all_extracted: topColors
      },
      typography: {
        heading_font: raw.fonts.headingFont || 'system-ui',
        body_font: raw.fonts.bodyFont || 'system-ui',
        mono_font: 'monospace',
        scale: raw.fonts.typeScale,
        style_notes: inferTypographyNotes(raw.fonts.headingFont)
      },
      spacing: {
        base_unit: '4px',
        scale: [],
        content_density: raw.spacing.contentDensity,
        section_rhythm: raw.spacing.spacingValues.length > 0
          ? `Sections use ${raw.spacing.spacingValues[0]?.paddingTop} - ${raw.spacing.spacingValues[0]?.paddingBottom} vertical padding`
          : 'Unknown'
      },
      radius: {
        small: smallRadius,
        medium: mediumRadius,
        large: largeRadius,
        pill: '9999px',
        philosophy: inferRadiusPhilosophy(radiusSorted)
      },
      shadows: {
        style: shadowStyle,
        levels: {
          low: raw.shadows[2]?.value || 'none',
          medium: raw.shadows[1]?.value || 'none',
          high: raw.shadows[0]?.value || 'none'
        },
        depth_cues: shadowStyle === 'none' ? 'Color and spacing only' : 'Shadow-based elevation'
      },
      borders: {
        usage: raw.borders.usage,
        style: raw.borders.styles?.[0]?.[0] || 'none',
        divider_style: raw.borders.usage === 'none' ? 'Whitespace only' : 'Line dividers'
      },
      motion: {
        easing: 'ease',
        duration_scale: { micro: '100ms', normal: '200ms', macro: '500ms' },
        philosophy: 'minimal functional'
      }
    },
    design_style: {
      aesthetic: {
        mood: inferVibe(raw),
        genre: inferGenre(raw),
        era_influence: 'contemporary',
        personality_traits: [],
        adjectives: []
      },
      visual_language: {
        complexity: raw.colors.length > 10 ? 'rich' : raw.colors.length > 5 ? 'moderate' : 'minimal',
        ornamentation: 'subtle-accents',
        whitespace_usage: raw.spacing.contentDensity === 'spacious' ? 'generous' : 'balanced',
        contrast_level: inferContrastLevel(raw.backgroundColor, raw.textColor),
        texture_usage: 'none',
        focal_strategy: 'single hero element'
      },
      composition: {
        hierarchy_method: 'scale contrast',
        balance_type: 'symmetric',
        flow_direction: 'top-to-bottom',
        negative_space_role: raw.spacing.contentDensity === 'spacious' ? 'Breathing room, creates elegance' : 'Functional spacing'
      },
      imagery: {
        photo_treatment: 'vibrant',
        illustration_style: 'none detected',
        graphic_elements: 'none detected',
        pattern_usage: 'none detected'
      },
      interaction_feel: {
        hover_behavior: 'standard',
        transition_personality: 'smooth-glide',
        microinteraction_density: 'moderate'
      }
    },
    visual_effects: {
      overview: {
        effect_intensity: 'none',
        performance_tier: 'lightweight',
        primary_technology: 'CSS only',
        fallback_strategy: 'none needed'
      },
      composite_notes: 'Effects require interactive analysis for accurate detection'
    },
    component_styles: {
      buttons: inferButtonStyles(raw.buttonStyles),
      cards: { style: 'standard', appearance: 'Rounded corners with subtle elevation', interaction: 'hover scale' },
      inputs: { normal: 'Standard input styling', focus: 'Border highlight on focus' },
      navigation: 'top navigation bar',
      sections: {
        divider_style: raw.borders.usage === 'none' ? 'Whitespace between sections' : 'Line dividers',
        background_strategy: 'Alternating white and muted backgrounds'
      }
    },
    usage_guide: {
      do: [],
      dont: [],
      signature_traits: []
    },
    _raw: {
      css_variables: raw.cssVariables,
      all_colors: raw.colors,
      all_fonts: raw.fonts.fonts,
      all_radius: raw.radius,
      all_shadows: raw.shadows
    }
  };
}

// ---- Helper Functions ----

function inferVibe(raw) {
  const vibes = [];
  if (raw.spacing.contentDensity === 'spacious') vibes.push('airy');
  if (raw.spacing.contentDensity === 'compact') vibes.push('dense');
  const bgBrightness = hexBrightness(raw.backgroundColor);
  if (bgBrightness > 240) vibes.push('clean');
  if (bgBrightness < 50) vibes.push('dark', 'dramatic');
  if (vibes.length === 0) vibes.push('modern');
  return vibes;
}

function inferVisualDna(raw) {
  const traits = [];
  if (raw.radius.length > 0 && parseInt(raw.radius[0]?.value) > 16) traits.push('rounded shapes');
  if (raw.shadows.length > 3) traits.push('layered elevation');
  if (raw.shadows.length === 0) traits.push('flat design');
  if (raw.borders.usage === 'bold borders') traits.push('strong borders');
  return traits.length > 0 ? traits : ['standard web design'];
}

function inferContrastStrategy(bg, fg) {
  const bgBright = hexBrightness(bg);
  const fgBright = hexBrightness(fg);
  const diff = Math.abs(bgBright - fgBright);
  if (diff > 200) return 'high contrast';
  if (diff > 100) return 'medium contrast';
  return 'subtle layers';
}

function inferContrastLevel(bg, fg) {
  const bgBright = hexBrightness(bg);
  const fgBright = hexBrightness(fg);
  const diff = Math.abs(bgBright - fgBright);
  if (diff > 200) return 'high';
  if (diff > 150) return 'medium';
  return 'low';
}

function inferTypographyNotes(headingFont) {
  if (!headingFont) return 'system default';
  const lower = headingFont.toLowerCase();
  if (lower.includes('serif') && !lower.includes('sans')) return 'serif heading with classic feel';
  if (lower.includes('mono')) return 'monospace technical feel';
  return 'sans-serif modern heading';
}

function inferRadiusPhilosophy(radiusSorted) {
  if (radiusSorted.length === 0) return 'sharp geometric';
  const maxRadius = parseInt(radiusSorted[0]?.value || '0');
  if (maxRadius >= 24) return 'soft organic';
  if (maxRadius >= 12) return 'moderately rounded';
  if (maxRadius >= 4) return 'subtly rounded';
  return 'sharp geometric';
}

function inferGenre(raw) {
  const bgBright = hexBrightness(raw.backgroundColor);
  if (bgBright < 50) return 'dark mode tech';
  if (raw.spacing.contentDensity === 'spacious') return 'editorial / portfolio';
  return 'corporate / SaaS';
}

function inferButtonStyles(buttonStyles) {
  if (!buttonStyles || buttonStyles.length === 0) {
    return { primary: 'standard button', secondary: 'standard button', outline: 'standard button' };
  }
  const first = buttonStyles[0];
  return {
    primary: `Background ${first.backgroundColor}, text ${first.color}, radius ${first.borderRadius}, padding ${first.padding}`,
    secondary: buttonStyles[1] ? `Background ${buttonStyles[1].backgroundColor}, text ${buttonStyles[1].color}` : 'lighter variant',
    outline: 'border-based variant'
  };
}

function hexBrightness(hex) {
  if (!hex || hex.length < 7) return 128;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
