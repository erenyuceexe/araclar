const state = { mode: '3d', file: null, geometry: null, recent: [], target: 'OBJ', simplifyRatio: 1, lang: localStorage.getItem('forge-language') || (navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en') };
const theme = localStorage.getItem('forge-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const $ = (selector) => document.querySelector(selector);
const dropzone = $('#dropzone');
const fileInput = $('#fileInput');
const browseButton = $('#browseButton');
const convertButton = $('#convertButton');
const formatSelect = $('#formatSelect');
const fileRow = $('#fileRow');
const toast = $('#toast');
const modelView = { model: null, angleX: -0.45, angleY: 0.65, zoom: 1, panX: 0, panY: 0, wireframe: false, dragging: false, panning: false, lastX: 0, lastY: 0, frame: 0 };

const copy = {
  tr: {
    workspace: 'Çalışma alanı', home: 'Anasayfa', convert: 'Belgeler', threeDTools: '3D Tools', documentTools: 'Document Tools', stlConversion: '3D Tools', preview: 'Önizle', recentFiles: 'Son dosyalar', tools: 'Araçlar',
    imageTools: 'Görsel araçları', audioTools: 'Ses araçları', soon: 'Yakında', howItWorks: 'Nasıl çalışır?',
    privacy: 'Dosyaların cihazında<br />kalır.', ready: 'Hazır', headline: 'Dosyanı dönüştür.',
    subheadline: 'Dosyanı bırak, formatını seç, devamını Forge halletsin.', quickAction: 'Hızlı işlem',
    threeDFiles: '3D dosyaları', documents: 'Belgeler', addFile: 'Dosya ekle', orBrowse: 'veya cihazından seç',
    chooseFile: 'Dosya seç', maxSize: 'Maksimum dosya boyutu: 100 MB', outputFormat: 'Çıktı formatı',
    startConversion: 'Dönüştürmeyi başlat', localProcessing: 'İşlem tarayıcında gerçekleşir', resetScene: 'Sahneyi sıfırla',
    simplifyMesh: 'Mesh’i sadeleştir', simplifyHint: 'Daha hafif çıktı için üçgenleri azaltır', meshStats: 'Orijinal geometri',
    solid: 'Katı', wireframe: 'Tel kafes', previewPlaceholder: 'Model önizlemesi burada görünecek',
    previewHint: 'Bir 3D dosyası yüklediğinde sahneyi inceleyebilirsin.', controlsHint: 'Sol tıkla döndür · Sağ tıkla kaydır · Tekerlekle yakınlaştır',
    emptyScene: 'Boş sahne', recentActivity: 'Son işlemler', thisSession: 'Bu oturum', clear: 'Temizle', noActivity: 'Henüz bir işlem yok',
    drop3d: '3D dosyanı buraya bırak', dropDoc: 'Belgeni buraya bırak', uploaded: 'Yüklendi', target: 'HEDEF',
    converted: (name) => `${name} hazır — indirme başladı.`, tooLarge: 'Bu dosya 100 MB sınırını aşıyor.',
    upcoming: (name) => `${name} görünümü yakında burada.`, resetDone: 'Sahne görünümü sıfırlandı.',
    cleared: 'Son işlemler temizlendi.', help: 'Dosyanı yükle, hedef formatı seç ve dönüştürmeye başla.',
    converting: 'Dönüştürülüyor…', conversionError: 'Dönüştürme başarısız oldu: ',
    homeKicker: 'DOSYALAR İÇİN ÜRETİM ALANI', homeHeadline: 'Fikrini <em>dosyaya</em><br />dönüştür.', homeDescription: '3D modelleri, belgeleri, görselleri ve sesleri tek bir sakin çalışma alanında hazırla.',
    startStl: "3D Tools'a başla ↘", exploreTools: 'Araçları keşfet', homeStep1: 'Modelini yükle', homeStep2: 'Formatını seç', homeStep3: 'Çıktını al',
    imageTitle: 'Görsel araçları', imageDescription: 'Görseli yeniden boyutlandır veya tarayıcıda başka bir formata aktar.',
    audioTitle: 'Ses araçları', audioDescription: 'Ses dosyasını WAV olarak dışa aktar ve temel teknik bilgisini gör.',
    chooseImage: 'Görsel seç', chooseAudio: 'Ses seç', width: 'Genişlik', imageFormat: 'Çıktı formatı',
    exportImage: 'Görseli dışa aktar', exportAudio: 'WAV olarak dışa aktar', audioReady: 'Ses dosyası hazır',
  },
  en: {
    workspace: 'Workspace', home: 'Home', convert: 'Documents', threeDTools: '3D Tools', documentTools: 'Document Tools', stlConversion: '3D Tools', preview: 'Preview', recentFiles: 'Recent files', tools: 'Tools',
    imageTools: 'Image tools', audioTools: 'Audio tools', soon: 'Soon', howItWorks: 'How it works',
    privacy: 'Your files stay<br />on your device.', ready: 'Ready', headline: 'Convert your file.',
    subheadline: 'Drop a file, choose a format, and let Forge handle the rest.', quickAction: 'Quick action',
    threeDFiles: '3D files', documents: 'Documents', addFile: 'Add file', orBrowse: 'or browse your device',
    chooseFile: 'Choose file', maxSize: 'Maximum file size: 100 MB', outputFormat: 'Output format',
    startConversion: 'Start conversion', localProcessing: 'Processing happens in your browser', resetScene: 'Reset scene',
    simplifyMesh: 'Simplify mesh', simplifyHint: 'Reduce triangles for a lighter export', meshStats: 'Original geometry',
    solid: 'Solid', wireframe: 'Wireframe', previewPlaceholder: 'Your model preview will appear here',
    previewHint: 'Upload a 3D file to inspect the scene.', controlsHint: 'Left-drag to rotate · Right-drag to pan · Scroll to zoom',
    emptyScene: 'Empty scene', recentActivity: 'Recent activity', thisSession: 'This session', clear: 'Clear', noActivity: 'No activity yet',
    drop3d: 'Drop your 3D file here', dropDoc: 'Drop your document here', uploaded: 'Uploaded', target: 'TARGET',
    converted: (name) => `${name} is ready — download started.`, tooLarge: 'This file is larger than the 100 MB limit.',
    upcoming: (name) => `${name} view is coming soon.`, resetDone: 'Scene view reset.', cleared: 'Recent activity cleared.',
    help: 'Upload a file, choose the target format, and start the conversion.', converting: 'Converting…', conversionError: 'Conversion failed: ',
    homeKicker: 'A PRODUCTION SPACE FOR FILES', homeHeadline: 'Turn ideas into <em>files.</em>', homeDescription: 'Prepare 3D models, documents, images, and audio in one calm workspace.',
    startStl: 'Start 3D Tools ↘', exploreTools: 'Explore tools', homeStep1: 'Upload your model', homeStep2: 'Choose a format', homeStep3: 'Take your output',
    imageTitle: 'Image tools', imageDescription: 'Resize an image or export it to another format in your browser.',
    audioTitle: 'Audio tools', audioDescription: 'Export an audio file as WAV and inspect basic technical metadata.',
    chooseImage: 'Choose image', chooseAudio: 'Choose audio', width: 'Width', imageFormat: 'Output format',
    exportImage: 'Export image', exportAudio: 'Export as WAV', audioReady: 'Audio file ready',
  },
};
const t = (key, ...args) => typeof copy[state.lang][key] === 'function' ? copy[state.lang][key](...args) : copy[state.lang][key];

function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'tr' ? 'Forge — Dosyalarını dönüştür' : 'Forge — Convert your files';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.innerHTML = t(node.dataset.i18n); });
  $('#languageButton').textContent = state.lang === 'tr' ? 'EN' : 'TR';
  $('#languageButton').title = state.lang === 'tr' ? 'İngilizceye geç' : 'Switch to Turkish';
  $('#dropTitle').textContent = state.mode === '3d' ? t('drop3d') : t('dropDoc');
  $('#fileMeta').textContent = state.file ? `${formatSize(state.file.size)} · ${t('uploaded')}` : '';
  updateSimplifyUi();
  setMode(state.mode, true);
  applyTheme();
}
function applyTheme() {
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  const button = $('#themeButton');
  button.textContent = theme === 'dark' ? '☼' : '◐';
  button.title = theme === 'dark' ? (state.lang === 'tr' ? 'Açık moda geç' : 'Switch to light mode') : (state.lang === 'tr' ? 'Karanlık moda geç' : 'Switch to dark mode');
  button.setAttribute('aria-label', button.title);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}
