// ===== Tab Switching =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ===== URL Sniff =====
document.getElementById('sniffBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) return showToast('请输入一个 URL');

  showLoading(true);
  hideResult();

  try {
    const response = await fetch('/api/sniff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.startsWith('http') ? url : 'https://' + url,
        darkMode: document.getElementById('optDarkMode').checked,
        mobile: document.getElementById('optMobile').checked
      })
    });

    if (!response.ok) throw new Error('提取失败');
    const result = await response.json();
    displayResult(result);
  } catch (error) {
    showToast('错误：' + error.message);
  } finally {
    showLoading(false);
  }
});

// ===== Drop Zone =====
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleImageFile(file);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleImageFile(e.target.files[0]);
});

function handleImageFile(file) {
  const preview = document.getElementById('imagePreview');
  const imageSniffBtn = document.getElementById('imageSniffBtn');
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.innerHTML = '<img src="' + e.target.result + '" alt="预览">';
    preview.hidden = false;
    imageSniffBtn.hidden = false;
    showToast('图片已加载，点击「开始嗅探」进行分析');
  };
  reader.readAsDataURL(file);
}

// ===== 图片嗅探按钮 =====
document.getElementById('imageSniffBtn').addEventListener('click', () => {
  const img = document.querySelector('#imagePreview img');
  if (!img) return showToast('请先上传一张图片');

  showLoading(true);
  hideResult();

  setTimeout(() => {
    try {
      const profile = extractColorsFromImage(img);
      displayResult(profile);
    } catch (error) {
      showToast('分析失败：' + error.message);
    } finally {
      showLoading(false);
    }
  }, 300);
});

