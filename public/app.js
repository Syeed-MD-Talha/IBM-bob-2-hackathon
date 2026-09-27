/* SlideShift — app.js · 100% client-side converters, no server, no database */
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d){ try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }catch{ return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
const fmtBytes = n => n < 1024 ? n + ' B' : n < 1048576 ? (n/1024).toFixed(1) + ' KB' : (n/1048576).toFixed(1) + ' MB';

let direction = 'pptx2pdf';
let currentFile = null;
let resultBlob = null;
let doneCount = store.get('ss_done', 0);

function toast(msg, err=false){
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  $('toasts').appendChild(t); setTimeout(()=>{ t.style.opacity='0'; t.style.transition='.4s'; setTimeout(()=>t.remove(),400); }, 3600);
}
function log(msg){
  const el = $('log'); el.classList.remove('hidden');
  el.textContent += msg + '\n'; el.scrollTop = el.scrollHeight;
}
function progress(frac, text){
  $('progressWrap').classList.remove('hidden');
  $('barFill').style.width = Math.round(frac * 100) + '%';
  $('progressText').textContent = text;
}
function setBusy(busy, label){
  $('convertBtn').disabled = busy || !currentFile;
  if (label) $('convertBtn').textContent = label;
}
function stem(name){ return name.replace(/\.[^.]+$/, ''); }

/* ---------- engine status ---------- */
function checkEngines(){
  const checks = {
    pdfjs: !!(window.pdfjsLib || window['pdfjs-dist/build/pdf']),
    jszip: !!window.JSZip,
    jspdf: !!(window.jspdf && window.jspdf.jsPDF),
    pptxgen: !!window.PptxGenJS,
  };
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions){
    try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch {}
  }
  document.querySelectorAll('#engineRow span').forEach(s => {
    const ok = checks[s.dataset.eng];
    s.classList.toggle('ok', !!ok); s.classList.toggle('bad', !ok);
    s.textContent = (ok ? '✓ ' : '✕ ') + s.textContent.replace(/^[✓✕] /, '');
  });
  const allOk = Object.values(checks).every(Boolean);
  const pill = $('enginePill');
  pill.textContent = allOk ? '● engines ready (offline after load)' : '● a CDN library failed to load — check connection & reload';
  pill.classList.toggle('ok', allOk); pill.classList.toggle('bad', !allOk);
  return checks;
}

/* ---------- file picking ---------- */
function pickFile(file){
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') setDirection('pdf2pptx');
  else if (ext === 'pptx') setDirection('pptx2pdf');
  else { toast('Only .pptx and .pdf files are supported (.ppt is not)', true); return; }
  if (file.size > 150 * 1048576){ toast('File is very large — the browser may run out of memory', true); }
  currentFile = file;
  resultBlob = null; $('downloadBtn').classList.add('hidden');
  $('log').textContent = ''; $('log').classList.add('hidden');
  $('progressWrap').classList.add('hidden'); $('barFill').style.width = '0%';
  $('filebar').classList.remove('hidden');
  $('fileName').textContent = file.name;
  $('fileMeta').textContent = fmtBytes(file.size) + ' · ' + (ext === 'pdf' ? 'PDF → PPTX' : 'PPTX → PDF');
  setBusy(false, ext === 'pdf' ? 'Convert PDF → PPTX 🚀' : 'Convert PPTX → PDF 🚀');
  log(`selected: ${file.name} (${fmtBytes(file.size)})`);
}
function setDirection(dir){
  direction = dir;
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.dir === dir));
  $('opts-pptx2pdf').classList.toggle('hidden', dir !== 'pptx2pdf');
  $('opts-pdf2pptx').classList.toggle('hidden', dir !== 'pdf2pptx');
  $('dzHint').textContent = dir === 'pptx2pdf' ? 'Accepts .pptx up to ~100MB' : 'Accepts .pdf up to ~100MB';
  $('fileInput').accept = dir === 'pptx2pdf' ? '.pptx' : '.pdf';
  if (currentFile){
    const ext = (currentFile.name.split('.').pop() || '').toLowerCase();
    const ok = (dir === 'pptx2pdf' && ext === 'pptx') || (dir === 'pdf2pptx' && ext === 'pdf');
    if (!ok){ currentFile = null; $('filebar').classList.add('hidden'); }
    setBusy(false, currentFile ? (dir === 'pdf2pptx' ? 'Convert PDF → PPTX 🚀' : 'Convert PPTX → PDF 🚀') : 'Select a file to start');
  }
}