function formatSize(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

function setMode(mode, keepFile = false) {
  state.mode = mode;
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  const is3d = mode === '3d';
  document.querySelector('.preview-section').classList.toggle('hidden', !is3d);
  $('#meshOptions').classList.toggle('hidden', !is3d);
  $('#formatHint').textContent = is3d ? 'STL · OBJ · PLY · OFF' : 'PDF · DOCX · TXT · MD';
  $('#dropTitle').textContent = is3d ? t('drop3d') : t('dropDoc');
  fileInput.accept = is3d ? '.stl,.obj,.ply,.off' : '.pdf,.docx,.txt,.md';
  formatSelect.innerHTML = is3d
    ? `<option value="obj">OBJ — 3D model</option><option value="stl">STL — ${state.lang === 'tr' ? '3D baskı' : '3D print'}</option><option value="ply">PLY — ${state.lang === 'tr' ? 'Mesh verisi' : 'Mesh data'}</option><option value="off">OFF — ${state.lang === 'tr' ? 'Poligon mesh' : 'Polygon mesh'}</option>`
    : '<option value="pdf">PDF — Portable document</option><option value="docx">DOCX — Word document</option><option value="txt">TXT — Plain text</option><option value="md">MD — Markdown</option>';
  if (!keepFile) resetFile();
}
function showMainView(view) {
  const home = view === 'home';
  $('#homeView').classList.toggle('hidden', !home);
  $('#utilityPanel').classList.add('hidden');
  document.querySelector('.mode-tabs').classList.toggle('hidden', home);
  document.querySelector('.conversion-layout').classList.toggle('hidden', home);
  document.querySelector('.preview-section').classList.toggle('hidden', home);
  document.querySelector('.recent-section').classList.toggle('hidden', home);
}

function resetFile() {
  state.file = null; state.geometry = null; state.simplifyRatio = 1; fileInput.value = ''; fileRow.classList.add('hidden'); dropzone.classList.remove('hidden');
  convertButton.disabled = true; $('.empty-preview').classList.remove('hidden'); $('#loadedModel').classList.add('hidden');
  $('#viewportStatus').textContent = t('emptyScene');
  modelView.model = null;
  $('#simplifyRange').value = 100;
  updateSimplifyUi();
  drawModel();
}
function handleFile(file) {
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) return showToast(t('tooLarge'));
  const extension = (file.name.split('.').pop() || 'file').toUpperCase();
  state.file = file; $('#fileType').textContent = extension; $('#fileName').textContent = file.name;
  $('#fileMeta').textContent = `${formatSize(file.size)} · ${t('uploaded')}`; fileRow.classList.remove('hidden'); dropzone.classList.add('hidden');
  convertButton.disabled = false; $('.empty-preview').classList.add('hidden'); $('#loadedModel').classList.remove('hidden');
  $('#modelLabel').textContent = file.name; $('#viewportStatus').textContent = `${extension} · ${t('ready')}`;
  if (state.mode === '3d') previewModel(file).catch((error) => showToast(error.message));
}
function addRecent(item) {
  state.recent.unshift(item); const list = $('#recentList'); $('#recentEmpty')?.remove();
  const row = document.createElement('div'); row.className = 'recent-item';
  row.innerHTML = `<div class="recent-icon">${item.from}</div><div class="recent-info"><strong>${item.name}</strong><span>${item.from} → ${item.to} · ${item.size}</span></div><span class="recent-time">${state.lang === 'tr' ? 'Az önce' : 'Just now'}</span>`;
  list.prepend(row);
}
function download(content, name, type) {
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function parseObj(text) {
  const vertices = [], faces = [];
  text.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v' && parts.length >= 4) vertices.push(parts.slice(1, 4).map(Number));
    if (parts[0] === 'f' && parts.length >= 4) {
      const indexes = parts.slice(1).map((part) => {
        const index = Number(part.split('/')[0]);
        return index < 0 ? vertices.length + index : index - 1;
      });
      for (let i = 1; i < indexes.length - 1; i += 1) faces.push([indexes[0], indexes[i], indexes[i + 1]]);
    }
  });
  return { vertices, faces };
}
function parsePly(text) {
  const lines = text.split(/\r?\n/); const end = lines.indexOf('end_header');
  if (end < 0) throw new Error('Invalid PLY header.');
  const vertexCount = Number((lines.find((line) => line.startsWith('element vertex ')) || '').split(' ')[2]);
  const faceCount = Number((lines.find((line) => line.startsWith('element face ')) || '').split(' ')[2]);
  const vertices = lines.slice(end + 1, end + 1 + vertexCount).map((line) => line.trim().split(/\s+/).slice(0, 3).map(Number));
  const faces = lines.slice(end + 1 + vertexCount, end + 1 + vertexCount + faceCount).flatMap((line) => {
    const indexes = line.trim().split(/\s+/).slice(1).map(Number); const triangles = [];
    for (let i = 1; i < indexes.length - 1; i += 1) triangles.push([indexes[0], indexes[i], indexes[i + 1]]);
    return triangles;
  });
  return { vertices, faces };
}
function parseOff(text) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim()).filter(Boolean);
  if (lines.shift()?.toUpperCase() !== 'OFF') throw new Error(state.lang === 'tr' ? 'Geçersiz OFF başlığı.' : 'Invalid OFF header.');
  const counts = (lines.shift() || '').split(/\s+/).map(Number);
  if (counts.length < 2 || !Number.isFinite(counts[0]) || !Number.isFinite(counts[1])) throw new Error(state.lang === 'tr' ? 'OFF sayacı okunamadı.' : 'OFF counts could not be read.');
  const vertices = lines.slice(0, counts[0]).map((line) => line.split(/\s+/).slice(0, 3).map(Number));
  const faces = lines.slice(counts[0], counts[0] + counts[1]).flatMap((line) => {
    const values = line.split(/\s+/).map(Number); const indexes = values.slice(1); const triangles = [];
    for (let i = 1; i < indexes.length - 1; i += 1) triangles.push([indexes[0], indexes[i], indexes[i + 1]]);
    return triangles;
  });
  return { vertices, faces };
}
function parseStl(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 15) throw new Error(state.lang === 'tr' ? 'STL dosyası çok kısa veya bozuk.' : 'The STL file is too short or corrupted.');
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder().decode(bytes);
  const asciiVertices = [];
  const vertexPattern = /^\s*vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/gim;
  let match;
  while ((match = vertexPattern.exec(text)) !== null) asciiVertices.push(match.slice(1).map(Number));
  if (asciiVertices.length >= 3 && asciiVertices.length % 3 === 0) {
    const faces = [];
    for (let i = 0; i < asciiVertices.length; i += 3) faces.push([i, i + 1, i + 2]);
    return { vertices: asciiVertices, faces };
  }
  if (buffer.byteLength < 84) throw new Error(state.lang === 'tr' ? 'Geçersiz STL başlığı.' : 'Invalid STL header.');
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  const expectedLength = 84 + count * 50;
  if (!count || expectedLength > buffer.byteLength) throw new Error(state.lang === 'tr' ? 'STL üçgen verisi okunamadı.' : 'STL triangle data could not be read.');
  const vertices = [], faces = [];
  for (let triangle = 0; triangle < count; triangle += 1) {
    const offset = 84 + triangle * 50;
    const start = vertices.length;
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const vertexOffset = offset + 12 + vertex * 12;
      vertices.push([view.getFloat32(vertexOffset, true), view.getFloat32(vertexOffset + 4, true), view.getFloat32(vertexOffset + 8, true)]);
    }
    faces.push([start, start + 1, start + 2]);
  }
  return { vertices, faces };
}
function modelToObj(model) {
  return `# Converted by Forge\n${model.vertices.map((v) => `v ${v.join(' ')}`).join('\n')}\n${model.faces.map((f) => `f ${f.map((i) => i + 1).join(' ')}`).join('\n')}\n`;
}
function modelToStl(model) {
  const lines = ['solid forge'];
  model.faces.forEach((face) => { lines.push(' facet normal 0 0 0', '  outer loop', ...face.map((i) => `   vertex ${model.vertices[i].join(' ')}`), '  endloop', ' endfacet'); });
  lines.push('endsolid forge'); return lines.join('\n');
}
function modelToPly(model) {
  return `ply\nformat ascii 1.0\ncomment Converted by Forge\nelement vertex ${model.vertices.length}\nproperty float x\nproperty float y\nproperty float z\nelement face ${model.faces.length}\nproperty list uchar int vertex_indices\nend_header\n${model.vertices.map((v) => v.join(' ')).join('\n')}\n${model.faces.map((f) => `3 ${f.join(' ')}`).join('\n')}\n`;
}
function modelToOff(model) {
  return `OFF\n${model.vertices.length} ${model.faces.length} 0\n${model.vertices.map((v) => v.join(' ')).join('\n')}\n${model.faces.map((f) => `3 ${f.join(' ')}`).join('\n')}\n`;
}
function simplifyModel(model, ratio) {
  if (!model || ratio >= 0.999 || model.faces.length < 4) return model;
  const targetFaces = Math.max(1, Math.round(model.faces.length * ratio));
  const stride = model.faces.length / targetFaces;
  const faces = []; const used = new Set();
  for (let i = 0; i < targetFaces; i += 1) {
    const face = model.faces[Math.min(model.faces.length - 1, Math.floor(i * stride))];
    if (!face || face.some((index) => !Number.isInteger(index) || !model.vertices[index])) continue;
    faces.push(face); face.forEach((index) => used.add(index));
  }
  const remap = new Map(); const vertices = [];
  used.forEach((index) => { remap.set(index, vertices.length); vertices.push(model.vertices[index]); });
  return { vertices, faces: faces.map((face) => face.map((index) => remap.get(index))) };
}
function updateSimplifyUi() {
  const range = $('#simplifyRange'); if (!range) return;
  const percent = Math.round(state.simplifyRatio * 100); $('#simplifyValue').value = `${percent}%`; $('#simplifyValue').textContent = `${percent}%`;
  const model = state.geometry;
  $('#meshStats').textContent = model ? `${model.vertices.length.toLocaleString()} ${state.lang === 'tr' ? 'nokta' : 'vertices'} · ${model.faces.length.toLocaleString()} ${state.lang === 'tr' ? 'üçgen' : 'triangles'}` : t('meshStats');
}
function applySimplification() {
  if (!state.geometry) return;
  const simplified = simplifyModel(state.geometry, state.simplifyRatio);
  const center = simplified.vertices.reduce((sum, vertex) => sum.map((value, index) => value + vertex[index]), [0, 0, 0]).map((value) => value / simplified.vertices.length);
  const bounds = simplified.vertices.reduce((result, vertex) => ({ min: result.min.map((value, i) => Math.min(value, vertex[i])), max: result.max.map((value, i) => Math.max(value, vertex[i])) }), { min: [...simplified.vertices[0]], max: [...simplified.vertices[0]] });
  const span = Math.max(...bounds.max.map((value, i) => value - bounds.min[i]), 0.001);
  modelView.model = { vertices: simplified.vertices.map((vertex) => vertex.map((value, i) => (value - center[i]) / span)), faces: simplified.faces };
  $('#viewportStatus').textContent = `${simplified.faces.length.toLocaleString()} ${state.lang === 'tr' ? 'üçgen' : 'triangles'} · ${t('ready')}`;
  updateSimplifyUi(); queueDraw();
}
async function previewModel(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const model = ext === 'obj' ? parseObj(await file.text()) : ext === 'ply' ? parsePly(await file.text()) : ext === 'off' ? parseOff(await file.text()) : parseStl(await file.arrayBuffer());
  if (!model.vertices.length || !model.faces.length) throw new Error(state.lang === 'tr' ? 'Model geometrisi bulunamadı.' : 'No model geometry found.');
  state.geometry = model; state.simplifyRatio = Number($('#simplifyRange').value || 100) / 100;
  applySimplification();
  modelView.angleX = -0.45; modelView.angleY = 0.65; modelView.zoom = 1; modelView.panX = 0; modelView.panY = 0;
  queueDraw();
}
function resizeModelCanvas() {
  queueDraw();
}
function setWireframe(enabled) {
  modelView.wireframe = enabled;
  drawModel();
}
function drawModel() {
  const canvas = $('#modelCanvas'); if (!canvas) return;
  const width = canvas.clientWidth || 500; const height = canvas.clientHeight || 280; const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) { canvas.width = width * ratio; canvas.height = height * ratio; }
  const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
  if (!modelView.model) return;
  const { vertices, faces } = modelView.model; const cosX = Math.cos(modelView.angleX); const sinX = Math.sin(modelView.angleX);
  const cosY = Math.cos(modelView.angleY); const sinY = Math.sin(modelView.angleY); const scale = Math.min(width, height) * 0.8 * modelView.zoom;
  const projected = vertices.map(([x, y, z]) => {
    const x1 = x * cosY - z * sinY; const z1 = x * sinY + z * cosY; const y1 = y * cosX - z1 * sinX; const z2 = y * sinX + z1 * cosX;
    return { x: width / 2 + modelView.panX + x1 * scale, y: height / 2 + modelView.panY - y1 * scale, z: z2 };
  });
  const visibleFaces = modelView.wireframe ? faces.map((face) => ({ face, depth: 0 })) : faces.map((face) => ({ face, depth: face.reduce((sum, index) => sum + projected[index].z, 0) / face.length })).sort((a, b) => a.depth - b.depth);
  visibleFaces.forEach(({ face }) => {
    const a = projected[face[0]], b = projected[face[1]], c = projected[face[2]]; const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) < 0.01) return;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    if (!modelView.wireframe) { const shade = Math.max(0.35, Math.min(1, 0.55 + cross / (scale * scale))); ctx.fillStyle = `rgb(${Math.round(244 * shade)},${Math.round(184 * shade)},${Math.round(74 * shade)})`; ctx.fill(); }
    ctx.strokeStyle = modelView.wireframe ? '#f4b84a' : 'rgba(20, 15, 8, .3)'; ctx.lineWidth = modelView.wireframe ? 1 : 0.5; ctx.stroke();
  });
}
function queueDraw() {
  if (modelView.frame) return;
  modelView.frame = requestAnimationFrame(() => { modelView.frame = 0; drawModel(); });
}
async function docxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer()); const xml = await zip.file('word/document.xml').async('text');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const paragraphs = [...document.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p')];
  return paragraphs.map((paragraph) => paragraph.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}
async function pdfText(file) {
  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise; let text = '';
  for (let page = 1; page <= pdf.numPages; page += 1) { const content = await (await pdf.getPage(page)).getTextContent(); text += `${content.items.map((item) => item.str).join(' ')}\n`; }
  return text.trim();
}
async function textFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'docx') return docxText(file);
  if (ext === 'pdf') return pdfText(file);
  return file.text();
}
async function makeDocx(text) {
  if (!window.docx) throw new Error('DOCX engine is unavailable.');
  const { Document, Packer, Paragraph } = window.docx;
  return Packer.toBlob(new Document({ sections: [{ children: text.split(/\n+/).map((line) => new Paragraph({ text: line })) }] }));
}
async function makePdf(text) {
  if (!window.jspdf?.jsPDF) throw new Error('PDF engine is unavailable.');
  const pdf = new window.jspdf.jsPDF(); const lines = pdf.splitTextToSize(text || ' ', 175);
  lines.forEach((line, index) => { if (index && index % 42 === 0) pdf.addPage(); pdf.text(line, 18, 20 + (index % 42) * 6); }); return pdf.output('blob');
}
function utilityMarkup(type) {
  const image = type === 'image';
  return `<h2>${t(image ? 'imageTitle' : 'audioTitle')}</h2><p>${t(image ? 'imageDescription' : 'audioDescription')}</p><div class="utility-grid"><label class="utility-control">${t(image ? 'chooseImage' : 'chooseAudio')}<input id="utilityFile" type="file" accept="${image ? 'image/*' : 'audio/*'}"></label>${image ? `<label class="utility-control">${t('width')}<input id="imageWidth" type="number" value="1600" min="1" max="8000"></label><label class="utility-control">${t('imageFormat')}<select id="imageFormat"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label><button class="utility-action" id="utilityAction">${t('exportImage')}</button>` : `<button class="utility-action" id="utilityAction">${t('exportAudio')}</button>`}</div><p class="utility-meta" id="utilityMeta"></p>`;
}
function audioToWav(buffer) {
  const channels = buffer.numberOfChannels; const length = buffer.length * channels * 2 + 44; const output = new ArrayBuffer(length); const view = new DataView(output);
  const write = (offset, value) => { for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, length - 8, true); write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, length - 44, true);
  let offset = 44; for (let i = 0; i < buffer.length; i += 1) for (let channel = 0; channel < channels; channel += 1) { const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i])); view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true); offset += 2; }
  return new Blob([output], { type: 'audio/wav' });
}
function openUtility(type) {
  const panel = $('#utilityPanel');
  document.querySelector('.mode-tabs').classList.add('hidden');
  document.querySelector('.conversion-layout').classList.add('hidden');
  document.querySelector('.preview-section').classList.add('hidden');
  document.querySelector('.recent-section').classList.add('hidden');
  panel.classList.remove('hidden'); panel.innerHTML = utilityMarkup(type);
  const input = $('#utilityFile'); const action = $('#utilityAction'); let file;
  input.addEventListener('change', () => { file = input.files[0]; $('#utilityMeta').textContent = file ? `${file.name} · ${formatSize(file.size)}` : ''; });
  action.addEventListener('click', async () => {
    if (!file) return showToast(state.lang === 'tr' ? 'Önce bir dosya seç.' : 'Choose a file first.');
    try {
      if (type === 'image') {
        const image = await createImageBitmap(file); const width = Math.min(Number($('#imageWidth').value) || image.width, 8000); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = Math.round(image.height * width / image.width); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const format = $('#imageFormat').value; const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, .92)); download(await blob.arrayBuffer(), `${file.name.replace(/\.[^.]+$/, '')}.${format.split('/')[1]}`, format); showToast(t('converted', file.name));
      } else {
        const context = new AudioContext(); const buffer = await context.decodeAudioData(await file.arrayBuffer()); const wav = audioToWav(buffer); download(wav, `${file.name.replace(/\.[^.]+$/, '')}.wav`, 'audio/wav'); $('#utilityMeta').textContent = `${t('audioReady')} · ${buffer.numberOfChannels} ch · ${Math.round(buffer.duration)} s`; await context.close();
      }
    } catch (error) { showToast(t('conversionError') + error.message); }
  });
}
async function convertFile() {
  const ext = state.file.name.split('.').pop().toLowerCase(); const target = formatSelect.value; const base = state.file.name.replace(/\.[^.]+$/, '');
  if (state.mode === '3d') {
    const source = state.geometry || (ext === 'obj' ? parseObj(await state.file.text()) : ext === 'ply' ? parsePly(await state.file.text()) : ext === 'off' ? parseOff(await state.file.text()) : parseStl(await state.file.arrayBuffer()));
    const model = simplifyModel(source, state.simplifyRatio);
    const content = target === 'obj' ? modelToObj(model) : target === 'ply' ? modelToPly(model) : target === 'off' ? modelToOff(model) : modelToStl(model);
    return { blob: new Blob([content], { type: target === 'stl' ? 'model/stl' : 'text/plain' }), name: `${base}.${target}` };
  }
  const text = await textFromFile(state.file);
  if (target === 'docx') return { blob: await makeDocx(text), name: `${base}.docx` };
  if (target === 'pdf') return { blob: await makePdf(text), name: `${base}.pdf` };
  return { blob: new Blob([target === 'md' ? `# ${base}\n\n${text}` : text], { type: 'text/plain' }), name: `${base}.${target}` };
}

