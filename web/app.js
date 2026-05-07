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
  if (!url) return showToast('Please enter a URL');

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

    if (!response.ok) throw new Error('Extraction failed');
    const result = await response.json();
    displayResult(result);
  } catch (error) {
    showToast('Error: ' + error.message);
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
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
    preview.hidden = false;
    showToast('Image loaded. AI vision analysis coming in Phase 2!');
  };
  reader.readAsDataURL(file);
}

// ===== JSON Generate =====
document.getElementById('generateBtn').addEventListener('click', () => {
  const jsonText = document.getElementById('jsonInput').value.trim();
  if (!jsonText) return showToast('Please paste a JSON profile');

  try {
    const profile = JSON.parse(jsonText);
    displayResult(profile);
  } catch (error) {
    showToast('Invalid JSON: ' + error.message);
  }
});

// ===== Display Result =====
function displayResult(profile) {
  document.getElementById('resultSection').hidden = false;
  document.getElementById('resultTitle').textContent =
    (profile.meta?.name || 'Unknown') + ' — Design Profile';

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
    { label: 'Background', hex: colors.background },
    { label: 'Foreground', hex: colors.foreground },
    { label: 'Primary', hex: colors.primary?.hex },
    { label: 'Secondary', hex: colors.secondary?.hex },
    { label: 'Accent', hex: colors.accent?.hex },
    { label: 'Muted', hex: colors.muted },
    { label: 'Border', hex: colors.border }
  ];

  const extracted = colors.all_extracted || [];
  extracted.forEach((c, i) => {
    if (i < 6) colorList.push({ label: 'Palette ' + (i + 1), hex: c.hex });
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
      showToast('Copied: ' + hex);
    });
    grid.appendChild(swatch);
  });
}

function renderTypography(profile) {
  const container = document.getElementById('typoContent');
  container.innerHTML = '';
  const typo = profile.design_tokens?.typography || {};

  const fonts = [
    { label: 'Heading Font', value: typo.heading_font, sample: 'The quick brown fox', style: 'font-size:28px;font-weight:700;' },
    { label: 'Body Font', value: typo.body_font, sample: 'The quick brown fox jumps over the lazy dog.', style: 'font-size:16px;font-weight:400;' }
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
        '<div class="typo-sample" style="font-size:' + (values.size || '16px') + ';font-weight:' + (values.weight || '400') + ';">Sample Text</div>';
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
    ['Genre', aesthetic.genre],
    ['Complexity', visual.complexity],
    ['Whitespace', visual.whitespace_usage],
    ['Contrast', visual.contrast_level],
    ['Ornamentation', visual.ornamentation],
    ['Texture', visual.texture_usage]
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

  text += '# Design Philosophy\n\n';
  text += (profile.design_philosophy?.core_essence || 'Extracted design profile') + '\n\n';

  if (profile.design_philosophy?.vibe?.length) {
    text += 'Vibe: ' + profile.design_philosophy.vibe.join(', ') + '\n\n';
  }

  text += '## Colors\n\n';
  text += '| Token | Value |\n|---|---|\n';
  text += '| Background | `' + (colors.background || '-') + '` |\n';
  text += '| Foreground | `' + (colors.foreground || '-') + '` |\n';
  if (colors.primary?.hex) text += '| Primary | `' + colors.primary.hex + '` |\n';
  if (colors.secondary?.hex) text += '| Secondary | `' + colors.secondary.hex + '` |\n';
  if (colors.accent?.hex) text += '| Accent | `' + colors.accent.hex + '` |\n';

  text += '\n## Typography\n\n';
  text += '- Heading: ' + (typo.heading_font || '-') + '\n';
  text += '- Body: ' + (typo.body_font || '-') + '\n';

  return text;
}

// ===== Copy Buttons =====
document.getElementById('copyJsonBtn').addEventListener('click', () => {
  const text = document.getElementById('jsonOutput').textContent;
  navigator.clipboard.writeText(text);
  showToast('JSON copied!');
});
document.getElementById('copyPromptBtn').addEventListener('click', () => {
  const text = document.getElementById('promptOutput').textContent;
  navigator.clipboard.writeText(text);
  showToast('Prompt copied!');
});
document.getElementById('copyCssBtn').addEventListener('click', () => {
  const json = document.getElementById('jsonOutput').textContent;
  try {
    const profile = JSON.parse(json);
    const css = generateCssVars(profile);
    navigator.clipboard.writeText(css);
    showToast('CSS variables copied!');
  } catch (error) {
    showToast('Error generating CSS');
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
