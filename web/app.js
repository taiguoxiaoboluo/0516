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
  showToast('图片风格分析功能即将上线，敬请期待！');
});

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
    { label: '正文字体', value: typo.body_font, sample: '从截图、图片或网页 URL 中提取视觉设计 DNA，输出结构化风格 Prompt。', style: 'font-size:16px;font-weight:400;' }
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
    Object.entries(typo.scale).forEach(([level, values]) => {
      if (!values || typeof values !== 'object') return;
      const div = document.createElement('div');
      div.className = 'typo-preview';
      div.innerHTML =
        '<div class="typo-label">' + level + ' — ' + (values.size || '') + ' / ' + (values.weight || '') + '</div>' +
        '<div class="typo-sample" style="font-size:' + (values.size || '16px') + ';font-weight:' + (values.weight || '400') + ';">示例文本</div>';
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