/* ================= PDF → PPTX ================= */
async function convertPdfToPptx(file){
  const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!pdfjs) throw new Error('PDF engine (pdf.js) failed to load from CDN.');
  if (!window.PptxGenJS) throw new Error('PPTX writer (PptxGenJS) failed to load from CDN.');
  const buf = await file.arrayBuffer();
  let pdf;
  try { pdf = await pdfjs.getDocument({ data: buf }).promise; }
  catch(e){ throw new Error(/password|encrypt/i.test(e.message || '') ? 'This PDF is password-protected — not supported.' : 'Could not parse this PDF: ' + (e.message || e)); }
  const n = pdf.numPages;
  log(`PDF loaded: ${n} page${n === 1 ? '' : 's'}`);
  const scale = parseFloat($('pptxScale').value);
  const pptx = new window.PptxGenJS();
  pptx.layout = $('pptxLayout').value; // LAYOUT_WIDE | LAYOUT_4x3
  pptx.author = 'SlideShift (client-side)';
  for (let i = 1; i <= n; i++){
    progress((i - 1) / n, `Rendering page ${i}/${n}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addImage({ data: `image/jpeg;base64,${dataUrl}`, x: 0, y: 0, w: '100%', h: '100%' });
    log(`  page ${i}/${n} ✓ (${canvas.width}×${canvas.height}px)`);
    canvas.width = canvas.height = 0; // free memory
  }
  progress(1, 'Building .pptx…');
  const outName = ($('pdfOutName').value.trim() || stem(file.name)) + '.pptx';
  await pptx.writeFile({ fileName: outName });
  // writeFile already triggers download; also keep blob for the download button
  resultBlob = null;
  return { pages: n, outName, autoDownloaded: true };
}

/* ================= PPTX → PDF ================= */
async function zipText(zip, path){
  const f = zip.file(path);
  return f ? f.async('string') : null;
}
function parseXml(str){ return new DOMParser().parseFromString(str, 'application/xml'); }

async function orderedSlides(zip){
  // presentation order via _rels; fallback: numeric filename sort
  try {
    const presXml = parseXml(await zipText(zip, 'ppt/presentation.xml'));
    const sldIds = [...presXml.getElementsByTagName('p:sldId')];
    if (sldIds.length){
      const relsXml = parseXml(await zipText(zip, 'ppt/_rels/presentation.xml.rels'));
      const map = {};
      [...relsXml.getElementsByTagName('Relationship')].forEach(r => { map[r.getAttribute('Id')] = r.getAttribute('Target'); });
      const ordered = sldIds.map(s => {
        let t = map[s.getAttribute('r:id')] || '';
        t = t.replace(/^\.\.\//, 'ppt/').replace(/^\//, '');
        if (!t.startsWith('ppt/')) t = 'ppt/' + t.replace(/^slides\//, 'slides/');
        return t;
      }).filter(t => zip.file(t));
      if (ordered.length) return ordered;
    }
  } catch {}
  return Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => parseInt(a.match(/slide(\d+)/)[1]) - parseInt(b.match(/slide(\d+)/)[1]));
}

function slideTexts(slideXml){
  const paras = [...slideXml.getElementsByTagName('a:p')].map(p =>
    [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('').trim()
  ).filter(Boolean);
  return paras;
}

async function slideImages(zip, slidePath){
  const out = [];
  try {
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsStr = await zipText(zip, relsPath);
    if (!relsStr) return out;
    const relsXml = parseXml(relsStr);
    const targets = [...relsXml.getElementsByTagName('Relationship')]
      .filter(r => /image/i.test(r.getAttribute('Type') || ''))
      .map(r => r.getAttribute('Target'));
    for (const t of targets){
      let p = t.replace(/^\.\.\//, 'ppt/').replace(/^\//, '');
      if (p.startsWith('media/')) p = 'ppt/' + p;
      if (!p.startsWith('ppt/')) p = 'ppt/media/' + p.split('/').pop();
      const f = zip.file(p);
      if (!f) continue;
      const ext = (p.split('.').pop() || 'png').toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'bmp' ? 'image/bmp' : 'image/png';
      const b64 = await f.async('base64');
      out.push({ dataUrl: `data:${mime};base64,${b64}`, fmt: mime === 'image/jpeg' ? 'JPEG' : 'PNG' });
    }
  } catch {}
  return out;
}

async function convertPptxToPdf(file){
  if (!window.JSZip) throw new Error('ZIP engine (JSZip) failed to load from CDN.');
  if (!(window.jspdf && window.jspdf.jsPDF)) throw new Error('PDF writer (jsPDF) failed to load from CDN.');
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const slides = await orderedSlides(zip);
  if (!slides.length) throw new Error('No slides found — is this a valid .pptx (not .ppt)?');
  log(`PPTX loaded: ${slides.length} slide${slides.length === 1 ? '' : 's'} (presentation order)`);
  const orient = $('pdfOrient').value;
  const includeImages = $('pdfImages').checked;
  const { jsPDF } = window.jspdf;
  const landscape = orient === 'landscape';
  const PW = landscape ? 13.33 : 7.5, PH = landscape ? 7.5 : 13.33;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'in', format: [PW, PH], compress: true });
  doc.setProperties({ title: stem(file.name), creator: 'SlideShift (client-side)' });
  const M = 0.55;
  for (let i = 0; i < slides.length; i++){
    progress(i / slides.length, `Slide ${i + 1}/${slides.length}…`);
    if (i > 0) doc.addPage([PW, PH], landscape ? 'landscape' : 'portrait');
    // slide number footer
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(140);
    doc.text(`${i + 1} / ${slides.length}`, PW - M, PH - 0.3, { align: 'right' });
    let paras = [];
    try {
      const xml = parseXml(await zipText(zip, slides[i]));
      paras = slideTexts(xml);
    } catch { paras = []; }
    const [title, ...body] = paras;
    let y = M + 0.25;
    const maxW = PW - M * 2;
    if (title){
      doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(20);
      const lines = doc.splitTextToSize(title, maxW);
      doc.text(lines.slice(0, 3), M, y); y += lines.slice(0, 3).length * 0.36;
      doc.setDrawColor(140, 92, 246); doc.setLineWidth(0.02); doc.line(M, y + 0.05, M + 1.2, y + 0.05); y += 0.3;
    }
    if (body.length){
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(45);
      for (const p of body){
        const lines = doc.splitTextToSize('•  ' + p, maxW);
        if (y + lines.length * 0.24 > PH - (includeImages ? 2.6 : 0.7)){ doc.text('… (trimmed — complex layout)', M, PH - (includeImages ? 2.6 : 0.7)); break; }
        doc.text(lines, M, y); y += lines.length * 0.24 + 0.08;
      }
    }
    if (!paras.length){
      doc.setFont('helvetica', 'italic'); doc.setFontSize(13); doc.setTextColor(130);
      doc.text('(no extractable text on this slide — likely image-only)', M, y);
    }
    if (includeImages){
      const imgs = await slideImages(zip, slides[i]);
      if (imgs.length){
        let x = M; const top = PH - 2.15, maxH = 1.9;
        doc.setFontSize(9); doc.setTextColor(140);
        doc.text(`images (${imgs.length})`, M, top - 0.12);
        for (const img of imgs.slice(0, 4)){
          try {
            const dim = doc.getImageProperties(img.dataUrl);
            const r = Math.min((PW - M * 2) / 4 / dim.width, maxH / dim.height);
            const w = dim.width * r, h = dim.height * r;
            if (x + w > PW - M) break;
            doc.addImage(img.dataUrl, img.fmt, x, top, w, h);
            x += w + 0.25;
          } catch {}
        }
        log(`  slide ${i + 1}: ${paras.length} text block(s), ${imgs.length} image(s)`);
      } else log(`  slide ${i + 1}: ${paras.length} text block(s)`);
    } else log(`  slide ${i + 1}: ${paras.length} text block(s)`);
  }
  progress(1, 'Saving PDF…');
  const outName = ($('pptxOutName').value.trim() || stem(file.name)) + '.pdf';
  resultBlob = doc.output('blob');
  return { pages: slides.length, outName, autoDownloaded: false };
}

/* ---------- convert entry ---------- */
async function convert(){
  if (!currentFile) return;
  setBusy(true, 'Converting… ⏳');
  $('downloadBtn').classList.add('hidden');
  try {
    let res;
    if (direction === 'pdf2pptx') res = await convertPdfToPptx(currentFile);
    else res = await convertPptxToPdf(currentFile);
    progress(1, `Done ✓ — ${res.pages} slide${res.pages === 1 ? '' : 's'}`);
    log(`done → ${res.outName}`);
    doneCount++; store.set('ss_done', doneCount); $('doneCount').textContent = doneCount + ' conversions done';
    if (res.autoDownloaded){
      toast(`Downloaded ${res.outName} ✓`);
      $('convertBtn').textContent = 'Convert again ↻';
    } else {
      const a = $('downloadBtn');
      a.href = URL.createObjectURL(resultBlob); a.download = res.outName;
      a.textContent = `⬇ Download ${res.outName}`;
      a.classList.remove('hidden');
      // auto-click for one-step UX, button remains as backup
      a.click();
      $('convertBtn').textContent = 'Convert again ↻';
      toast('PDF ready — download started ✓');
    }
  } catch(e){
    progress(0, 'Failed');
    log('ERROR: ' + (e.message || e));
    toast(e.message || 'Conversion failed', true);
    $('convertBtn').textContent = 'Try again ↻';
  } finally {
    setBusy(false);
    if (!/again|Try/.test($('convertBtn').textContent)) setBusy(false, 'Convert 🚀');
  }
}

/* ---------- init ---------- */
function init(){
  $('themeBtn').onclick = () => { const h = document.documentElement; h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark'; };
  $('doneCount').textContent = doneCount + ' conversions done';
  checkEngines();
  // retry engine check shortly after (slow CDN)
  setTimeout(checkEngines, 3000);

  document.querySelectorAll('.tabs .tab').forEach(t => t.onclick = () => setDirection(t.dataset.dir));
  setDirection('pptx2pdf');

  const dz = $('dropzone'), fi = $('fileInput');
  dz.onclick = () => fi.click();
  fi.onchange = () => pickFile(fi.files[0]);
  ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => pickFile(e.dataTransfer.files[0]));
  document.addEventListener('paste', e => { if (e.clipboardData && e.clipboardData.files[0]) pickFile(e.clipboardData.files[0]); });

  $('removeFile').onclick = () => {
    currentFile = null; fi.value = '';
    $('filebar').classList.add('hidden'); $('downloadBtn').classList.add('hidden');
    setBusy(false, 'Select a file to start'); $('convertBtn').disabled = true;
  };
  $('convertBtn').onclick = convert;
}
document.addEventListener('DOMContentLoaded', init);
