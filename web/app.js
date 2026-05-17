// ===== Tab Switching =====
function activateTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === 'tab-' + tabName);
  });
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

document.querySelectorAll('.copy-command').forEach(button => {
  button.addEventListener('click', async () => {
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = '复制'; }, 1200);
    } catch (_) {
      showToast('复制失败，请手动选中命令复制');
    }
  });
});

// ===== 检测是否有后端服务器（GitHub Pages / 静态文件 vs 本地服务）=====
const isStaticMode = location.protocol === 'file:'
  || location.hostname.includes('github.io')
  || location.hostname.includes('pages.dev')
  || location.hostname.includes('netlify.app');
let backendBase = '';
let hasUrlBackend = !isStaticMode;

function setUrlNoticeVisible(visible) {
  const urlNotice = document.getElementById('urlServerNotice');
  if (!urlNotice) return;
  urlNotice.hidden = !visible;
  urlNotice.style.display = visible ? '' : 'none';
}

function setUrlControlsEnabled(enabled) {
  const urlInput = document.getElementById('urlInput');
  const sniffBtn = document.getElementById('sniffBtn');
  const darkMode = document.getElementById('optDarkMode');
  const mobile = document.getElementById('optMobile');

  if (urlInput) {
    urlInput.disabled = !enabled;
    urlInput.placeholder = enabled ? 'https://example.com' : '在线版请切到「图片 / 截图」；本地运行后可用';
  }
  if (sniffBtn) {
    sniffBtn.disabled = !enabled;
    sniffBtn.textContent = enabled ? '开始嗅探 🐕‍🦺' : '本地版可用';
  }
  if (darkMode) darkMode.disabled = !enabled;
  if (mobile) mobile.disabled = !enabled;
}

function fetchWithTimeout(url, options = {}, timeout = 600) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function detectUrlBackend() {
  const localCandidates = Array.from({ length: 21 }, (_, index) => `http://127.0.0.1:${3000 + index}`);

  for (const base of localCandidates) {
    try {
      const response = await fetchWithTimeout(`${base}/api/health`);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.ok && data.service === 'style-sniffer') return base;
    } catch (_) {
      // Try the next local port.
    }
  }
  return null;
}

(async function initUrlTab() {
  if (!isStaticMode) {
    setUrlNoticeVisible(false);
    setUrlControlsEnabled(true);
    return;
  }

  setUrlNoticeVisible(true);
  setUrlControlsEnabled(false);
  activateTab('image');

  const detectedBackend = await detectUrlBackend();
  hasUrlBackend = Boolean(detectedBackend);
  backendBase = detectedBackend || '';
  setUrlNoticeVisible(!hasUrlBackend);
  setUrlControlsEnabled(hasUrlBackend);
})();

// ===== URL Sniff =====
document.getElementById('sniffBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();
  const btn = document.getElementById('sniffBtn');
  if (!url) return showToast('请输入一个 URL');
  if (btn.disabled) return;

  btn.disabled = true;
  btn.textContent = '嗅探中…';
  showLoading(true);
  hideResult();

  try {
    const reqBody = JSON.stringify({
      url: url.startsWith('http') ? url : 'https://' + url,
      darkMode: document.getElementById('optDarkMode').checked,
      mobile: document.getElementById('optMobile').checked
    });

    // 自动重试（最多 2 次）
    let response, lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (!hasUrlBackend) throw new Error('URL_BACKEND_UNAVAILABLE');
        response = await fetch(`${backendBase}/api/sniff`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: reqBody });
        if (response.ok) break;
        lastError = new Error('服务端返回 ' + response.status);
      } catch (fetchErr) {
        lastError = fetchErr;
        if (attempt < 2) {
          btn.textContent = '重试中（' + (attempt + 2) + '/3）…';
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    if (!response || !response.ok) throw lastError || new Error('提取失败');
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    displayResult(result);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.message === 'URL_BACKEND_UNAVAILABLE') {
      showToast('⚠️ 在线版只能直接分析图片。网页 URL 嗅探请在本地运行 npm run web');
    } else {
      showToast('错误：' + error.message);
    }
  } finally {
    showLoading(false);
    btn.disabled = false;
    btn.textContent = '开始嗅探 🐕‍🦺';
  }
});

// ===== Drop Zone =====
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', (e) => {
  // 如果点击的是删除按钮，不触发文件选择
  if (e.target.closest('#imageRemoveBtn')) return;
  fileInput.click();
});
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
  const dropZoneInner = document.getElementById('dropZoneInner');
  const imageSniffBtn = document.getElementById('imageSniffBtn');
  const reader = new FileReader();
  reader.onload = (e) => {
    // 保留删除按钮，追加图片
    const removeBtn = preview.querySelector('#imageRemoveBtn');
    preview.innerHTML = '';
    if (removeBtn) preview.appendChild(removeBtn);
    else {
      const btn = document.createElement('button');
      btn.className = 'image-remove-btn';
      btn.id = 'imageRemoveBtn';
      btn.title = '移除图片';
      btn.textContent = '✕';
      preview.appendChild(btn);
    }
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = '预览';
    preview.appendChild(img);
    preview.hidden = false;
    dropZoneInner.hidden = true;
    dropZone.classList.add('has-image');
    imageSniffBtn.hidden = false;
    showToast('图片已加载，点击「开始嗅探」进行分析');
  };
  reader.readAsDataURL(file);
}

// ===== 图片删除按钮 =====
document.getElementById('imagePreview').addEventListener('click', (e) => {
  if (!e.target.closest('#imageRemoveBtn')) return;
  e.stopPropagation();
  clearImageUpload();
});

function clearImageUpload() {
  const preview = document.getElementById('imagePreview');
  const dropZoneInner = document.getElementById('dropZoneInner');
  const imageSniffBtn = document.getElementById('imageSniffBtn');
  // 清空预览，保留删除按钮结构
  const imgs = preview.querySelectorAll('img');
  imgs.forEach(img => img.remove());
  preview.hidden = true;
  dropZoneInner.hidden = false;
  dropZone.classList.remove('has-image');
  imageSniffBtn.hidden = true;
  fileInput.value = '';
}

