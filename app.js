const state = { mode: '3d', file: null, recent: [], target: 'OBJ', lang: localStorage.getItem('forge-language') || (navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en') };
const $ = (selector) => document.querySelector(selector);
const dropzone = $('#dropzone');
const fileInput = $('#fileInput');
const browseButton = $('#browseButton');
const convertButton = $('#convertButton');
const formatSelect = $('#formatSelect');
const fileRow = $('#fileRow');
const toast = $('#toast');
let modelRenderer;
let modelScene;
let modelCamera;
let modelControls;
let modelMesh;

const copy = {
  tr: {
    workspace: 'Çalışma alanı', convert: 'Dönüştür', preview: 'Önizle', recentFiles: 'Son dosyalar', tools: 'Araçlar',
    imageTools: 'Görsel araçları', audioTools: 'Ses araçları', soon: 'Yakında', howItWorks: 'Nasıl çalışır?',
    privacy: 'Dosyaların cihazında<br />kalır.', ready: 'Hazır', headline: 'Dosyanı dönüştür.',
    subheadline: 'Dosyanı bırak, formatını seç, devamını Forge halletsin.', quickAction: 'Hızlı işlem',
    threeDFiles: '3D dosyaları', documents: 'Belgeler', addFile: 'Dosya ekle', orBrowse: 'veya cihazından seç',
    chooseFile: 'Dosya seç', maxSize: 'Maksimum dosya boyutu: 100 MB', outputFormat: 'Çıktı formatı',
    startConversion: 'Dönüştürmeyi başlat', localProcessing: 'İşlem tarayıcında gerçekleşir', resetScene: 'Sahneyi sıfırla',
    solid: 'Katı', wireframe: 'Tel kafes', previewPlaceholder: 'Model önizlemesi burada görünecek',
    previewHint: 'Bir 3D dosyası yüklediğinde sahneyi inceleyebilirsin.', controlsHint: 'Sol tıkla döndür · Sağ tıkla kaydır · Tekerlekle yakınlaştır',
    emptyScene: 'Boş sahne', recentActivity: 'Son işlemler', thisSession: 'Bu oturum', clear: 'Temizle', noActivity: 'Henüz bir işlem yok',
    drop3d: '3D dosyanı buraya bırak', dropDoc: 'Belgeni buraya bırak', uploaded: 'Yüklendi', target: 'HEDEF',
    converted: (name) => `${name} hazır — indirme başladı.`, tooLarge: 'Bu dosya 100 MB sınırını aşıyor.',
    upcoming: (name) => `${name} görünümü yakında burada.`, resetDone: 'Sahne görünümü sıfırlandı.',
    cleared: 'Son işlemler temizlendi.', help: 'Dosyanı yükle, hedef formatı seç ve dönüştürmeye başla.',
    converting: 'Dönüştürülüyor…', conversionError: 'Dönüştürme başarısız oldu: ',
  },
  en: {
    workspace: 'Workspace', convert: 'Convert', preview: 'Preview', recentFiles: 'Recent files', tools: 'Tools',
    imageTools: 'Image tools', audioTools: 'Audio tools', soon: 'Soon', howItWorks: 'How it works',
    privacy: 'Your files stay<br />on your device.', ready: 'Ready', headline: 'Convert your file.',
    subheadline: 'Drop a file, choose a format, and let Forge handle the rest.', quickAction: 'Quick action',
    threeDFiles: '3D files', documents: 'Documents', addFile: 'Add file', orBrowse: 'or browse your device',
    chooseFile: 'Choose file', maxSize: 'Maximum file size: 100 MB', outputFormat: 'Output format',
    startConversion: 'Start conversion', localProcessing: 'Processing happens in your browser', resetScene: 'Reset scene',
    solid: 'Solid', wireframe: 'Wireframe', previewPlaceholder: 'Your model preview will appear here',
    previewHint: 'Upload a 3D file to inspect the scene.', controlsHint: 'Left-drag to rotate · Right-drag to pan · Scroll to zoom',
    emptyScene: 'Empty scene', recentActivity: 'Recent activity', thisSession: 'This session', clear: 'Clear', noActivity: 'No activity yet',
    drop3d: 'Drop your 3D file here', dropDoc: 'Drop your document here', uploaded: 'Uploaded', target: 'TARGET',
    converted: (name) => `${name} is ready — download started.`, tooLarge: 'This file is larger than the 100 MB limit.',
    upcoming: (name) => `${name} view is coming soon.`, resetDone: 'Scene view reset.', cleared: 'Recent activity cleared.',
    help: 'Upload a file, choose the target format, and start the conversion.', converting: 'Converting…', conversionError: 'Conversion failed: ',
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
  setMode(state.mode, true);
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
  $('#formatHint').textContent = is3d ? 'STL · OBJ' : 'PDF · DOCX · TXT · MD';
  $('#dropTitle').textContent = is3d ? t('drop3d') : t('dropDoc');
  fileInput.accept = is3d ? '.stl,.obj' : '.pdf,.docx,.txt,.md';
  formatSelect.innerHTML = is3d
    ? `<option value="obj">OBJ — ${state.lang === 'tr' ? '3D model' : '3D model'}</option><option value="stl">STL — ${state.lang === 'tr' ? '3D baskı' : '3D print'}</option>`
    : '<option value="pdf">PDF — Portable document</option><option value="docx">DOCX — Word document</option><option value="txt">TXT — Plain text</option><option value="md">MD — Markdown</option>';
  if (!keepFile) resetFile();
}

function resetFile() {
  state.file = null; fileInput.value = ''; fileRow.classList.add('hidden'); dropzone.classList.remove('hidden');
  convertButton.disabled = true; $('.empty-preview').classList.remove('hidden'); $('#loadedModel').classList.add('hidden');
  $('#viewportStatus').textContent = t('emptyScene');
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
    if (parts[0] === 'f' && parts.length >= 4) faces.push(parts.slice(1).map((part) => Number(part.split('/')[0]) - 1));
  });
  return { vertices, faces };
}
function parseStl(buffer) {
  const bytes = new Uint8Array(buffer); const text = new TextDecoder().decode(bytes);
  if (/^\s*solid\b/i.test(text) && text.includes('facet')) {
    const vertices = [], faces = []; const lines = text.split(/\r?\n/);
    lines.forEach((line) => { const m = line.trim().match(/^vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/i); if (m) vertices.push(m.slice(1).map(Number)); });
    for (let i = 0; i < vertices.length; i += 3) faces.push([i, i + 1, i + 2]);
    return { vertices, faces };
  }
  const count = new DataView(buffer).getUint32(80, true); const vertices = [], faces = []; let offset = 84;
  for (let i = 0; i < count && offset + 50 <= buffer.byteLength; i += 1) {
    const start = vertices.length; for (let j = 0; j < 3; j += 1) { offset += 12; vertices.push([new DataView(buffer).getFloat32(offset - 12, true), new DataView(buffer).getFloat32(offset - 8, true), new DataView(buffer).getFloat32(offset - 4, true)]); }
    faces.push([start, start + 1, start + 2]); offset += 14;
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
async function previewModel(file) {
  if (!window.THREE) throw new Error('3D preview engine is unavailable.');
  const ext = file.name.split('.').pop().toLowerCase();
  const model = ext === 'obj' ? parseObj(await file.text()) : parseStl(await file.arrayBuffer());
  if (!model.vertices.length || !model.faces.length) throw new Error(state.lang === 'tr' ? 'Model geometrisi bulunamadı.' : 'No model geometry found.');
  const canvas = $('#modelCanvas');
  if (!modelRenderer) {
    modelRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    modelRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    modelScene = new THREE.Scene();
    modelScene.add(new THREE.HemisphereLight(0xffffff, 0x171b22, 2));
    const light = new THREE.DirectionalLight(0xf4b84a, 2.5); light.position.set(3, 5, 4); modelScene.add(light);
    modelCamera = new THREE.PerspectiveCamera(42, 1, 0.01, 1000); modelCamera.position.set(2.5, 2, 3.5);
    modelControls = window.THREE.OrbitControls ? new THREE.OrbitControls(modelCamera, canvas) : null;
    if (modelControls) { modelControls.enableDamping = true; modelControls.dampingFactor = 0.08; }
  }
  if (modelMesh) { modelMesh.geometry.dispose(); modelMesh.material.dispose(); modelScene.remove(modelMesh); }
  const positions = new Float32Array(model.faces.flatMap((face) => face.flatMap((index) => model.vertices[index])));
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0xf4b84a, metalness: 0.18, roughness: 0.48, side: THREE.DoubleSide });
  modelMesh = new THREE.Mesh(geometry, material); modelScene.add(modelMesh);
  geometry.computeBoundingSphere(); const radius = geometry.boundingSphere.radius || 1;
  modelMesh.scale.setScalar(1.65 / radius); modelMesh.position.sub(geometry.boundingSphere.center.multiplyScalar(modelMesh.scale.x));
  if (modelControls) modelControls.target.set(0, 0, 0);
  resizeModelCanvas();
  animateModel();
}
function resizeModelCanvas() {
  if (!modelRenderer || !modelCamera) return;
  const canvas = $('#modelCanvas'); const width = canvas.clientWidth || 500; const height = canvas.clientHeight || 280;
  modelRenderer.setSize(width, height, false); modelCamera.aspect = width / height; modelCamera.updateProjectionMatrix();
}
function animateModel() {
  if (!modelRenderer) return;
  requestAnimationFrame(animateModel);
  if (modelControls) modelControls.update();
  modelRenderer.render(modelScene, modelCamera);
}
function setWireframe(enabled) {
  if (modelMesh?.material) modelMesh.material.wireframe = enabled;
}
async function docxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer()); const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement.textContent.replace(/\s+/g, ' ').trim();
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
async function convertFile() {
  const ext = state.file.name.split('.').pop().toLowerCase(); const target = formatSelect.value; const base = state.file.name.replace(/\.[^.]+$/, '');
  if (state.mode === '3d') {
    const model = ext === 'obj' ? parseObj(await state.file.text()) : parseStl(await state.file.arrayBuffer());
    const content = target === 'obj' ? modelToObj(model) : modelToStl(model);
    return { blob: new Blob([content], { type: 'text/plain' }), name: `${base}.${target}` };
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
  const key = item.dataset.view === 'preview' ? 'preview' : item.dataset.view === 'recent' ? 'recentFiles' : null;
  $('#breadcrumbCurrent').textContent = key ? t(key) : item.querySelector('span:not(.nav-badge):not(.tool-dot):not(.soon)')?.textContent;
  if (item.dataset.view !== 'convert') showToast(t('upcoming', $('#breadcrumbCurrent').textContent));
}));
document.querySelectorAll('.view-pill').forEach((pill) => pill.addEventListener('click', () => { document.querySelectorAll('.view-pill').forEach((item) => item.classList.remove('active')); pill.classList.add('active'); $('#viewport').classList.toggle('wire-mode', pill.dataset.viewmode === 'wire'); }));
document.querySelectorAll('.view-pill').forEach((pill) => pill.addEventListener('click', () => setWireframe(pill.dataset.viewmode === 'wire')));
window.addEventListener('resize', resizeModelCanvas);
$('#resetPreview').addEventListener('click', () => { if (modelControls) { modelControls.reset(); } showToast(t('resetDone')); });
$('#clearRecent').addEventListener('click', () => { state.recent = []; $('#recentList').innerHTML = `<div class="recent-empty" id="recentEmpty"><span>✦</span><span>${t('noActivity')}</span></div>`; showToast(t('cleared')); });
$('#helpButton').addEventListener('click', () => showToast(t('help')));
$('#languageButton').addEventListener('click', () => { state.lang = state.lang === 'tr' ? 'en' : 'tr'; localStorage.setItem('forge-language', state.lang); applyLanguage(); });
applyLanguage();