browseButton.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', (event) => { if (event.target !== browseButton) fileInput.click(); });
dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));
$('#removeFile').addEventListener('click', resetFile);
formatSelect.addEventListener('change', () => { state.target = formatSelect.value.toUpperCase(); });
$('#simplifyRange').addEventListener('input', (event) => {
  state.simplifyRatio = Number(event.target.value) / 100;
  if (state.geometry) applySimplification();
  else updateSimplifyUi();
});
convertButton.addEventListener('click', async () => {
  if (!state.file) return;
  const originalLabel = convertButton.innerHTML; convertButton.disabled = true; convertButton.innerHTML = `<span>${t('converting')}</span><span class="spinner">◌</span>`;
  try {
    const from = (state.file.name.split('.').pop() || 'FILE').toUpperCase(); const result = await convertFile();
    download(await result.blob.arrayBuffer(), result.name, result.blob.type); addRecent({ name: result.name, from, to: formatSelect.value.toUpperCase(), size: formatSize(state.file.size) });
    showToast(t('converted', result.name));
  } catch (error) { showToast(t('conversionError') + error.message); }
  convertButton.disabled = false; convertButton.innerHTML = originalLabel;
});
document.querySelectorAll('.mode-tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
document.querySelectorAll('.nav-item[data-view]').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item[data-view]').forEach((nav) => nav.classList.remove('active')); item.classList.add('active');
  const key = item.dataset.view === 'home' ? 'home' : item.dataset.view === '3d-tools' ? 'threeDTools' : item.dataset.view === 'documents' ? 'documentTools' : item.dataset.view === 'preview' ? 'preview' : item.dataset.view === 'recent' ? 'recentFiles' : null;
  $('#breadcrumbCurrent').textContent = key ? t(key) : item.querySelector('span:not(.nav-badge):not(.tool-dot):not(.soon)')?.textContent;
  if (item.dataset.view === 'home') showMainView('home');
  else if (item.dataset.view === 'image' || item.dataset.view === 'audio') { showMainView('utility'); openUtility(item.dataset.view); }
  else if (item.dataset.view === '3d-tools') { showMainView('workspace'); setMode('3d'); }
  else if (item.dataset.view === 'documents') { showMainView('workspace'); setMode('doc'); }
  else if (item.dataset.view === 'preview') { showMainView('workspace'); setMode('3d', true); }
  else if (item.dataset.view !== 'convert') showToast(t('upcoming', $('#breadcrumbCurrent').textContent));
}));
document.querySelectorAll('[data-home-action]').forEach((button) => button.addEventListener('click', () => {
  const target = button.dataset.homeAction; document.querySelector(`.nav-item[data-view="${target}"]`).click();
}));
document.querySelectorAll('.view-pill').forEach((pill) => pill.addEventListener('click', () => { document.querySelectorAll('.view-pill').forEach((item) => item.classList.remove('active')); pill.classList.add('active'); $('#viewport').classList.toggle('wire-mode', pill.dataset.viewmode === 'wire'); }));
document.querySelectorAll('.view-pill').forEach((pill) => pill.addEventListener('click', () => setWireframe(pill.dataset.viewmode === 'wire')));
const modelCanvas = $('#modelCanvas');
modelCanvas.addEventListener('pointerdown', (event) => { modelView.dragging = true; modelView.panning = event.button === 2; modelView.lastX = event.clientX; modelView.lastY = event.clientY; modelCanvas.setPointerCapture(event.pointerId); });
modelCanvas.addEventListener('pointermove', (event) => {
  if (!modelView.dragging) return;
  const dx = event.clientX - modelView.lastX; const dy = event.clientY - modelView.lastY;
  if (modelView.panning) { modelView.panX += dx; modelView.panY += dy; } else { modelView.angleY += dx * 0.01; modelView.angleX += dy * 0.01; }
  modelView.lastX = event.clientX; modelView.lastY = event.clientY; queueDraw();
});
modelCanvas.addEventListener('pointerup', (event) => { modelView.dragging = false; modelCanvas.releasePointerCapture(event.pointerId); });
modelCanvas.addEventListener('contextmenu', (event) => event.preventDefault());
modelCanvas.addEventListener('wheel', (event) => { event.preventDefault(); modelView.zoom = Math.max(0.25, Math.min(4, modelView.zoom * (event.deltaY > 0 ? 0.9 : 1.1))); queueDraw(); }, { passive: false });
window.addEventListener('resize', resizeModelCanvas);
$('#resetPreview').addEventListener('click', () => { modelView.angleX = -0.45; modelView.angleY = 0.65; modelView.zoom = 1; modelView.panX = 0; modelView.panY = 0; queueDraw(); showToast(t('resetDone')); });
document.querySelector('.preview-actions button[title="Center view"]').addEventListener('click', () => { modelView.panX = 0; modelView.panY = 0; modelView.zoom = 1; queueDraw(); showToast(t('resetDone')); });
document.querySelector('.preview-actions button[title="Fullscreen"]').addEventListener('click', () => {
  const card = document.querySelector('.preview-card');
  if (document.fullscreenElement) document.exitFullscreen?.();
  else card.requestFullscreen?.();
});
$('#clearRecent').addEventListener('click', () => { state.recent = []; $('#recentList').innerHTML = `<div class="recent-empty" id="recentEmpty"><span>✦</span><span>${t('noActivity')}</span></div>`; showToast(t('cleared')); });
$('#helpButton').addEventListener('click', () => showToast(t('help')));
$('#languageButton').addEventListener('click', () => { state.lang = state.lang === 'tr' ? 'en' : 'tr'; localStorage.setItem('forge-language', state.lang); applyLanguage(); });
$('#themeButton').addEventListener('click', () => {
  const next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
  localStorage.setItem('forge-theme', next);
  document.documentElement.classList.toggle('theme-dark', next === 'dark');
  const button = $('#themeButton'); button.textContent = next === 'dark' ? '☼' : '◐'; button.title = next === 'dark' ? (state.lang === 'tr' ? 'Açık moda geç' : 'Switch to light mode') : (state.lang === 'tr' ? 'Karanlık moda geç' : 'Switch to dark mode'); button.setAttribute('aria-label', button.title);
});
applyLanguage();
applyTheme();
showMainView('home');