// ===== 图片嗅探按钮 =====
document.getElementById('imageSniffBtn').addEventListener('click', () => {
  const img = document.querySelector('#imagePreview img');
  if (!img) return showToast('请先上传一张图片');
  const btn = document.getElementById('imageSniffBtn');
  btn.disabled = true;
  btn.textContent = '分析中…';

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
      btn.disabled = false;
      btn.textContent = '开始嗅探 🐕‍🦺';
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

  // ===== 图片分区域溯源证据 =====
  const evidence = generateImageEvidence(img, topColors);

  // ===== 基于像素数据推断设计属性 =====
  const bgBri = hexBrightness(bgColor?.hex);
  const fgBri = hexBrightness(fgColor?.hex);
  const contrastDelta = Math.abs(bgBri - fgBri);
  const isDark = bgBri < 100;
  const isHighContrast = contrastDelta > 150;
  const colorCount = topColors.length;
  const vibe = inferVibeFromColors(topColors);
  const genre = inferGenreFromColors(topColors);
  const primaryHex = midColors[0]?.hex || '#3b82f6';
  const secondaryHex = midColors[1]?.hex || '#10b981';
  const accentHex = midColors[2]?.hex || '#f59e0b';

  // 从像素推断视觉风格特征
  const edgeCanvas = document.createElement('canvas');
  const edgeScale = Math.min(150 / img.naturalWidth, 150 / img.naturalHeight, 1);
  edgeCanvas.width = Math.floor(img.naturalWidth * edgeScale);
  edgeCanvas.height = Math.floor(img.naturalHeight * edgeScale);
  const edgeCtx = edgeCanvas.getContext('2d');
  edgeCtx.drawImage(img, 0, 0, edgeCanvas.width, edgeCanvas.height);
  const edgeData = edgeCtx.getImageData(0, 0, edgeCanvas.width, edgeCanvas.height);
  const inferredTraits = inferDesignTraits(edgeData, topColors, bgBri);

  return {
    meta: {
      name: '图片风格分析',
      description: '从上传图片中提取的设计画像',
      source_references: ['uploaded-image'],
      created_at: new Date().toISOString()
    },
    design_philosophy: {
      core_essence: '从图片像素中提取的视觉设计身份',
      vibe,
      visual_dna: inferredTraits.visualDna,
      fundamental_principles: inferredTraits.principles
    },
    design_tokens: {
      colors: {
        palette_type: 'custom',
        background: bgColor?.hex || '#ffffff',
        foreground: fgColor?.hex || '#000000',
        primary: { hex: primaryHex, role: '主色（面积最大的非背景/前景色）' },
        secondary: { hex: secondaryHex, role: '次色' },
        accent: { hex: accentHex, role: '强调色' },
        muted: midColors[3]?.hex || '#f3f4f6',
        border: midColors[4]?.hex || '#e5e7eb',
        semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' },
        contrast_strategy: isHighContrast ? '高对比' : '柔和层次',
        all_extracted: topColors
      },
      typography: inferredTraits.typography,
      spacing: { base_unit: '4px', content_density: inferredTraits.contentDensity, section_rhythm: inferredTraits.sectionRhythm },
      radius: inferredTraits.radius,
      shadows: inferredTraits.shadows,
      borders: inferredTraits.borders,
      motion: { easing: 'ease-out', duration_scale: { micro: '100ms', normal: '250ms', macro: '500ms' }, philosophy: '流畅自然的过渡，不抢占用户注意力' }
    },
    design_style: {
      aesthetic: { mood: vibe, genre, personality_traits: inferredTraits.personalityTraits, adjectives: inferredTraits.adjectives },
      visual_language: {
        complexity: colorCount > 6 ? 'rich' : colorCount > 3 ? 'moderate' : 'minimal',
        ornamentation: inferredTraits.ornamentation,
        whitespace_usage: inferredTraits.whitespaceUsage,
        contrast_level: isHighContrast ? 'high' : 'medium',
        texture_usage: inferredTraits.textureUsage,
        focal_strategy: inferredTraits.focalStrategy
      },
      composition: inferredTraits.composition,
      imagery: inferredTraits.imagery,
      interaction_feel: { hover_behavior: inferredTraits.hoverBehavior, transition_personality: 'smooth-glide', microinteraction_density: inferredTraits.microinteractionDensity }
    },
    visual_effects: { overview: { effect_intensity: inferredTraits.effectIntensity, performance_tier: 'lightweight', primary_technology: 'CSS' }, composite_notes: inferredTraits.effectNotes },
    component_styles: inferredTraits.componentStyles,
    usage_guide: { do: inferredTraits.doList, dont: inferredTraits.dontList, signature_traits: inferredTraits.signatureTraits },
    evidence
  };
}

// ===== 基于像素数据推断完整设计特征 =====
function inferDesignTraits(imageData, topColors, bgBrightness) {
  const pixels = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const totalPixels = width * height;
  const isDark = bgBrightness < 100;
  const colorCount = topColors.length;

  // 边缘密度分析
  let edgeCount = 0, totalSampled = 0, highFreqCount = 0;
  const step = Math.max(2, Math.floor(Math.min(width, height) / 60));
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const idxR = (y * width + (x + 1)) * 4;
      const idxD = ((y + 1) * width + x) * 4;
      const gx = Math.abs((pixels[idxR] + pixels[idxR + 1] + pixels[idxR + 2]) - (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]));
      const gy = Math.abs((pixels[idxD] + pixels[idxD + 1] + pixels[idxD + 2]) - (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]));
      if (Math.sqrt(gx * gx + gy * gy) > 80) edgeCount++;
      if (gx > 15 && gx < 80 && gy > 15 && gy < 80) highFreqCount++;
      totalSampled++;
    }
  }
  const edgeRatio = edgeCount / totalSampled;
  const textureRatio = highFreqCount / totalSampled;
  const isComplex = edgeRatio > 0.25;
  const isSimple = edgeRatio < 0.1;
  const hasTexture = textureRatio > 0.25;

  // 饱和度分析
  let totalSat = 0;
  for (let i = 0; i < pixels.length; i += 16) {
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    totalSat += max === 0 ? 0 : (max - min) / max;
  }
  const avgSat = totalSat / (pixels.length / 16);
  const isVibrant = avgSat > 0.4;
  const isMuted = avgSat < 0.15;

  // 推断颜色角色
  const bgHex = topColors[0]?.hex || '#ffffff';
  const primaryHex = topColors.length > 2 ? topColors[2]?.hex : '#6366f1';

  // 推断圆角
  const radiusPhilosophy = isComplex ? '小圆角，信息密集场景下保持紧凑' : isSimple ? '大圆角或全圆，营造柔和友好的视觉感' : '中等圆角，兼顾现代感和实用性';
  const radiusValues = isComplex
    ? { small: '4px', medium: '6px', large: '8px', pill: '9999px', philosophy: radiusPhilosophy }
    : isSimple
      ? { small: '8px', medium: '16px', large: '24px', pill: '9999px', philosophy: radiusPhilosophy }
      : { small: '6px', medium: '12px', large: '16px', pill: '9999px', philosophy: radiusPhilosophy };

  // 推断阴影
  const shadowStyle = isDark ? '内发光 / 微妙高光边缘' : (isComplex ? '轻投影，层次分明' : '柔和扩散阴影，材质感');
  const shadowLevels = isDark
    ? { low: 'inset 0 1px 0 rgba(255,255,255,0.05)', medium: '0 0 15px rgba(0,0,0,0.3)', high: '0 0 30px rgba(0,0,0,0.5)' }
    : { low: '0 1px 3px rgba(0,0,0,0.06)', medium: '0 4px 12px rgba(0,0,0,0.08)', high: '0 8px 30px rgba(0,0,0,0.12)' };

  // 推断边框
  const borderUsage = isDark ? '微妙的亮色边框用于分隔，rgba(255,255,255,0.08~0.15)' : (isComplex ? '1px solid 分隔线，用于划分区块' : '极少边框，靠间距和色差分隔');

  // 推断字体
  const fontStyle = isVibrant ? '粗壮的无衬线体（如 Montserrat / Poppins / Noto Sans SC）' : isMuted ? '优雅衬线体或细体无衬线（如 Playfair / Inter Light）' : '标准无衬线体（如 Inter / SF Pro / PingFang SC）';
  const headingWeight = isVibrant ? '700-900（粗体/黑体）' : '500-600（中等）';
  const bodySize = isComplex ? '13-14px（信息密集）' : '15-16px（舒适阅读）';

  // 推断组件样式
  const btnPrimaryStyle = 'background: ' + primaryHex + '; color: #fff; border-radius: ' + radiusValues.medium + '; padding: 10px 24px; font-weight: 600; border: none';
  const btnSecondaryStyle = isDark
    ? 'background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: ' + radiusValues.medium
    : 'background: transparent; color: ' + primaryHex + '; border: 1px solid ' + primaryHex + '; border-radius: ' + radiusValues.medium;
  const btnOutlineStyle = 'background: transparent; border: 1px solid ' + (isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db') + '; border-radius: ' + radiusValues.medium;

  const cardStyle = isDark
    ? 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: ' + radiusValues.large + '; box-shadow: ' + shadowLevels.medium
    : 'background: #fff; border-radius: ' + radiusValues.large + '; box-shadow: ' + shadowLevels.medium;

  const inputStyle = isDark
    ? 'background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: ' + radiusValues.small + '; color: #fff'
    : 'background: #fff; border: 1px solid #d1d5db; border-radius: ' + radiusValues.small + '; padding: 8px 12px';

  const navStyle = isDark
    ? '深色背景导航，可能使用毛玻璃效果 backdrop-filter: blur(12px)，链接色: rgba(255,255,255,0.7) → hover: #fff'
    : '浅色/白色导航栏，文字色: #374151，hover 使用主色 ' + primaryHex;

  return {
    visualDna: [
      isDark ? 'dark-mode' : 'light-mode',
      isVibrant ? 'vibrant-palette' : isMuted ? 'muted-tones' : 'balanced-palette',
      isComplex ? 'information-dense' : isSimple ? 'minimal-clean' : 'structured-layout'
    ],
    principles: [
      isHighContrast(topColors) ? '高对比度优先，确保可读性' : '柔和层次过渡，舒适阅读',
      isComplex ? '信息密度优先，充分利用空间' : '留白呼吸，突出重点内容',
      isVibrant ? '鲜明色彩驱动视觉引导' : '克制配色，内容为王'
    ],
    typography: {
      heading_font: fontStyle,
      body_font: fontStyle.includes('衬线') ? '无衬线体作为正文对比' : '与标题同族，调低字重',
      scale: { h1: '36-48px', h2: '24-30px', h3: '18-22px', body: bodySize, small: '12-13px' },
      style_notes: '标题字重 ' + headingWeight + '，正文 400 常规，行高 1.5-1.7'
    },
    contentDensity: isComplex ? 'dense' : isSimple ? 'spacious' : 'comfortable',
    sectionRhythm: isComplex ? '紧凑节奏，模块间距 16-24px' : '宽松节奏，模块间距 48-80px',
    radius: radiusValues,
    shadows: { style: shadowStyle, levels: shadowLevels },
    borders: {
      usage: borderUsage,
      style: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
      divider_style: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f3f4f6'
    },
    ornamentation: isVibrant ? 'bold-accents' : isMuted ? 'minimal' : 'subtle-accents',
    whitespaceUsage: isComplex ? 'compact' : isSimple ? 'generous' : 'balanced',
    textureUsage: hasTexture ? '存在表面纹理（grain/噪点/图案），可用 CSS noise overlay 模拟' : '无纹理，纯色平面为主',
    focalStrategy: isComplex ? '多焦点并列（网格/列表排布，无单一 Hero）' : '单一焦点（大 Hero 区域或中心式构图）',
    composition: {
      hierarchy_method: isComplex ? '通过卡片网格 + 色彩标签建立信息层级' : '通过字号对比 + 留白建立视觉层级',
      balance_type: isComplex ? 'modular-grid' : 'centered-asymmetric',
      flow_direction: 'top-to-bottom',
      negative_space_role: isComplex ? '最小化留白，最大化信息呈现' : '留白作为设计元素，引导视线聚焦'
    },
    imagery: {
      photo_treatment: isVibrant ? '高饱和度全彩图片，可能带有色彩滤镜' : isDark ? '暗调处理，压低亮部' : '自然色调，保持真实感',
      illustration_style: isVibrant ? '扁平矢量插画 / 3D 渲染元素' : '线条图标 / 简约几何图形',
      graphic_elements: isComplex ? '角标、徽章、进度条、标签等功能性图形元素' : '装饰性几何图形 / 抽象形状',
      pattern_usage: hasTexture ? '存在背景纹理或重复图案' : '无重复图案，纯色背景'
    },
    hoverBehavior: isDark ? 'brightness(1.15) 提亮 + 微妙边框高亮' : 'translateY(-2px) 上浮 + 阴影加深',
    microinteractionDensity: isComplex ? 'high' : 'moderate',
    effectIntensity: isVibrant ? 'moderate' : 'subtle',
    effectNotes: isDark ? '可能使用 glassmorphism 毛玻璃、光晕效果' : '以 CSS transition 为主的轻量动效',
    componentStyles: {
      buttons: { primary: btnPrimaryStyle, secondary: btnSecondaryStyle, outline: btnOutlineStyle },
      cards: { style: cardStyle, appearance: '圆角 + ' + (isDark ? '半透明背景' : '微阴影'), interaction: '悬停缩放 scale(1.02)' },
      inputs: { normal: inputStyle, focus: '边框高亮为主色 ' + primaryHex + '，box-shadow: 0 0 0 3px ' + primaryHex + '33' },
      navigation: navStyle,
      sections: { divider: isDark ? '无分割线，靠背景色差分区' : '1px 极淡分割线或纯间距分隔' }
    },
    personalityTraits: inferPersonality(isDark, isVibrant, isMuted, isComplex),
    adjectives: inferAdjectives(isDark, isVibrant, isMuted, isComplex),
    doList: inferDoList(isDark, isVibrant, isComplex, radiusValues),
    dontList: inferDontList(isDark, isVibrant, isComplex),
    signatureTraits: inferSignatureTraits(isDark, isVibrant, isComplex, topColors)
  };
}

