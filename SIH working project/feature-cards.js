















/* Interactive feature-card demos. All persisted prototype state is kept in localStorage. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} return v; };
  const esc = v => { const e = document.createElement('div'); e.textContent = v ?? ''; return e.innerHTML; };
  function close() { $('#feature-modal')?.remove(); }
  function modal(title, content) { close(); const node = document.createElement('div'); node.id = 'feature-modal'; node.className = 'modal-backdrop fixed inset-0 z-[75] flex items-center justify-center p-4'; node.innerHTML = `<div class="modal-panel w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true"><div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-extrabold text-emerald-950">${title}</h2><button data-close class="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100" aria-label="Close">×</button></div>${content}</div>`; node.addEventListener('click', e => { if (e.target === node || e.target.closest('[data-close]')) close(); }); document.body.append(node); return node; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  function addReport(type, location, description) { if (window.SwachhReports?.create) return window.SwachhReports.create({ type, location, description, date: new Date().toLocaleDateString('en-IN') }); const reports = load('swachhSaathiReports', []); const list = Array.isArray(reports) ? reports : [reports]; const report = { id: `SS-${String(list.length + 1).padStart(6, '0')}`, type, location, description, date: new Date().toLocaleDateString('en-IN'), status: 'NEW' }; list.push(report); save('swachhSaathiReports', list); document.dispatchEvent(new CustomEvent('swachh:report-created', { detail: report })); return report; }

  function aiDetection() { const node = modal('AI Waste Detection', '<p class="text-sm text-gray-600">Frontend demo — a real AI model can later connect through <code>analyzeWasteImage()</code>.</p><label class="mt-4 block rounded-xl border-2 border-dashed border-emerald-200 p-5 text-center text-sm text-emerald-800" id="ai-drop">Drop a waste image here or <u>choose a file</u><input id="ai-file" type="file" accept="image/*" class="hidden"></label><img id="ai-preview" class="mt-3 hidden max-h-44 w-full rounded-xl object-cover"><button id="ai-analyze" disabled class="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Analyze Waste</button><div id="ai-result" class="mt-4"></div><button id="ai-history" class="mt-3 text-xs font-bold text-emerald-700 underline">View Analysis History</button>'); const file = $('#ai-file', node), preview = $('#ai-preview', node), analyze = $('#ai-analyze', node);
    const select = f => { if (!f?.type?.startsWith('image/')) return; const reader = new FileReader(); reader.onload = () => { preview.src = reader.result; preview.classList.remove('hidden'); analyze.disabled = false; }; reader.readAsDataURL(f); };
    $('#ai-drop', node).addEventListener('click', () => file.click()); file.addEventListener('change', () => select(file.files[0])); $('#ai-drop', node).addEventListener('dragover', e => e.preventDefault()); $('#ai-drop', node).addEventListener('drop', e => { e.preventDefault(); select(e.dataTransfer.files[0]); }); analyze.addEventListener('click', () => { $('#ai-result', node).innerHTML = '<p class="animate-pulse text-sm font-bold text-emerald-700">🔍 Analyzing waste…</p>'; setTimeout(() => { const options = [['♻️ Plastic Waste', 94, 'Blue dry-waste bin', 'Put this item in the dry-waste bin.'], ['🍎 Food / Organic', 88, 'Green wet-waste bin', 'Compost or place in the wet-waste bin.'], ['📄 Paper Waste', 91, 'Blue dry-waste bin', 'Keep dry and recycle it.']]; const value = options[(file.files[0]?.name.length || 0) % options.length]; const item = { type: value[0], confidence: value[1], bin: value[2], date: new Date().toLocaleString() }; save('swachhSaathiAnalyses', [item, ...load('swachhSaathiAnalyses', [])]); $('#ai-result', node).innerHTML = `<div class="rounded-xl bg-emerald-50 p-4 text-sm"><b>${value[0]}</b><p>Confidence: ${value[1]}%</p><p>Recommended Bin: ${value[2]}</p><p>${value[3]}</p><button data-ai-report class="mt-2 rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Create Report</button></div>`; $('[data-ai-report]', node).onclick = () => { addReport(value[0], localStorage.getItem('swachhSaathiArea') || 'My Area', 'Detected through AI Waste Detection demo.'); close(); }; }, 900); }); $('#ai-history', node).onclick = () => { const history = load('swachhSaathiAnalyses', []); $('#ai-result', node).innerHTML = history.length ? history.map(x => `<p class="border-b py-2 text-xs"><b>${esc(x.type)}</b> — ${x.confidence}% · ${esc(x.date)}</p>`).join('') : '<p class="text-sm text-gray-500">No scans yet.</p>'; }; }

  function smartBins() { const node = modal('IoT Smart Bin Monitoring <span class="ml-2 rounded bg-amber-100 px-2 py-1 text-[10px] text-amber-800">Demo IoT Data</span>', '<div class="mb-3 flex flex-wrap gap-2" id="bin-filters"><button data-bin-filter="all">All</button><button data-bin-filter="Low">Normal</button><button data-bin-filter="Half-full">Half Full</button><button data-bin-filter="Almost Full">Almost Full</button><button data-bin-filter="Full">Full</button><button data-bin-filter="Offline">Offline</button></div><div id="bin-list" class="space-y-2"></div><button id="refresh-bins" class="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Refresh Sensor Data</button>'); let filter = 'all'; const render = () => { const bins = window.SwachhMap?.loadDustbins?.() || []; $('#bin-list', node).innerHTML = bins.filter(b => filter === 'all' || b.status === filter).map(b => `<article class="rounded-xl border border-gray-100 p-3 text-sm"><div class="flex justify-between"><b>${esc(b.id)} · ${esc(b.name)}</b><span>${esc(b.status)}</span></div><div class="mt-2 h-2 overflow-hidden rounded bg-gray-100"><span class="block h-full ${b.fillLevel > 90 ? 'bg-red-500' : b.fillLevel > 70 ? 'bg-amber-500' : 'bg-emerald-600'}" style="width:${b.fillLevel}%"></span></div><p class="mt-1 text-xs text-gray-500">Fill ${b.fillLevel}% · Battery ${b.battery}% · ${esc(b.lastUpdated)}</p><button data-map-bin="${b.id}" class="mt-2 text-xs font-bold text-emerald-700">View on Map</button></article>`).join(''); $$('[data-map-bin]', node).forEach(b => b.onclick = () => { close(); window.SwachhMap?.focusBin(b.dataset.mapBin); }); }; render(); $$('#bin-filters button', node).forEach(b => b.onclick = () => { filter = b.dataset.binFilter; render(); }); $('#refresh-bins', node).onclick = () => { const bins = (window.SwachhMap?.loadDustbins?.() || []).map(b => b.status === 'Offline' ? b : ({ ...b, fillLevel: Math.max(0, Math.min(100, b.fillLevel + Math.floor(Math.random() * 13) - 6)), lastUpdated: 'just now' })); save('swachhSaathiDustbins', bins); window.SwachhMap?.renderDustbinMarkers(); render(); }; }

  function worker() { const defaultTasks = [{ id: 'TASK-001', location: 'Main Road', priority: 'High', problem: 'Overflowing Dustbin', distance: '0.8 km', status: 'Assigned' }, { id: 'TASK-002', location: 'Market Lane', priority: 'Medium', problem: 'Waste collection', distance: '1.2 km', status: 'Assigned' }]; const node = modal('Worker Dashboard', '<div class="rounded-xl bg-emerald-50 p-3 text-sm"><b>Ravi Kumar · Worker ID WK-104</b><p>Current status: Available</p></div><div id="task-list" class="mt-4 space-y-3"></div>'); const render = () => { const tasks = load('swachhSaathiTasks', defaultTasks); $('#task-list', node).innerHTML = tasks.map(t => `<article class="rounded-xl border p-3 text-sm"><b>${t.id} · 📍 ${esc(t.location)}</b><p>Priority: ${t.priority} · ${esc(t.problem)} · ${t.distance}</p><p class="font-semibold text-emerald-700">${t.status}${t.proof ? ' · proof attached' : ''}</p><div class="mt-2 flex flex-wrap gap-2"><button data-task="nav" data-id="${t.id}">Navigate</button><button data-task="start" data-id="${t.id}">Start Task</button><label class="feature-mini-button">Upload Proof<input data-proof="${t.id}" type="file" accept="image/*" hidden></label><button data-task="complete" data-id="${t.id}">Complete Task</button></div></article>`).join(''); $$('[data-task]', node).forEach(b => b.onclick = () => { const tasks = load('swachhSaathiTasks', defaultTasks), task = tasks.find(t => t.id === b.dataset.id); if (b.dataset.task === 'nav') { close(); document.getElementById('my-area')?.scrollIntoView({ behavior: 'smooth' }); } if (b.dataset.task === 'start') task.status = 'In Progress'; if (b.dataset.task === 'complete') { task.status = 'Completed'; task.completedAt = new Date().toLocaleString(); } save('swachhSaathiTasks', tasks); render(); }); $$('[data-proof]', node).forEach(input => input.onchange = () => { const tasks = load('swachhSaathiTasks', defaultTasks), task = tasks.find(t => t.id === input.dataset.proof); task.proof = input.files[0]?.name || ''; save('swachhSaathiTasks', tasks); render(); }); }; render(); }

  function voiceReport() { const node = modal('🎙️ बोलकर बताएं', '<p class="text-sm text-gray-600">बस बोलिए, हम आपकी समस्या रिपोर्ट में बदल देंगे।</p><button id="voice-start" class="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">🎙️ Start Speaking</button><p id="voice-state" class="mt-3 text-sm"></p><textarea id="voice-text" class="mt-3 w-full rounded-lg border p-2 text-sm" rows="4" placeholder="Transcript or type your report here"></textarea><div class="mt-3 flex gap-2"><button id="voice-submit" class="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Submit Report</button></div>'); const text = $('#voice-text', node); $('#voice-start', node).onclick = () => { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { $('#voice-state', node).textContent = 'Voice reporting is not supported by this browser. Please use Chrome/Edge or type your report manually.'; return; } const recognition = new Recognition(); recognition.lang = (localStorage.getItem('swachhSaathiLanguage') || 'hi') === 'hi' ? 'hi-IN' : 'en-IN'; recognition.interimResults = true; recognition.onstart = () => $('#voice-state', node).textContent = 'Listening…'; recognition.onresult = e => { text.value = [...e.results].map(r => r[0].transcript).join(''); }; recognition.onerror = () => $('#voice-state', node).textContent = 'Could not hear speech. You can type the report instead.'; recognition.start(); }; $('#voice-submit', node).onclick = () => { if (!text.value.trim()) return; addReport('Waste accumulation', localStorage.getItem('swachhSaathiArea') || 'Main Road', text.value.trim()); close(); }; }

  function challenge() { const node = modal('🏆 हमारा गांव Challenge', '<div id="challenge-body"></div>'); const render = () => { const c = load('swachhSaathiChallenges', { points: 680, completed: false }); $('#challenge-body', node).innerHTML = `<div class="rounded-xl bg-emerald-50 p-4"><b>Village Cleanliness Score: 91 / 100</b><p class="mt-2">Weekly Progress: ████████░░ 82%</p><p class="mt-2">Current Points: ${c.points} · Level 4 — Cleanliness Champion</p></div><div class="mt-4 rounded-xl border p-4"><b>TODAY'S CHALLENGE</b><p class="mt-1 text-sm">Report one overflowing dustbin in your area.</p><button id="complete-challenge" class="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white" ${c.completed ? 'disabled' : ''}>${c.completed ? 'Completed ✓' : 'Complete Challenge (+10)'}</button></div><p class="mt-4 text-xs text-gray-500">Badges: 🌱 Green Starter · ♻️ Waste Warrior · 🏆 Cleanliness Champion · 💚 Swachh Saathi · 🌟 Village Hero</p><p class="mt-3 text-xs text-gray-500">Demo leaderboard: 1. Rahul — 920 · 2. Priya — 850 · 3. You — ${c.points}</p>`; $('#complete-challenge', node)?.addEventListener('click', () => { save('swachhSaathiChallenges', { points: c.points + 10, completed: true }); render(); }); }; render(); }

  function governance() { const node = modal('Rural + Urban', '<div class="flex gap-2"><button data-mode="rural">🌾 Rural</button><button data-mode="urban">🏙️ Urban</button></div><div id="governance-content" class="mt-4"></div>'); const render = mode => { save('swachhSaathiVillageMode', mode); $('#governance-content', node).innerHTML = mode === 'rural' ? '<div class="rounded-xl bg-emerald-50 p-4 text-sm"><b>Village governance</b><p>Village · Gram Panchayat · Ward · Block · District</p><p class="mt-2">Cleanliness score · Community reports · Panchayat announcements · Nearby dustbins · Collection schedule · Participation</p></div>' : '<div class="rounded-xl bg-blue-50 p-4 text-sm"><b>Urban governance</b><p>City · Zone · Ward · Municipality · Area</p><p class="mt-2">Ward score · Smart bins · Municipal complaints · Collection tracking · Worker assignments · Waste hotspots</p></div>'; }; render(localStorage.getItem('swachhSaathiVillageMode') || 'rural'); $$('[data-mode]', node).forEach(b => b.onclick = () => render(b.dataset.mode)); }

  const actions = [openWasteDetection, smartBins, worker, voiceReport, challenge, governance];
  const cards = $$('h3').filter(h => /AI Waste Detection|IoT Smart Bins|Worker Navigation|\u092c\u094b\u0932\u0915\u0930|Challenge|Rural \+ Urban/.test(h.textContent)).map(h => h.closest('.bg-white'));
  cards.forEach((card, index) => { if (!card) return; card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', `Open ${card.querySelector('h3')?.textContent}`); card.classList.add('feature-card'); card.addEventListener('click', () => actions[index]?.()); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actions[index]?.(); } }); });
  // Unlike the original demo, this flow does not infer a result from the file name.
  // A report is available only after a vision service confirms visible waste.
  let mobileNetModel;
  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${source}"]`);
      if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); if (window.tf || window.mobilenet) resolve(); return; }
      const script = document.createElement('script'); script.src = source; script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
  }
  async function loadMobileNet() {
    if (mobileNetModel) return mobileNetModel;
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
    mobileNetModel = await window.mobilenet.load();
    return mobileNetModel;
  }
  async function requestWasteVerification(file) {
    if (typeof window.analyzeWasteImage === 'function') return window.analyzeWasteImage(file);
    try {
      const data = new FormData(); data.append('image', file);
      const response = await fetch('/api/analyze-waste', { method: 'POST', body: data });
      if (response.ok) return response.json();
    } catch { /* Static deployments use the on-device model below. */ }
    const imageUrl = URL.createObjectURL(file);
    const image = new Image(); image.src = imageUrl;
    try {
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const predictions = await (await loadMobileNet()).classify(image, 5);
      const match = predictions.find(item => /trash|garbage|waste|dustbin|ashcan|ash-bin|recycling|refuse|litter/i.test(item.className));
      return match ? { isWaste: true, label: match.className, confidence: Math.round(match.probability * 100) } : { isWaste: false };
    } finally { URL.revokeObjectURL(imageUrl); }
  }
  function openWasteDetection() {
    const node = modal('AI Waste Detection', '<p class="text-sm text-gray-600">Upload a clear photo of waste or an overflowing dustbin. A report is created only after the image is verified.</p><label class="mt-4 block rounded-xl border-2 border-dashed border-emerald-200 p-5 text-center text-sm text-emerald-800" id="waste-drop">Drop a dustbin / waste image here or <u>choose a file</u><input id="waste-file" type="file" accept="image/*" class="hidden"></label><img id="waste-preview" class="mt-3 hidden max-h-44 w-full rounded-xl object-cover" alt="Selected image preview"><button id="waste-analyze" disabled class="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Verify image</button><div id="waste-result" class="mt-4" aria-live="polite"></div>');
    const input = $('#waste-file', node), preview = $('#waste-preview', node), verify = $('#waste-analyze', node);
    let selected = null;
    const select = file => {
      if (!file?.type?.startsWith('image/')) { $('#waste-result', node).innerHTML = '<p class="text-sm text-red-700">Please choose an image file.</p>'; return; }
      selected = file;
      const reader = new FileReader();
      reader.onload = () => { preview.src = reader.result; preview.classList.remove('hidden'); verify.disabled = false; $('#waste-result', node).innerHTML = ''; };
      reader.readAsDataURL(file);
    };
    $('#waste-drop', node).addEventListener('click', () => input.click());
    input.addEventListener('change', () => select(input.files[0]));
    $('#waste-drop', node).addEventListener('dragover', event => event.preventDefault());
    $('#waste-drop', node).addEventListener('drop', event => { event.preventDefault(); select(event.dataTransfer.files[0]); });
    verify.addEventListener('click', async () => {
      if (!selected) return;
      verify.disabled = true; $('#waste-result', node).innerHTML = '<p class="animate-pulse text-sm font-bold text-emerald-700">Verifying image...</p>';
      try {
        const result = await requestWasteVerification(selected);
        if (!result?.isWaste) { $('#waste-result', node).innerHTML = '<div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><b>Waste was not detected.</b><p class="mt-1">Please upload a clear photo of a dustbin, overflowing bin, or visible waste.</p></div>'; return; }
        const label = esc(result.label || 'Waste detected'), confidence = Number(result.confidence || 0);
        $('#waste-result', node).innerHTML = `<div class="rounded-xl bg-emerald-50 p-4 text-sm"><b>${label}</b><p>Verified confidence: ${confidence}%</p><button data-ai-report class="mt-2 rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Create Report</button></div>`;
        $('[data-ai-report]', node).onclick = () => { addReport(label, localStorage.getItem('swachhSaathiArea') || 'My Area', 'Verified through AI waste image analysis.'); close(); };
      } catch { $('#waste-result', node).innerHTML = '<div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><b>Image could not be verified.</b><p class="mt-1">Please upload a clear dustbin or visible-waste image. Connect a waste-analysis service to verify photos.</p></div>'; }
      finally { verify.disabled = false; }
    });
  }
})();