function extractColorsFromImage(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const maxSize = 200;
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
  canvas.width = Math.floor(img.naturalWidth * scale);
  canvas.height = Math.floor(img.naturalHeight * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // 收集所有颜色并量化
  const colorBuckets = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.round(pixels[i] / 16) * 16;
    const g = Math.round(pixels[i + 1] / 16) * 16;
    const b = Math.round(pixels[i + 2] / 16) * 16;
    const alpha = pixels[i + 3];
    if (alpha < 128) continue;
    const key = r + ',' + g + ',' + b;
    colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
  }

  // 排序取 Top 颜色
  const sorted = Array.from(colorBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  // 合并相近颜色
  const merged = [];
  sorted.forEach(([key, count]) => {
    const [r, g, b] = key.split(',').map(Number);
    const tooClose = merged.some(m => {
      const dr = Math.abs(m.r - r), dg = Math.abs(m.g - g), db = Math.abs(m.b - b);
      if (dr + dg + db < 60) { m.count += count; return true; }
      return false;
    });
    if (!tooClose) merged.push({ r, g, b, count });
  });

  merged.sort((a, b) => b.count - a.count);
  const topColors = merged.slice(0, 10).map(c => {
    const hex = '#' + [c.r, c.g, c.b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
    return { hex, count: c.count };
  });

  // 推断背景色（最多像素 & 亮度偏高的）
  const bgColor = topColors.find(c => hexBrightness(c.hex) > 180) || topColors[0];
  const fgColor = topColors.find(c => hexBrightness(c.hex) < 80) || topColors[topColors.length - 1];
  const midColors = topColors.filter(c => c !== bgColor && c !== fgColor);

  return {
    meta: {
      name: '图片风格分析',
      description: '从上传图片中提取的设计画像',
      source_references: ['uploaded-image'],
      created_at: new Date().toISOString()
    },
    design_philosophy: {
      core_essence: '从图片像素中提取的视觉设计身份',
      vibe: inferVibeFromColors(topColors),
      visual_dna: [],
      fundamental_principles: []
    },
    design_tokens: {
      colors: {
        palette_type: 'custom',
        background: bgColor?.hex || '#ffffff',
        foreground: fgColor?.hex || '#000000',
        primary: { hex: midColors[0]?.hex || '#3b82f6', role: '主色（面积最大的非背景/前景色）' },
        secondary: { hex: midColors[1]?.hex || '#10b981', role: '次色' },
        accent: { hex: midColors[2]?.hex || '#f59e0b', role: '强调色' },
        muted: midColors[3]?.hex || '#f3f4f6',
        border: midColors[4]?.hex || '#e5e7eb',
        semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' },
        contrast_strategy: Math.abs(hexBrightness(bgColor?.hex) - hexBrightness(fgColor?.hex)) > 150 ? '高对比' : '柔和层次',
        all_extracted: topColors
      },
      typography: { heading_font: '需截图分析', body_font: '需截图分析', scale: {}, style_notes: '图片提取无法识别字体，建议配合 URL 提取' },
      spacing: { base_unit: '4px', content_density: 'comfortable', section_rhythm: '需交互分析' },
      radius: { small: '4px', medium: '8px', large: '16px', pill: '9999px', philosophy: '需截图分析' },
      shadows: { style: '需截图分析', levels: { low: 'none', medium: 'none', high: 'none' } },
      borders: { usage: '需截图分析', style: '', divider_style: '' },
      motion: { easing: 'ease', duration_scale: { micro: '100ms', normal: '200ms', macro: '500ms' }, philosophy: '需交互分析' }
    },
    design_style: {
      aesthetic: { mood: inferVibeFromColors(topColors), genre: inferGenreFromColors(topColors), personality_traits: [], adjectives: [] },
      visual_language: {
        complexity: topColors.length > 6 ? 'rich' : topColors.length > 3 ? 'moderate' : 'minimal',
        ornamentation: 'subtle-accents',
        whitespace_usage: 'balanced',
        contrast_level: Math.abs(hexBrightness(bgColor?.hex) - hexBrightness(fgColor?.hex)) > 150 ? 'high' : 'medium',
        texture_usage: 'none',
        focal_strategy: '需截图分析'
      },
      composition: { hierarchy_method: '需截图分析', balance_type: 'symmetric', flow_direction: 'top-to-bottom', negative_space_role: '需截图分析' },
      imagery: { photo_treatment: '需截图分析', illustration_style: '需截图分析', graphic_elements: '需截图分析', pattern_usage: '需截图分析' },
      interaction_feel: { hover_behavior: '需交互分析', transition_personality: 'smooth-glide', microinteraction_density: 'moderate' }
    },
    visual_effects: { overview: { effect_intensity: 'none', performance_tier: 'lightweight', primary_technology: 'CSS only' }, composite_notes: '图片提取无法检测动效' },
    component_styles: { buttons: { primary: '需截图分析', secondary: '需截图分析', outline: '需截图分析' }, cards: { style: '需截图分析' }, inputs: { normal: '需截图分析' }, navigation: '需截图分析', sections: {} },
    usage_guide: { do: [], dont: [], signature_traits: [] }
  };
}

function hexBrightness(hex) {
  if (!hex || hex.length < 7) return 128;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function inferVibeFromColors(colors) {
  const vibes = [];
  const avgBrightness = colors.reduce((sum, c) => sum + hexBrightness(c.hex), 0) / colors.length;
  if (avgBrightness > 200) vibes.push('明亮');
  else if (avgBrightness > 140) vibes.push('柔和');
  else if (avgBrightness > 80) vibes.push('沉稳');
  else vibes.push('暗调');

  const hasVibrant = colors.some(c => {
    const r = parseInt(c.hex.slice(1, 3), 16), g = parseInt(c.hex.slice(3, 5), 16), b = parseInt(c.hex.slice(5, 7), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) > 100;
  });
  if (hasVibrant) vibes.push('鲜艳');
  else vibes.push('低饱和');

  if (colors.length <= 3) vibes.push('极简');
  else if (colors.length >= 7) vibes.push('丰富');
  return vibes;
}

function inferGenreFromColors(colors) {
  const avgBrightness = colors.reduce((sum, c) => sum + hexBrightness(c.hex), 0) / colors.length;
  if (avgBrightness < 60) return '暗色科技 / 游戏';
  if (avgBrightness > 220) return '极简 / 留白';
  return '现代通用';
}

// ===== JSON Generate =====
document.getElementById('generateBtn').addEventListener('click', () => {
  const jsonText = document.getElementById('jsonInput').value.trim();
  if (!jsonText) return showToast('请粘贴一个 JSON 画像');

  try {
    const profile = JSON.parse(jsonText);
    displayResult(profile);
  } catch (error) {
    showToast('JSON 格式错误：' + error.message);
  }
});

// ===== Display Result =====
function displayResult(profile) {
  document.getElementById('resultSection').hidden = false;
  document.getElementById('resultTitle').textContent =
    (profile.meta?.name || '未知') + ' — 设计画像';

  renderColors(profile);
  renderTypography(profile);
  renderStyle(profile);
  renderEvidence(profile);

  document.getElementById('jsonOutput').textContent = JSON.stringify(profile, null, 2);
  document.getElementById('promptOutput').textContent = generatePromptText(profile);

  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderColors(profile) {
  const grid = document.getElementById('colorGrid');
  grid.innerHTML = '';
  const colors = profile.design_tokens?.colors || {};

  const colorList = [
    { label: '背景色', hex: colors.background },
    { label: '前景色', hex: colors.foreground },
    { label: '主色', hex: colors.primary?.hex },
    { label: '次色', hex: colors.secondary?.hex },
    { label: '强调色', hex: colors.accent?.hex },
    { label: '柔和色', hex: colors.muted },
    { label: '边框色', hex: colors.border }
  ];

  const extracted = colors.all_extracted || [];
  extracted.forEach((c, i) => {
    if (i < 6) colorList.push({ label: '色板 ' + (i + 1), hex: c.hex });
  });

  colorList.forEach(({ label, hex }) => {
    if (!hex) return;
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.innerHTML =
      '<div class="color-swatch-block" style="background:' + hex + '">' +
        '<span class="color-swatch-hex">' + hex + '</span>' +
      '</div>' +
      '<div class="color-swatch-label">' + label + '</div>';
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(hex);
      showToast('已复制：' + hex);
    });
    grid.appendChild(swatch);
  });
}

function renderTypography(profile) {
  const container = document.getElementById('typoContent');
  container.innerHTML = '';
  const typo = profile.design_tokens?.typography || {};

  const fonts = [
    { label: '标题字体', value: typo.heading_font, sample: '风格嗅探器 Style Sniffer', style: 'font-size:28px;font-weight:700;' },
    { label: '正文字体', value: typo.body_font, sample: '风格嗅探器 Style Sniffer', style: 'font-size:16px;font-weight:400;' }
  ];

  fonts.forEach(({ label, value, sample, style }) => {
    if (!value) return;
    const div = document.createElement('div');
    div.className = 'typo-preview';
    div.innerHTML =
      '<div class="typo-label">' + label + ' — ' + value + '</div>' +
      '<div class="typo-sample" style="font-family:' + value + ',sans-serif;' + style + '">' + sample + '</div>';
    container.appendChild(div);
  });

  if (typo.scale) {
    const previewSizes = { display: '32px', h1: '28px', heading_1: '28px', h2: '22px', heading_2: '22px', h3: '18px', heading_3: '18px', body: '16px', body_small: '14px', caption: '12px' };
    Object.entries(typo.scale).forEach(([level, values]) => {
      if (!values || typeof values !== 'object') return;
      const previewSize = previewSizes[level] || '16px';
      const div = document.createElement('div');
      div.className = 'typo-preview';
      div.innerHTML =
        '<div class="typo-label">' + level + ' — 原始值：' + (values.size || '-') + ' / 字重：' + (values.weight || '-') + ' / 行高：' + (values.line_height || '-') + '</div>' +
        '<div class="typo-sample" style="font-size:' + previewSize + ';font-weight:' + (values.weight || '400') + ';">风格嗅探器 Style Sniffer</div>';
      container.appendChild(div);
    });
  }
}

function renderStyle(profile) {
  const container = document.getElementById('styleContent');
  container.innerHTML = '';
  const style = profile.design_style || {};
  const aesthetic = style.aesthetic || {};
  const visual = style.visual_language || {};

  if (aesthetic.mood?.length) {
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'style-tags';
    aesthetic.mood.forEach(m => {
      const tag = document.createElement('span');
      tag.className = 'style-tag';
      tag.textContent = m;
      tagsDiv.appendChild(tag);
    });
    container.appendChild(tagsDiv);
  }

  const rows = [
    ['风格类型', aesthetic.genre],
    ['复杂度', visual.complexity],
    ['留白', visual.whitespace_usage],
    ['对比度', visual.contrast_level],
    ['装饰程度', visual.ornamentation],
    ['纹理', visual.texture_usage]
  ];

  rows.forEach(([label, value]) => {
    if (!value) return;
    const row = document.createElement('div');
    row.className = 'style-row';
    row.innerHTML = '<span class="style-label">' + label + '</span><span class="style-value">' + value + '</span>';
    container.appendChild(row);
  });
}

// ===== Render Evidence =====
function renderEvidence(profile) {
  const evidence = profile.evidence;
  const card = document.getElementById('evidenceCard');
  const grid = document.getElementById('evidenceContent');
  const effectsDiv = document.getElementById('effectsContent');
  const colorSourcesDiv = document.getElementById('colorSourcesContent');

  grid.innerHTML = '';
  effectsDiv.innerHTML = '';
  colorSourcesDiv.innerHTML = '';

  if (!evidence || !evidence.screenshots?.length) {
    card.hidden = true;
    return;
  }

  card.hidden = false;

  // 截图卡片
  evidence.screenshots.forEach(shot => {
    const item = document.createElement('div');
    item.className = 'evidence-item';
    item.innerHTML =
      '<div class="evidence-img-wrap">' +
        '<img src="' + shot.path + '" alt="' + shot.label + '" loading="lazy">' +
      '</div>' +
      '<div class="evidence-info">' +
        '<div class="evidence-label">' + shot.label + '</div>' +
        '<div class="evidence-description">' + shot.description + '</div>' +
      '</div>';
    grid.appendChild(item);
  });

  // 视觉特效检测
  if (evidence.visualEffects?.length) {
    effectsDiv.innerHTML = '<h5 class="evidence-subtitle">🎭 检测到的视觉特效</h5>';
    const list = document.createElement('div');
    list.className = 'effects-tags';
    evidence.visualEffects.forEach(effect => {
      const tag = document.createElement('div');
      tag.className = 'effect-tag';
      tag.innerHTML =
        '<span class="effect-type">' + effect.type + '</span>' +
        '<code class="effect-value">' + effect.value + '</code>' +
        '<span class="effect-source">来源：&lt;' + effect.tag + '&gt;</span>';
      list.appendChild(tag);
    });
    effectsDiv.appendChild(list);
  }

  // 颜色来源标注
  if (evidence.colorSources?.length) {
    colorSourcesDiv.innerHTML = '<h5 class="evidence-subtitle">🎨 颜色来源定位</h5>';
    const list = document.createElement('div');
    list.className = 'color-source-list';
    evidence.colorSources.forEach(source => {
      const item = document.createElement('div');
      item.className = 'color-source-item';
      item.innerHTML =
        '<span class="color-source-swatch" style="background:' + source.color + '"></span>' +
        '<span class="color-source-value">' + source.color + '</span>' +
        '<span class="color-source-tag">&lt;' + source.tag + '&gt;</span>' +
        '<span class="color-source-pos">位置：(' + Math.round(source.rect.x) + ', ' + Math.round(source.rect.y) + ') ' + Math.round(source.rect.w) + '×' + Math.round(source.rect.h) + 'px</span>';
      list.appendChild(item);
    });
    colorSourcesDiv.appendChild(list);
  }
}

// ===== Generate Prompt Text =====
function generatePromptText(profile) {
  let text = '';
  const tokens = profile.design_tokens || {};
  const colors = tokens.colors || {};
  const typo = tokens.typography || {};

  text += '# 设计哲学\n\n';
  text += (profile.design_philosophy?.core_essence || '提取的设计画像') + '\n\n';

  if (profile.design_philosophy?.vibe?.length) {
    text += '调性：' + profile.design_philosophy.vibe.join('、') + '\n\n';
  }

  text += '## 色彩\n\n';
  text += '| 角色 | 色值 |\n|---|---|\n';
  text += '| 背景色 | `' + (colors.background || '-') + '` |\n';
  text += '| 前景色 | `' + (colors.foreground || '-') + '` |\n';
  if (colors.primary?.hex) text += '| 主色 | `' + colors.primary.hex + '` |\n';
  if (colors.secondary?.hex) text += '| 次色 | `' + colors.secondary.hex + '` |\n';
  if (colors.accent?.hex) text += '| 强调色 | `' + colors.accent.hex + '` |\n';

  text += '\n## 字体排版\n\n';
  text += '- 标题字体：' + (typo.heading_font || '-') + '\n';
  text += '- 正文字体：' + (typo.body_font || '-') + '\n';

  return text;
}

// ===== Copy Buttons =====
document.getElementById('copyJsonBtn').addEventListener('click', () => {
  const text = document.getElementById('jsonOutput').textContent;
  navigator.clipboard.writeText(text);
  showToast('JSON 已复制！');
});
document.getElementById('copyPromptBtn').addEventListener('click', () => {
  const text = document.getElementById('promptOutput').textContent;
  navigator.clipboard.writeText(text);
  showToast('Prompt 已复制！');
});
document.getElementById('copyCssBtn').addEventListener('click', () => {
  const json = document.getElementById('jsonOutput').textContent;
  try {
    const profile = JSON.parse(json);
    const css = generateCssVars(profile);
    navigator.clipboard.writeText(css);
    showToast('CSS 变量已复制！');
  } catch (error) {
    showToast('CSS 生成失败');
  }
});

function generateCssVars(profile) {
  const tokens = profile.design_tokens || {};
  const colors = tokens.colors || {};
  const radius = tokens.radius || {};
  let css = ':root {\n';
  css += '  --color-bg: ' + (colors.background || '#fff') + ';\n';
  css += '  --color-fg: ' + (colors.foreground || '#000') + ';\n';
  css += '  --color-primary: ' + (colors.primary?.hex || '#3b82f6') + ';\n';
  css += '  --color-secondary: ' + (colors.secondary?.hex || '#10b981') + ';\n';
  css += '  --color-accent: ' + (colors.accent?.hex || '#f59e0b') + ';\n';
  css += '  --radius-sm: ' + (radius.small || '4px') + ';\n';
  css += '  --radius-md: ' + (radius.medium || '8px') + ';\n';
  css += '  --radius-lg: ' + (radius.large || '16px') + ';\n';
  css += '}\n';
  return css;
}

// ===== Utilities =====
function showLoading(visible) {
  document.getElementById('loading').hidden = !visible;
}

function hideResult() {
  document.getElementById('resultSection').hidden = true;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2000);
}

// ===== Enter Key =====
document.getElementById('urlInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('sniffBtn').click();
});