function isHighContrast(topColors) {
  if (topColors.length < 2) return false;
  return Math.abs(hexBrightness(topColors[0].hex) - hexBrightness(topColors[topColors.length - 1].hex)) > 150;
}

function inferPersonality(isDark, isVibrant, isMuted, isComplex) {
  const traits = [];
  if (isDark) traits.push('科技感', '沉浸式');
  if (isVibrant) traits.push('活力', '年轻化');
  if (isMuted) traits.push('优雅', '克制');
  if (isComplex) traits.push('功能导向', '专业');
  if (!isComplex) traits.push('简约', '聚焦');
  return traits;
}

function inferAdjectives(isDark, isVibrant, isMuted, isComplex) {
  const adj = [];
  if (isDark) adj.push('dark', 'immersive', 'tech-forward');
  else adj.push('clean', 'airy', 'approachable');
  if (isVibrant) adj.push('vibrant', 'energetic', 'bold');
  if (isMuted) adj.push('elegant', 'restrained', 'sophisticated');
  if (isComplex) adj.push('dense', 'feature-rich', 'utilitarian');
  else adj.push('minimal', 'focused', 'breathing');
  return adj;
}

function inferDoList(isDark, isVibrant, isComplex, radius) {
  const doItems = [];
  doItems.push('使用提取的色板中的颜色，保持视觉一致性');
  doItems.push('圆角统一使用 ' + radius.medium + '，保持设计语言连贯');
  if (isDark) {
    doItems.push('在深色背景上使用半透明白色（rgba）制造层次感');
    doItems.push('按钮和可交互元素使用亮色突出');
  } else {
    doItems.push('保持大量留白，让内容呼吸');
    doItems.push('使用柔和阴影制造层次而非硬边框');
  }
  if (isVibrant) doItems.push('大胆使用主色作为 CTA 按钮和焦点引导色');
  if (isComplex) doItems.push('使用网格系统组织密集信息，保持对齐');
  return doItems;
}

function inferDontList(isDark, isVibrant, isComplex) {
  const dontItems = [];
  if (isDark) {
    dontItems.push('不要使用纯白色 #ffffff 作为大面积文字，改用 rgba(255,255,255,0.87)');
    dontItems.push('不要使用纯黑色阴影，改用带色彩倾向的暗色');
  } else {
    dontItems.push('不要使用过深的纯黑文字 #000，改用 #1f2937 等深灰');
    dontItems.push('不要过度使用边框分隔，优先用间距和色差');
  }
  if (isVibrant) dontItems.push('不要将多个高饱和色彩并置，造成视觉冲突');
  if (!isComplex) dontItems.push('不要堆砌过多信息在一屏内，保持留白节奏');
  dontItems.push('不要混用多种圆角值，破坏设计系统的一致性');
  return dontItems;
}

function inferSignatureTraits(isDark, isVibrant, isComplex, topColors) {
  const traits = [];
  if (isDark) traits.push('深色沉浸式界面 + 高光强调色');
  if (isVibrant) traits.push('高饱和主色驱动视觉焦点');
  if (isComplex) traits.push('高密度信息网格布局');
  if (!isComplex && !isDark) traits.push('大面积留白 + 柔和阴影卡片');
  if (topColors.length > 5) traits.push('丰富的多层色阶系统');
  else traits.push('极简的受限色板');
  return traits;
}

// ===== 图片分区域溯源证据生成 =====
function generateImageEvidence(img, topColors) {
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  // 按图片高度分区，每区约等于一屏视口（取图片宽度作为参考高度）
  const sectionHeight = Math.max(naturalW, Math.floor(naturalH / 4));
  const sectionCount = Math.min(Math.ceil(naturalH / sectionHeight), 6);
  const sections = [];

  for (let i = 0; i < sectionCount; i++) {
    const startY = i * sectionHeight;
    const clipH = Math.min(sectionHeight, naturalH - startY);
    if (clipH <= 0) break;

    // 用 Canvas 截取该区域
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = naturalW;
    sliceCanvas.height = clipH;
    const sliceCtx = sliceCanvas.getContext('2d');
    sliceCtx.drawImage(img, 0, startY, naturalW, clipH, 0, 0, naturalW, clipH);

    // 分析该区域的视觉设计属性
    const regionDescriptions = analyzeRegionVisuals(sliceCanvas, i, sectionCount);

    // 生成 base64 截图（缩小到合理尺寸以节省内存）
    const thumbCanvas = document.createElement('canvas');
    const thumbScale = Math.min(600 / naturalW, 1);
    thumbCanvas.width = Math.floor(naturalW * thumbScale);
    thumbCanvas.height = Math.floor(clipH * thumbScale);
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(sliceCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

    sections.push({
      label: '区域 ' + (i + 1) + '/' + sectionCount + ' — ' + describeRegionPosition(i, sectionCount),
      path: dataUrl,
      descriptions: regionDescriptions
    });
  }

  return { sections, timestamp: Date.now() };
}

function describeRegionPosition(index, total) {
  if (total <= 1) return '完整画面';
  if (index === 0) return '顶部区域（Header / Hero）';
  if (index === total - 1) return '底部区域（Footer）';
  const positionNames = ['中上部区域', '中部区域', '中下部区域', '下部区域'];
  return positionNames[Math.min(index - 1, positionNames.length - 1)];
}

function analyzeRegionVisuals(sliceCanvas, regionIndex, totalRegions) {
  const width = sliceCanvas.width;
  const height = sliceCanvas.height;
  const ctx = sliceCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const totalPixels = width * height;
  const descriptions = [];

  // ===== 1. 色彩体系提取 =====
  const colorBuckets = new Map();
  const hueHistogram = new Array(12).fill(0); // 12个色相区间（每30°）
  let totalBrightness = 0, totalSaturation = 0;
  let warmCount = 0, coolCount = 0, neutralCount = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    colorBuckets.set(qr + ',' + qg + ',' + qb, (colorBuckets.get(qr + ',' + qg + ',' + qb) || 0) + 1);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    totalBrightness += brightness;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    totalSaturation += sat;
    if (sat > 0.15) {
      const hue = rgbToHue(r, g, b);
      hueHistogram[Math.floor(hue / 30) % 12]++;
      if (hue < 60 || hue > 300) warmCount++;
      else if (hue >= 120 && hue <= 270) coolCount++;
      else neutralCount++;
    } else {
      neutralCount++;
    }
  }

  const avgBri = totalBrightness / totalPixels;
  const avgSat = totalSaturation / totalPixels;

  // 提取 Top 色板
  const sortedColors = Array.from(colorBuckets.entries()).sort((a, b) => b[1] - a[1]);
  const paletteColors = [];
  sortedColors.forEach(([key, count]) => {
    const [r, g, b] = key.split(',').map(Number);
    const hex = '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
    const tooClose = paletteColors.some(p => colorDistance(p.r, p.g, p.b, r, g, b) < 50);
    if (!tooClose && paletteColors.length < 8) paletteColors.push({ r, g, b, hex, count });
  });

  const colorSwatches = paletteColors.slice(0, 6).map(c => '`' + c.hex + '` (' + ((c.count / totalPixels) * 100).toFixed(1) + '%)').join(' · ');
  descriptions.push('**🎨 色板**: ' + colorSwatches);

  const toneLabel = warmCount > coolCount * 1.5 ? '暖色调为主（橙/红/黄）' : coolCount > warmCount * 1.5 ? '冷色调为主（蓝/青/紫）' : '冷暖均衡 / 中性色调';
  descriptions.push('**🌡️ 色温**: ' + toneLabel);

  const bgHex = paletteColors[0]?.hex || '#ffffff';
  const bgBri = hexBrightness(bgHex);
  descriptions.push('**🖼️ 底色**: `' + bgHex + '`（' + (bgBri > 200 ? '浅色底' : bgBri > 100 ? '中间调底' : '深色底') + '），整体明度 ' + avgBri.toFixed(0) + '/255');

  // ===== 2. 渐变检测 =====
  const gradientInfo = detectGradient(pixels, width, height);
  if (gradientInfo.hasGradient) {
    descriptions.push('**🌈 渐变**: 检测到 **' + gradientInfo.direction + '渐变**，从 `' + gradientInfo.startColor + '` → `' + gradientInfo.endColor + '`' + (gradientInfo.type ? '，类型: ' + gradientInfo.type : ''));
  } else {
    descriptions.push('**🌈 渐变**: 未检测到明显渐变，以 **纯色/平铺** 为主');
  }

  // ===== 3. 边缘与圆角检测 =====
  const edgeInfo = detectEdgesAndCorners(pixels, width, height);
  descriptions.push('**📐 边缘**: 边缘密度 **' + edgeInfo.density + '**（' + edgeInfo.densityLabel + '），' + (edgeInfo.hasStraightLines ? '存在**直线边缘**（矩形/卡片/分割线）' : '以**柔和曲线**为主'));
  descriptions.push('**🔲 圆角推断**: ' + edgeInfo.cornerDescription);

  // ===== 4. 投影与阴影检测 =====
  const shadowInfo = detectShadows(pixels, width, height, avgBri);
  descriptions.push('**🌑 投影/阴影**: ' + shadowInfo.description);

  // ===== 5. 纹理与肌理检测 =====
  const textureInfo = detectTexture(pixels, width, height);
  descriptions.push('**🧱 肌理/纹理**: ' + textureInfo.description);

  // ===== 6. 文字区域检测 =====
  const textInfo = detectTextRegions(pixels, width, height, avgBri);
  descriptions.push('**🔤 文字特征**: ' + textInfo.description);

  // ===== 7. 边框检测 =====
  const borderInfo = detectBorders(pixels, width, height);
  descriptions.push('**🔳 边框**: ' + borderInfo.description);

  // ===== 8. 色彩丰富度与风格推断 =====
  const activeHues = hueHistogram.filter(h => h > totalPixels * 0.01).length;
  const paletteStyle = activeHues <= 2 ? '**单色/双色系**（极简/克制）' : activeHues <= 4 ? '**有限色板**（' + activeHues + ' 色相，设计感强）' : '**多彩色板**（' + activeHues + ' 色相，丰富活泼）';
  descriptions.push('**🎭 色彩风格**: ' + paletteStyle + '，饱和度均值 ' + (avgSat * 100).toFixed(0) + '%' + (avgSat > 0.4 ? '（鲜艳）' : avgSat > 0.2 ? '（适中）' : '（低调/灰调）'));

  return descriptions;
}

// ===== 辅助函数：RGB 转 Hue =====
function rgbToHue(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  let hue;
  if (max === r) hue = 60 * ((g - b) / (max - min));
  else if (max === g) hue = 60 * (2 + (b - r) / (max - min));
  else hue = 60 * (4 + (r - g) / (max - min));
  return hue < 0 ? hue + 360 : hue;
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ===== 渐变检测 =====
function detectGradient(pixels, width, height) {
  // 采样顶部、中部、底部横条的平均颜色
  const sampleRow = (y) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let x = 0; x < width; x += 3) {
      const idx = (y * width + x) * 4;
      rSum += pixels[idx]; gSum += pixels[idx + 1]; bSum += pixels[idx + 2]; count++;
    }
    return { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };
  };
  const sampleCol = (x) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let y = 0; y < height; y += 3) {
      const idx = (y * width + x) * 4;
      rSum += pixels[idx]; gSum += pixels[idx + 1]; bSum += pixels[idx + 2]; count++;
    }
    return { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };
  };

  const topRow = sampleRow(Math.floor(height * 0.1));
  const midRow = sampleRow(Math.floor(height * 0.5));
  const botRow = sampleRow(Math.floor(height * 0.9));
  const leftCol = sampleCol(Math.floor(width * 0.1));
  const rightCol = sampleCol(Math.floor(width * 0.9));

  const vertDist = colorDistance(topRow.r, topRow.g, topRow.b, botRow.r, botRow.g, botRow.b);
  const horizDist = colorDistance(leftCol.r, leftCol.g, leftCol.b, rightCol.r, rightCol.g, rightCol.b);

  const toHex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');

  if (vertDist > 60) {
    return { hasGradient: true, direction: '垂直', startColor: toHex(topRow), endColor: toHex(botRow), type: vertDist > 120 ? '强渐变' : '柔和渐变' };
  }
  if (horizDist > 60) {
    return { hasGradient: true, direction: '水平', startColor: toHex(leftCol), endColor: toHex(rightCol), type: horizDist > 120 ? '强渐变' : '柔和渐变' };
  }
  return { hasGradient: false };
}

// ===== 边缘与圆角检测 =====
function detectEdgesAndCorners(pixels, width, height) {
  // Sobel 边缘检测（采样）
  let edgeCount = 0, totalSampled = 0;
  let horizontalEdges = 0, verticalEdges = 0;
  const step = Math.max(2, Math.floor(Math.min(width, height) / 80));

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const idxL = (y * width + (x - 1)) * 4;
      const idxR = (y * width + (x + 1)) * 4;
      const idxU = ((y - 1) * width + x) * 4;
      const idxD = ((y + 1) * width + x) * 4;
      const gx = Math.abs((pixels[idxR] + pixels[idxR + 1] + pixels[idxR + 2]) - (pixels[idxL] + pixels[idxL + 1] + pixels[idxL + 2]));
      const gy = Math.abs((pixels[idxD] + pixels[idxD + 1] + pixels[idxD + 2]) - (pixels[idxU] + pixels[idxU + 1] + pixels[idxU + 2]));
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > 80) {
        edgeCount++;
        if (gx > gy * 1.5) verticalEdges++;
        else if (gy > gx * 1.5) horizontalEdges++;
      }
      totalSampled++;
    }
  }

  const edgeRatio = edgeCount / totalSampled;
  const density = edgeRatio > 0.25 ? 'high' : edgeRatio > 0.1 ? 'medium' : 'low';
  const densityLabel = density === 'high' ? '复杂界面，元素密集' : density === 'medium' ? '适中，有清晰的区块划分' : '简洁，大面积留白或纯色';
  const hasStraightLines = (horizontalEdges + verticalEdges) > edgeCount * 0.4;

  // 圆角推断：检测角落区域的边缘分布
  const cornerSize = Math.floor(Math.min(width, height) * 0.08);
  let cornerSoftness = 0;
  const checkCorner = (cx, cy) => {
    let soft = 0, total = 0;
    for (let dy = -cornerSize; dy <= cornerSize; dy += step) {
      for (let dx = -cornerSize; dx <= cornerSize; dx += step) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cornerSize * 0.3 || dist > cornerSize) continue;
        const idx = (ny * width + nx) * 4;
        const bri = (pixels[idx] * 299 + pixels[idx + 1] * 587 + pixels[idx + 2] * 114) / 1000;
        if (Math.abs(bri - 255) < 30 || Math.abs(bri) < 30) soft++;
        total++;
      }
    }
    return total > 0 ? soft / total : 0;
  };

  // 检测图中央区域是否有圆角矩形特征
  const roundedFeatures = hasStraightLines && edgeRatio > 0.08;
  let cornerDescription;
  if (density === 'low') {
    cornerDescription = '元素较少，圆角不明显。画面以 **大面积色块/图片** 为主';
  } else if (roundedFeatures) {
    cornerDescription = '检测到**矩形元素**。结合边缘柔和度推断圆角约 **8-16px**（中等圆角，现代 UI 风格）';
  } else {
    cornerDescription = '边缘以**曲线/不规则形状**为主，可能使用 **大圆角（16px+）或椭圆/圆形** 元素';
  }

  return { density, densityLabel, hasStraightLines, cornerDescription };
}

// ===== 投影/阴影检测 =====
function detectShadows(pixels, width, height, avgBrightness) {
  // 检测亮度渐变区域（阴影特征：从深到浅的柔和过渡）
  let shadowTransitions = 0;
  const step = Math.max(2, Math.floor(width / 60));

  for (let y = 2; y < height - 2; y += step * 3) {
    for (let x = 2; x < width - 2; x += step) {
      const idx = (y * width + x) * 4;
      const idxNext = (y * width + (x + step)) * 4;
      const idxBelow = ((y + step) * width + x) * 4;
      if (idxNext >= pixels.length || idxBelow >= pixels.length) continue;
      const bri1 = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const bri2 = (pixels[idxNext] + pixels[idxNext + 1] + pixels[idxNext + 2]) / 3;
      const bri3 = (pixels[idxBelow] + pixels[idxBelow + 1] + pixels[idxBelow + 2]) / 3;
      // 阴影特征：小幅度亮度渐变（5-30的差异，不是硬边缘）
      const hDiff = Math.abs(bri1 - bri2);
      const vDiff = Math.abs(bri1 - bri3);
      if ((hDiff > 5 && hDiff < 30) || (vDiff > 5 && vDiff < 30)) shadowTransitions++;
    }
  }

  const shadowRatio = shadowTransitions / (width * height / (step * step * 3));
  if (shadowRatio > 0.4) {
    return { description: '大量**柔和阴影/投影**，推断 CSS: `box-shadow: 0 4px 20px rgba(0,0,0,0.08~0.15)`，**Material/Neumorphism** 风格' };
  } else if (shadowRatio > 0.15) {
    return { description: '存在**适量投影**，推断 CSS: `box-shadow: 0 2px 8px rgba(0,0,0,0.06~0.12)`，现代卡片式设计' };
  } else {
    return { description: '投影极少或无，**扁平化设计**风格，元素分隔靠 **颜色/间距/边框** 而非阴影' };
  }
}

// ===== 纹理/肌理检测 =====
function detectTexture(pixels, width, height) {
  // 高频噪点检测：相邻像素的变化频率
  let highFreqCount = 0;
  let totalChecked = 0;
  const step = Math.max(2, Math.floor(width / 80));

  for (let y = 0; y < height - 1; y += step) {
    for (let x = 0; x < width - 1; x += step) {
      const idx1 = (y * width + x) * 4;
      const idx2 = (y * width + x + 1) * 4;
      const idx3 = ((y + 1) * width + x) * 4;
      const diff1 = Math.abs(pixels[idx1] - pixels[idx2]) + Math.abs(pixels[idx1 + 1] - pixels[idx2 + 1]) + Math.abs(pixels[idx1 + 2] - pixels[idx2 + 2]);
      const diff2 = Math.abs(pixels[idx1] - pixels[idx3]) + Math.abs(pixels[idx1 + 1] - pixels[idx3 + 1]) + Math.abs(pixels[idx1 + 2] - pixels[idx3 + 2]);
      if (diff1 > 15 && diff1 < 80 && diff2 > 15 && diff2 < 80) highFreqCount++;
      totalChecked++;
    }
  }

  const textureRatio = highFreqCount / totalChecked;
  if (textureRatio > 0.5) {
    return { description: '强烈的**表面肌理/纹理**（磨砂、纸张、噪点、grain），适合 CSS: `background-image: url(noise.svg)` 或 `filter: contrast(1.1) grayscale(0.1)`' };
  } else if (textureRatio > 0.25) {
    return { description: '存在**轻微纹理**（可能是图片/插画/微妙 grain），适合 `background-blend-mode` 或轻噪点叠加' };
  } else {
    return { description: '**光滑/无纹理**，纯色填充为主，适合 CSS: 纯 `background-color` 或 `linear-gradient`' };
  }
}

// ===== 文字区域检测 =====
function detectTextRegions(pixels, width, height, avgBri) {
  // 检测高对比度细线条区域（文字特征）
  let textLikePixels = 0;
  let totalChecked = 0;
  let darkTextOnLight = 0, lightTextOnDark = 0;
  const step = Math.max(2, Math.floor(width / 80));

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const bri = (pixels[idx] * 299 + pixels[idx + 1] * 587 + pixels[idx + 2] * 114) / 1000;
      // 检查与周围像素的对比
      const neighbors = [
        ((y - 1) * width + x) * 4, ((y + 1) * width + x) * 4,
        (y * width + x - 1) * 4, (y * width + x + 1) * 4
      ];
      let highContrastNeighbors = 0;
      neighbors.forEach(ni => {
        if (ni >= 0 && ni < pixels.length) {
          const nBri = (pixels[ni] * 299 + pixels[ni + 1] * 587 + pixels[ni + 2] * 114) / 1000;
          if (Math.abs(bri - nBri) > 60) highContrastNeighbors++;
        }
      });
      if (highContrastNeighbors >= 2) {
        textLikePixels++;
        if (bri < 100) darkTextOnLight++;
        else lightTextOnDark++;
      }
      totalChecked++;
    }
  }

  const textDensity = textLikePixels / totalChecked;
  const textStyle = darkTextOnLight > lightTextOnDark ? '深色文字 on 浅色底' : '浅色/白色文字 on 深色底';
  if (textDensity > 0.15) {
    return { description: '**文字密集区域**，' + textStyle + '。推断：标题粗体（700+）+ 正文常规（400），建议 `font-size` 标题 24-36px / 正文 14-16px' };
  } else if (textDensity > 0.05) {
    return { description: '**适量文字**，' + textStyle + '。推断：大标题主导设计，字号跨度大（Display 48px+ / Body 14-16px）' };
  } else {
    return { description: '**文字稀少**，以视觉图形/图片为主。推断：标题可能是**超大艺术字体**或嵌入图片中' };
  }
}

// ===== 边框检测 =====
function detectBorders(pixels, width, height) {
  // 检测沿水平/垂直方向的单像素或窄条色变
  let borderLikeSegments = 0;
  let totalChecked = 0;
  const step = Math.max(3, Math.floor(height / 40));

  for (let y = 2; y < height - 2; y += step) {
    for (let x = 5; x < width - 5; x += 4) {
      const idx = (y * width + x) * 4;
      const above = ((y - 1) * width + x) * 4;
      const below = ((y + 1) * width + x) * 4;
      const briC = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const briA = (pixels[above] + pixels[above + 1] + pixels[above + 2]) / 3;
      const briB = (pixels[below] + pixels[below + 1] + pixels[below + 2]) / 3;
      // 边框特征：当前行与上下行有明显差异，但上下行彼此接近
      if (Math.abs(briC - briA) > 40 && Math.abs(briC - briB) > 40 && Math.abs(briA - briB) < 20) {
        borderLikeSegments++;
      }
      totalChecked++;
    }
  }

  const borderRatio = borderLikeSegments / totalChecked;
  if (borderRatio > 0.08) {
    return { description: '存在**明显分割线/边框**，推断 CSS: `border: 1px solid rgba(0,0,0,0.1)` 或 `border-bottom: 1px solid #e5e7eb`，**线性分割**风格' };
  } else if (borderRatio > 0.02) {
    return { description: '**少量边框/分割线**，推断 CSS: `border: 1px solid` 用于卡片或输入框，整体偏**无边框/阴影分隔**' };
  } else {
    return { description: '**几乎无边框**，元素间以 **间距、阴影、色差** 分隔，**无边框设计 (Borderless)**' };
  }
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
  document.getElementById('promptOutputCN').textContent = generatePromptText(profile);
  document.getElementById('promptOutputEN').textContent = generatePromptTextEN(profile);

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
  const container = document.getElementById('evidenceContent');

  container.innerHTML = '';

  if (!evidence || !evidence.sections?.length) {
    card.hidden = true;
    return;
  }

  card.hidden = false;

  evidence.sections.forEach(section => {
    const item = document.createElement('div');
    item.className = 'evidence-section';
    const descHtml = section.descriptions
      .map(d => '<div class="evidence-line">' + formatDesc(d) + '</div>')
      .join('');
    item.innerHTML =
      '<div class="evidence-left">' +
        '<div class="evidence-section-label">' + section.label + '</div>' +
        '<img src="' + section.path + '" alt="' + section.label + '" loading="lazy">' +
      '</div>' +
      '<div class="evidence-right">' +
        '<div class="evidence-right-title">检测到的视觉风格及描述</div>' +
        '<div class="evidence-descriptions">' + descHtml + '</div>' +
      '</div>';
    container.appendChild(item);
  });
}

function formatDesc(text) {
  // 先转义 HTML，再恢复 markdown 标记
  let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`(.+?)`/g, '<code>$1</code>');
  return escaped;
}

// ===== Generate Prompt Text (Chinese) =====
// 值清洗：过滤掉占位符，替换为有意义的默认描述
function cleanValue(value, fallback) {
  if (!value || typeof value !== 'string') return fallback || '';
  if (/需截图|需交互|需.*分析/.test(value)) return fallback || '';
  return value;
}

function generatePromptText(profile) {
  const p = profile;
  const tokens = p.design_tokens || {};
  const colors = tokens.colors || {};
  const typo = tokens.typography || {};
  const radius = tokens.radius || {};
  const shadows = tokens.shadows || {};
  const borders = tokens.borders || {};
  const motion = tokens.motion || {};
  const style = p.design_style || {};
  const aesthetic = style.aesthetic || {};
  const visual = style.visual_language || {};
  const composition = style.composition || {};
  const imagery = style.imagery || {};
  const interaction = style.interaction_feel || {};
  const effects = p.visual_effects || {};
  const components = p.component_styles || {};
  const guide = p.usage_guide || {};
  const philosophy = p.design_philosophy || {};

  const name = p.meta?.name || '未知网站';
  const vibeList = philosophy.vibe?.length ? philosophy.vibe.join('、') : '现代、简洁';
  const dnaList = philosophy.visual_dna?.length ? philosophy.visual_dna.join('、') : '';

  let t = '';

  // ── 1. 设计哲学 ──
  t += '# 设计哲学\n\n';
  t += '> **"' + (philosophy.core_essence || '从 ' + name + ' 提取的视觉设计身份') + '"**\n\n';
  t += '该风格体系从 **' + name + '** 的完整页面中提取而来。';
  t += '整体调性为 **' + vibeList + '**，';
  t += '视觉语言的复杂度为 **' + (visual.complexity || 'moderate') + '**，';
  t += '装饰程度为 **' + (visual.ornamentation || 'subtle-accents') + '**。\n\n';

  t += '### 核心原则\n\n';
  t += '- **视觉 DNA**：' + (dnaList || '纯色块、几何构图、无多余装饰') + '\n';
  t += '- **留白策略**：' + (visual.whitespace_usage || 'balanced') + '\n';
  t += '- **对比度**：' + (visual.contrast_level || 'high') + '\n';
  t += '- **纹理使用**：' + (visual.texture_usage || 'none') + '\n';
  t += '- **焦点策略**：' + cleanValue(visual.focal_strategy, '单一焦点（大 Hero 区域或中心式构图）') + '\n';
  if (aesthetic.genre) t += '- **风格流派**：' + aesthetic.genre + '\n';
  if (aesthetic.era_influence) t += '- **时代影响**：' + aesthetic.era_influence + '\n';
  if (aesthetic.mood?.length) t += '- **情绪关键词**：' + aesthetic.mood.join('、') + '\n';
  if (aesthetic.adjectives?.length) t += '- **形容词**：' + aesthetic.adjectives.join('、') + '\n';

  // ── 2. 设计 Token 系统 ──
  t += '\n---\n\n# 设计 Token 系统\n\n';

  // 色彩
  t += '## 色彩\n\n';
  t += '| Token | 色值 | 用途 |\n|---|---|---|\n';
  t += '| **背景色** | `' + (colors.background || '#ffffff') + '` | 页面主背景 |\n';
  t += '| **前景色** | `' + (colors.foreground || '#000000') + '` | 正文文字 |\n';
  if (colors.primary?.hex) t += '| **主色** | `' + colors.primary.hex + '` | ' + (colors.primary.role || '按钮、链接、高亮') + ' |\n';
  if (colors.secondary?.hex) t += '| **次色** | `' + colors.secondary.hex + '` | ' + (colors.secondary.role || '辅助元素') + ' |\n';
  if (colors.accent?.hex) t += '| **强调色** | `' + colors.accent.hex + '` | ' + (colors.accent.role || 'CTA、徽章') + ' |\n';
  if (colors.muted) t += '| **柔和色** | `' + colors.muted + '` | 次级背景、卡片填充 |\n';
  if (colors.border) t += '| **边框色** | `' + colors.border + '` | 分隔线、输入框边框 |\n';
  const semantic = colors.semantic || {};
  if (semantic.success) t += '| **成功** | `' + semantic.success + '` | 成功状态 |\n';
  if (semantic.warning) t += '| **警告** | `' + semantic.warning + '` | 警告状态 |\n';
  if (semantic.error) t += '| **错误** | `' + semantic.error + '` | 错误状态 |\n';
  t += '\n**色彩策略**：' + (colors.contrast_strategy || '高对比') + '\n';
  t += '**色板类型**：' + (colors.palette_type || 'custom') + '\n\n';

  // 字体排版
  t += '## 字体排版\n\n';
  t += '### 字体栈\n\n';
  t += '```css\n';
  t += '/* 标题字体 */\nfont-family: \'' + cleanValue(typo.heading_font, 'system-ui, sans-serif') + '\', sans-serif;\n\n';
  t += '/* 正文字体 */\nfont-family: \'' + cleanValue(typo.body_font, 'system-ui, sans-serif') + '\', sans-serif;\n';
  if (typo.mono_font) t += '\n/* 等宽字体 */\nfont-family: \'' + typo.mono_font + '\', monospace;\n';
  t += '```\n\n';

  if (typo.scale && Object.keys(typo.scale).length) {
    t += '### 字号阶梯\n\n';
    t += '| 层级 | 字号 | 字重 | 行高 |\n|---|---|---|---|\n';
    Object.entries(typo.scale).forEach(([level, v]) => {
      if (v && typeof v === 'object') {
        t += '| **' + level + '** | `' + (v.size || '-') + '` | ' + (v.weight || '-') + ' | ' + (v.line_height || '-') + ' |\n';
      }
    });
    t += '\n';
  }
  if (typo.style_notes) t += '**排版特征**：' + typo.style_notes + '\n\n';

  // 圆角
  t += '## 圆角与形状\n\n';
  t += '| 层级 | 值 |\n|---|---|\n';
  t += '| 小 | `' + (radius.small || '4px') + '` |\n';
  t += '| 中 | `' + (radius.medium || '8px') + '` |\n';
  t += '| 大 | `' + (radius.large || '16px') + '` |\n';
  t += '| 药丸 | `' + (radius.pill || '9999px') + '` |\n';
  if (radius.philosophy) t += '\n**设计理念**：' + cleanValue(radius.philosophy, '统一圆角体系，保持视觉一致性') + '\n';
  t += '\n';

  // 阴影
  t += '## 阴影与特效\n\n';
  t += '**阴影风格**：' + cleanValue(shadows.style, '柔和扩散阴影，用于卡片和浮层的层次区分') + '\n\n';
  if (shadows.levels) {
    t += '| 层级 | 值 |\n|---|---|\n';
    t += '| 低 | `' + (shadows.levels.low || 'none') + '` |\n';
    t += '| 中 | `' + (shadows.levels.medium || 'none') + '` |\n';
    t += '| 高 | `' + (shadows.levels.high || 'none') + '` |\n\n';
  }
  if (shadows.depth_cues) t += '**深度线索**：' + cleanValue(shadows.depth_cues, '') + '\n\n';

  // 边框
  t += '## 边框\n\n';
  t += '- **使用频率**：' + cleanValue(borders.usage, '适量使用，主要用于输入框和卡片分隔') + '\n';
  t += '- **边框风格**：' + cleanValue(borders.style, '1px solid ' + (colors.border || '#e5e7eb')) + '\n';
  t += '- **分隔线**：' + cleanValue(borders.divider_style || borders.divider, '间距分隔为主，辅以极淡色分割线') + '\n\n';

  // 动效
  t += '## 动效\n\n';
  t += '- **缓动函数**：`' + (motion.easing || 'ease') + '`\n';
  if (motion.duration_scale) {
    t += '- **微交互**：`' + (motion.duration_scale.micro || '100ms') + '`\n';
    t += '- **常规过渡**：`' + (motion.duration_scale.normal || '200ms') + '`\n';
    t += '- **宏观动画**：`' + (motion.duration_scale.macro || '500ms') + '`\n';
  }
  if (motion.philosophy) t += '- **动效理念**：' + cleanValue(motion.philosophy, '流畅自然的过渡，不抢占用户注意力') + '\n';
  t += '\n';

  // ── 3. 组件样式 ──
  t += '---\n\n# 组件样式\n\n';
  const btn = components.buttons || {};
  t += '## 按钮\n\n';
  t += '- **主按钮**：' + cleanValue(btn.primary, '实色背景 `background: ' + (colors.primary?.hex || '#6366f1') + '`; 白色文字; `border-radius: ' + (radius.medium || '8px') + '`; `padding: 10px 24px`; `font-weight: 600`') + '\n';
  t += '- **次按钮**：' + cleanValue(btn.secondary, '透明底 + 主色边框; `border: 1px solid ' + (colors.primary?.hex || '#6366f1') + '`; 主色文字; 同等圆角') + '\n';
  t += '- **轮廓按钮**：' + cleanValue(btn.outline, '`background: transparent`; `border: 1px solid #d1d5db`; 灰色文字; 悬停时边框变深') + '\n\n';

  const card = components.cards || {};
  t += '## 卡片\n\n';
  t += '- **风格**：' + cleanValue(card.style, '`background: #fff`; `border-radius: ' + (radius.large || '16px') + '`; `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`') + '\n';
  t += '- **外观**：' + cleanValue(card.appearance, '圆角 + 微妙阴影浮起，内边距 `padding: 20px 24px`') + '\n';
  t += '- **交互**：' + cleanValue(card.interaction, '悬停 `transform: translateY(-2px)`; `box-shadow` 加深; `transition: all 0.2s ease`') + '\n\n';

  const input = components.inputs || {};
  t += '## 输入框\n\n';
  t += '- **常态**：' + cleanValue(input.normal, '`background: #fff`; `border: 1px solid #d1d5db`; `border-radius: ' + (radius.small || '6px') + '`; `padding: 8px 12px`; `font-size: 14px`') + '\n';
  t += '- **聚焦**：' + cleanValue(input.focus, '边框高亮 `border-color: ' + (colors.primary?.hex || '#6366f1') + '`; `box-shadow: 0 0 0 3px ' + (colors.primary?.hex || '#6366f1') + '33`') + '\n\n';

  t += '## 导航\n\n';
  t += cleanValue(components.navigation, '顶部固定导航栏; `background: ' + (colors.background || '#fff') + '`; `backdrop-filter: blur(8px)`; 链接色 `color: ' + (colors.foreground || '#374151') + '`; hover 变主色') + '\n\n';

  const sections = components.sections || {};
  t += '## 页面分区\n\n';
  t += '- **分隔方式**：' + cleanValue(sections.divider_style || sections.divider, '间距分隔为主，辅以 `1px solid ' + (colors.border || '#e5e7eb') + '` 细线') + '\n';
  t += '- **背景策略**：' + cleanValue(sections.background_strategy, '交替使用 `' + (colors.background || '#fff') + '` 和 `' + (colors.muted || '#f9fafb') + '` 制造区块节奏') + '\n\n';

  // ── 4. 构图与布局 ──
  t += '---\n\n# 构图与布局\n\n';
  t += '- **层级方法**：' + cleanValue(composition.hierarchy_method, '通过字号对比 + 色彩权重建立视觉层级') + '\n';
  t += '- **平衡类型**：' + cleanValue(composition.balance_type, '居中对称') + '\n';
  t += '- **视觉流向**：' + cleanValue(composition.flow_direction, '从上到下，Z 型阅读路径') + '\n';
  t += '- **负空间作用**：' + cleanValue(composition.negative_space_role, '留白引导视线聚焦，模块间保持呼吸感') + '\n\n';

  // ── 5. 视觉特效 ──
  const efxOverview = effects.overview || {};
  if (efxOverview.effect_intensity && efxOverview.effect_intensity !== 'none') {
    t += '---\n\n# 视觉特效\n\n';
    t += '- **特效强度**：' + efxOverview.effect_intensity + '\n';
    t += '- **性能层级**：' + (efxOverview.performance_tier || 'lightweight') + '\n';
    t += '- **主要技术**：' + (efxOverview.primary_technology || 'CSS only') + '\n';
    if (effects.composite_notes) t += '\n' + effects.composite_notes + '\n';
    t += '\n';
  }

  // ── 6. 使用指南 ──
  if ((guide.do?.length) || (guide.dont?.length) || (guide.signature_traits?.length)) {
    t += '---\n\n# 使用指南\n\n';
    if (guide.signature_traits?.length) {
      t += '### 签名特征\n\n';
      guide.signature_traits.forEach(trait => { t += '- ' + trait + '\n'; });
      t += '\n';
    }
    if (guide.do?.length) {
      t += '### ✅ 应该做\n\n';
      guide.do.forEach(item => { t += '- ' + item + '\n'; });
      t += '\n';
    }
    if (guide.dont?.length) {
      t += '### ❌ 不应该做\n\n';
      guide.dont.forEach(item => { t += '- ' + item + '\n'; });
      t += '\n';
    }
  }

  return t;
}

// ===== Generate Prompt Text (English) =====
function generatePromptTextEN(profile) {
  const p = profile;
  const tokens = p.design_tokens || {};
  const colors = tokens.colors || {};
  const typo = tokens.typography || {};
  const radius = tokens.radius || {};
  const shadows = tokens.shadows || {};
  const borders = tokens.borders || {};
  const motion = tokens.motion || {};
  const style = p.design_style || {};
  const aesthetic = style.aesthetic || {};
  const visual = style.visual_language || {};
  const composition = style.composition || {};
  const imagery = style.imagery || {};
  const interaction = style.interaction_feel || {};
  const effects = p.visual_effects || {};
  const components = p.component_styles || {};
  const guide = p.usage_guide || {};
  const philosophy = p.design_philosophy || {};

  const name = p.meta?.name || 'Unknown';
  const vibeList = philosophy.vibe?.length ? philosophy.vibe.join(', ') : 'modern, clean';
  const dnaList = philosophy.visual_dna?.length ? philosophy.visual_dna.join(', ') : '';

  let t = '';

  // ── 1. Design Philosophy ──
  t += '# Design Philosophy\n\n';
  t += '> **"' + (philosophy.core_essence || 'Design identity extracted from ' + name) + '"**\n\n';
  t += 'This design system is extracted from **' + name + '**. ';
  t += 'The overall vibe is **' + vibeList + '**, ';
  t += 'visual complexity is **' + (visual.complexity || 'moderate') + '**, ';
  t += 'ornamentation level is **' + (visual.ornamentation || 'subtle-accents') + '**.\n\n';

  t += '### Core Principles\n\n';
  t += '- **Visual DNA**: ' + (dnaList || 'Solid color blocks, geometric composition, no excess decoration') + '\n';
  t += '- **Whitespace Strategy**: ' + (visual.whitespace_usage || 'balanced') + '\n';
  t += '- **Contrast Level**: ' + (visual.contrast_level || 'high') + '\n';
  t += '- **Texture Usage**: ' + (visual.texture_usage || 'none') + '\n';
  t += '- **Focal Strategy**: ' + cleanValue(visual.focal_strategy, 'Single focal point (large hero area or center-stage composition)') + '\n';
  if (aesthetic.genre) t += '- **Genre**: ' + aesthetic.genre + '\n';
  if (aesthetic.era_influence) t += '- **Era Influence**: ' + aesthetic.era_influence + '\n';
  if (aesthetic.mood?.length) t += '- **Mood Keywords**: ' + aesthetic.mood.join(', ') + '\n';
  if (aesthetic.adjectives?.length) t += '- **Adjectives**: ' + aesthetic.adjectives.join(', ') + '\n';

  // ── 2. Design Token System ──
  t += '\n---\n\n# Design Token System\n\n';

  t += '## Colors\n\n';
  t += '| Token | Value | Usage |\n|---|---|---|\n';
  t += '| **Background** | `' + (colors.background || '#ffffff') + '` | Primary page background |\n';
  t += '| **Foreground** | `' + (colors.foreground || '#000000') + '` | Body text |\n';
  if (colors.primary?.hex) t += '| **Primary** | `' + colors.primary.hex + '` | ' + (colors.primary.role || 'Buttons, links, highlights') + ' |\n';
  if (colors.secondary?.hex) t += '| **Secondary** | `' + colors.secondary.hex + '` | ' + (colors.secondary.role || 'Supporting elements') + ' |\n';
  if (colors.accent?.hex) t += '| **Accent** | `' + colors.accent.hex + '` | ' + (colors.accent.role || 'CTAs, badges') + ' |\n';
  if (colors.muted) t += '| **Muted** | `' + colors.muted + '` | Secondary backgrounds, card fills |\n';
  if (colors.border) t += '| **Border** | `' + colors.border + '` | Dividers, input borders |\n';
  const semanticEN = colors.semantic || {};
  if (semanticEN.success) t += '| **Success** | `' + semanticEN.success + '` | Success state |\n';
  if (semanticEN.warning) t += '| **Warning** | `' + semanticEN.warning + '` | Warning state |\n';
  if (semanticEN.error) t += '| **Error** | `' + semanticEN.error + '` | Error state |\n';
  t += '\n**Contrast Strategy**: ' + (colors.contrast_strategy || 'High contrast') + '\n';
  t += '**Palette Type**: ' + (colors.palette_type || 'custom') + '\n\n';

  t += '## Typography\n\n';
  t += '### Font Stack\n\n';
  t += '```css\n';
  t += '/* Heading Font */\nfont-family: \'' + cleanValue(typo.heading_font, 'system-ui, sans-serif') + '\', sans-serif;\n\n';
  t += '/* Body Font */\nfont-family: \'' + cleanValue(typo.body_font, 'system-ui, sans-serif') + '\', sans-serif;\n';
  if (typo.mono_font) t += '\n/* Monospace Font */\nfont-family: \'' + typo.mono_font + '\', monospace;\n';
  t += '```\n\n';

  if (typo.scale && Object.keys(typo.scale).length) {
    t += '### Type Scale\n\n';
    t += '| Level | Size | Weight | Line Height |\n|---|---|---|---|\n';
    Object.entries(typo.scale).forEach(([level, v]) => {
      if (v && typeof v === 'object') {
        t += '| **' + level + '** | `' + (v.size || '-') + '` | ' + (v.weight || '-') + ' | ' + (v.line_height || '-') + ' |\n';
      }
    });
    t += '\n';
  }
  if (typo.style_notes) t += '**Typographic Character**: ' + typo.style_notes + '\n\n';

  t += '## Radius & Shapes\n\n';
  t += '| Level | Value |\n|---|---|\n';
  t += '| Small | `' + (radius.small || '4px') + '` |\n';
  t += '| Medium | `' + (radius.medium || '8px') + '` |\n';
  t += '| Large | `' + (radius.large || '16px') + '` |\n';
  t += '| Pill | `' + (radius.pill || '9999px') + '` |\n';
  if (radius.philosophy) t += '\n**Philosophy**: ' + cleanValue(radius.philosophy, 'Unified radius system for visual consistency') + '\n';
  t += '\n';

  t += '## Shadows & Effects\n\n';
  t += '**Shadow Style**: ' + cleanValue(shadows.style, 'Soft diffused shadows for card and overlay depth separation') + '\n\n';
  if (shadows.levels) {
    t += '| Level | Value |\n|---|---|\n';
    t += '| Low | `' + (shadows.levels.low || 'none') + '` |\n';
    t += '| Medium | `' + (shadows.levels.medium || 'none') + '` |\n';
    t += '| High | `' + (shadows.levels.high || 'none') + '` |\n\n';
  }
  if (shadows.depth_cues) t += '**Depth Cues**: ' + cleanValue(shadows.depth_cues, '') + '\n\n';

  t += '## Borders\n\n';
  t += '- **Usage**: ' + cleanValue(borders.usage, 'Moderate — primarily for inputs and card separation') + '\n';
  t += '- **Style**: ' + cleanValue(borders.style, '1px solid ' + (colors.border || '#e5e7eb')) + '\n';
  t += '- **Dividers**: ' + cleanValue(borders.divider_style || borders.divider, 'Spacing-based separation with optional subtle hairlines') + '\n\n';

  t += '## Motion\n\n';
  t += '- **Easing**: `' + (motion.easing || 'ease') + '`\n';
  if (motion.duration_scale) {
    t += '- **Micro**: `' + (motion.duration_scale.micro || '100ms') + '`\n';
    t += '- **Normal**: `' + (motion.duration_scale.normal || '200ms') + '`\n';
    t += '- **Macro**: `' + (motion.duration_scale.macro || '500ms') + '`\n';
  }
  if (motion.philosophy) t += '- **Philosophy**: ' + cleanValue(motion.philosophy, 'Smooth natural transitions that don\'t steal user attention') + '\n';
  t += '\n';

  // ── 3. Component Stylings ──
  t += '---\n\n# Component Stylings\n\n';
  const btnEN = components.buttons || {};
  t += '## Buttons\n\n';
  t += '- **Primary**: ' + cleanValue(btnEN.primary, 'Solid fill `background: ' + (colors.primary?.hex || '#6366f1') + '`; white text; `border-radius: ' + (radius.medium || '8px') + '`; `padding: 10px 24px`; `font-weight: 600`') + '\n';
  t += '- **Secondary**: ' + cleanValue(btnEN.secondary, 'Transparent + primary border; `border: 1px solid ' + (colors.primary?.hex || '#6366f1') + '`; primary-colored text') + '\n';
  t += '- **Outline**: ' + cleanValue(btnEN.outline, '`background: transparent`; `border: 1px solid #d1d5db`; muted text; hover darkens border') + '\n\n';

  const cardEN = components.cards || {};
  t += '## Cards\n\n';
  t += '- **Style**: ' + cleanValue(cardEN.style, '`background: #fff`; `border-radius: ' + (radius.large || '16px') + '`; `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`') + '\n';
  t += '- **Appearance**: ' + cleanValue(cardEN.appearance, 'Rounded corners with subtle elevation, `padding: 20px 24px`') + '\n';
  t += '- **Interaction**: ' + cleanValue(cardEN.interaction, 'Hover `transform: translateY(-2px)`; shadow intensifies; `transition: all 0.2s ease`') + '\n\n';

  const inputEN = components.inputs || {};
  t += '## Inputs\n\n';
  t += '- **Normal**: ' + cleanValue(inputEN.normal, '`background: #fff`; `border: 1px solid #d1d5db`; `border-radius: ' + (radius.small || '6px') + '`; `padding: 8px 12px`') + '\n';
  t += '- **Focus**: ' + cleanValue(inputEN.focus, 'Border highlights to `' + (colors.primary?.hex || '#6366f1') + '`; `box-shadow: 0 0 0 3px ' + (colors.primary?.hex || '#6366f1') + '33`') + '\n\n';

  t += '## Navigation\n\n';
  t += cleanValue(components.navigation, 'Fixed top nav; `background: ' + (colors.background || '#fff') + '`; `backdrop-filter: blur(8px)`; link color `' + (colors.foreground || '#374151') + '`; hover turns primary') + '\n\n';

  const sectionsEN = components.sections || {};
  t += '## Page Sections\n\n';
  t += '- **Divider Style**: ' + cleanValue(sectionsEN.divider_style || sectionsEN.divider, 'Spacing-based separation, optional `1px solid ' + (colors.border || '#e5e7eb') + '` hairline') + '\n';
  t += '- **Background Strategy**: ' + cleanValue(sectionsEN.background_strategy, 'Alternating `' + (colors.background || '#fff') + '` and `' + (colors.muted || '#f9fafb') + '` for section rhythm') + '\n\n';

  // ── 4. Composition & Layout ──
  t += '---\n\n# Composition & Layout\n\n';
  t += '- **Hierarchy Method**: ' + cleanValue(composition.hierarchy_method, 'Scale contrast + color weight to establish visual hierarchy') + '\n';
  t += '- **Balance Type**: ' + cleanValue(composition.balance_type, 'Centered symmetric') + '\n';
  t += '- **Flow Direction**: ' + cleanValue(composition.flow_direction, 'Top-to-bottom, Z-pattern reading path') + '\n';
  t += '- **Negative Space Role**: ' + cleanValue(composition.negative_space_role, 'Whitespace guides focus, sections breathe with generous margins') + '\n\n';

  // ── 5. Visual Effects ──
  const efxOverviewEN = effects.overview || {};
  if (efxOverviewEN.effect_intensity && efxOverviewEN.effect_intensity !== 'none') {
    t += '---\n\n# Visual Effects\n\n';
    t += '- **Effect Intensity**: ' + efxOverviewEN.effect_intensity + '\n';
    t += '- **Performance Tier**: ' + (efxOverviewEN.performance_tier || 'lightweight') + '\n';
    t += '- **Primary Technology**: ' + (efxOverviewEN.primary_technology || 'CSS only') + '\n';
    if (effects.composite_notes) t += '\n' + effects.composite_notes + '\n';
    t += '\n';
  }

  // ── 6. Usage Guide ──
  if ((guide.do?.length) || (guide.dont?.length) || (guide.signature_traits?.length)) {
    t += '---\n\n# Usage Guide\n\n';
    if (guide.signature_traits?.length) {
      t += '### Signature Traits\n\n';
      guide.signature_traits.forEach(trait => { t += '- ' + trait + '\n'; });
      t += '\n';
    }
    if (guide.do?.length) {
      t += '### ✅ Do\n\n';
      guide.do.forEach(item => { t += '- ' + item + '\n'; });
      t += '\n';
    }
    if (guide.dont?.length) {
      t += '### ❌ Don\'t\n\n';
      guide.dont.forEach(item => { t += '- ' + item + '\n'; });
      t += '\n';
    }
  }

  return t;
}

// ===== Copy Buttons =====
document.getElementById('copyJsonBtn').addEventListener('click', () => {
  const text = document.getElementById('jsonOutput').textContent;
  navigator.clipboard.writeText(text);
  showToast('JSON 已复制！');
});
document.getElementById('copyPromptBtn').addEventListener('click', () => {
  const cn = document.getElementById('promptOutputCN').textContent;
  const en = document.getElementById('promptOutputEN').textContent;
  navigator.clipboard.writeText(cn + '\n\n---\n\n' + en);
  showToast('中英文 Prompt 已复制！');
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

// ===== Prompt Dual Column Scroll Sync =====
(function initPromptScrollSync() {
  const cnPanel = document.getElementById('promptOutputCN');
  const enPanel = document.getElementById('promptOutputEN');
  if (!cnPanel || !enPanel) return;

  let isSyncing = false;

  function syncScroll(source, target) {
    if (isSyncing) return;
    isSyncing = true;
    const scrollRatio = source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
    target.scrollTop = scrollRatio * (target.scrollHeight - target.clientHeight);
    isSyncing = false;
  }

  cnPanel.addEventListener('scroll', () => syncScroll(cnPanel, enPanel));
  enPanel.addEventListener('scroll', () => syncScroll(enPanel, cnPanel));
})();
