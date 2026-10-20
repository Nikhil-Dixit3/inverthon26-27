(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };
  function notifyAdminOfReport(report) {
    const notifications = store.get('swachhSaathiNotifications', []);
    notifications.unshift({
      id: `citizen-report-${report.id}-${Date.now()}`,
      message: `New citizen report: ${report.type} at ${report.location} (${report.id})`,
      type: 'report', read: false, at: new Date().toLocaleString('en-IN')
    });
    store.set('swachhSaathiNotifications', notifications.slice(0, 100));
  }
  // Keeps the original report key compatible with older prototype data that may be a single object.
  function loadReports() {
    const saved = store.get('swachhSaathiReports', []);
    if (Array.isArray(saved)) return saved;
    return saved && typeof saved === 'object' ? [saved] : [];
  }
  function generateReportId() {
    const existingMax = loadReports().reduce((max, report) => Math.max(max, Number(String(report.id || '').match(/(\d+)$/)?.[1]) || 0), 0);
    const stored = Number(localStorage.getItem('swachhSaathiReportSequence')) || 0;
    const next = Math.max(existingMax, stored) + 1;
    localStorage.setItem('swachhSaathiReportSequence', String(next));
    return `SS-${String(next).padStart(6, '0')}`;
  }
  function createReport(report) {
    const allReports = loadReports();
    const newReport = { id: generateReportId(), status: 'NEW', createdAt: new Date().toISOString(), ...report };
    allReports.push(newReport);
    store.set('swachhSaathiReports', allReports);
    notifyAdminOfReport(newReport);
    document.dispatchEvent(new CustomEvent('swachh:report-created', { detail: newReport }));
    return newReport;
  }
  function deleteReport(id) {
    const allReports = loadReports();
    const report = allReports.find(item => item.id === id);
    if (!report) return false;
    store.set('swachhSaathiReports', allReports.filter(item => item.id !== id));
    document.dispatchEvent(new CustomEvent('swachh:report-deleted', { detail: report }));
    return true;
  }
  window.SwachhReports = { load: loadReports, create: createReport, delete: deleteReport, generateReportId };
  const sections = $$('main section, body > section');
  const [hero, quick, area, stories, technology] = sections;
  if (hero) hero.id = 'home';
  if (area) area.id = 'my-area';
  if (stories) stories.id = 'stories';
  function addHowItWorks() {
    if (!technology) return;
    const section = document.createElement('section'); section.id = 'how-it-works'; section.className = 'max-w-6xl mx-auto px-4 py-10 scroll-mt-16';
    section.innerHTML = '<div class="text-center mb-7"><span class="text-xs font-bold text-emerald-800 tracking-wider uppercase">HOW IT WORKS</span><h2 class="text-2xl font-extrabold text-emerald-950 mt-1">सफाई में साथ देने के 3 आसान कदम</h2></div><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm"><span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">1</span><h3 class="mt-3 text-sm font-bold">समस्या बताएं</h3><p class="mt-1 text-xs text-gray-500">स्थान, फोटो और जानकारी के साथ report भेजें।</p></div><div class="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm"><span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">2</span><h3 class="mt-3 text-sm font-bold">इलाके को जोड़ें</h3><p class="mt-1 text-xs text-gray-500">अपने ward या गांव की सफाई प्रगति देखें।</p></div><div class="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm"><span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">3</span><h3 class="mt-3 text-sm font-bold">बदलाव देखें</h3><p class="mt-1 text-xs text-gray-500">अपनी reports और community की stories पर नज़र रखें।</p></div></div>';
    technology.before(section);
  }
  addHowItWorks();

  function toast(message, tone = 'success') {
    const item = document.createElement('div');
    item.className = `toast fixed z-[70] right-4 bottom-4 max-w-sm rounded-xl px-4 py-3 text-sm shadow-xl ${tone === 'error' ? 'bg-red-700' : 'bg-emerald-800'} text-white`;
    item.setAttribute('role', 'status'); item.textContent = message;
    document.body.append(item); setTimeout(() => item.remove(), 3200);
  }
  function scrollTo(id) { const target = document.getElementById(id); target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function escape(text) { const el = document.createElement('div'); el.textContent = text; return el.innerHTML; }

  function modal(title, body) {
    closeModal();
    const wrapper = document.createElement('div');
    wrapper.id = 'app-modal'; wrapper.className = 'modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4';
    wrapper.innerHTML = `<div class="modal-panel w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="mb-5 flex items-center justify-between gap-4"><h2 id="modal-title" class="text-xl font-extrabold text-emerald-950">${title}</h2><button type="button" data-close aria-label="Close dialog" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100">×</button></div>${body}</div>`;
    wrapper.addEventListener('click', e => { if (e.target === wrapper || e.target.closest('[data-close]')) closeModal(); });
    document.body.append(wrapper); localizeDialog(wrapper); $('input, select, textarea', wrapper)?.focus();
  }
  function closeModal() { $('#app-modal')?.remove(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  const field = 'block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-600 focus:outline-none';

  function renderReports() {
    const host = $('#reports-list'); if (!host) return;
    const reports = loadReports();
    host.innerHTML = reports.length ? `<div class="space-y-3">${reports.map(r => `<article class="rounded-xl border border-gray-100 bg-[#fafbf8] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-gray-800">${escape(r.type)}</p><p class="mt-1 text-xs text-gray-500">${escape(r.location)} · ${escape(r.date)}</p></div><span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">Submitted</span></div><p class="mt-2 text-sm text-gray-600">${escape(r.description)}</p><p class="mt-2 text-[11px] font-semibold text-emerald-700">ID: ${escape(r.id)}</p></article>`).join('')}</div>` : '<div class="rounded-xl border border-dashed border-gray-200 bg-[#fafbf8] p-7 text-center"><p class="font-bold text-gray-700">अभी कोई रिपोर्ट नहीं है</p><p class="mt-1 text-xs text-gray-500">अपनी पहली सफाई रिपोर्ट भेजकर शुरुआत करें।</p><button data-new-report class="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">रिपोर्ट करें</button></div>';
    $('[data-new-report]', host)?.addEventListener('click', openReport);
  }
  const statusDetails = {
    NEW: { label: 'Submitted', note: 'Awaiting municipal review.', badge: 'bg-amber-100 text-amber-800', step: 1 },
    VERIFIED: { label: 'Verified', note: 'The municipality has verified your report.', badge: 'bg-blue-100 text-blue-800', step: 2 },
    ASSIGNED: { label: 'Team assigned', note: 'A cleanup team has been assigned.', badge: 'bg-violet-100 text-violet-800', step: 3 },
    IN_PROGRESS: { label: 'In progress', note: 'The cleanup team is working on this issue.', badge: 'bg-indigo-100 text-indigo-800', step: 3 },
    RESOLVED: { label: 'Resolved', note: 'This report has been marked as resolved.', badge: 'bg-emerald-100 text-emerald-800', step: 4 },
    REJECTED: { label: 'Closed', note: 'This report was closed by the municipality.', badge: 'bg-gray-200 text-gray-700', step: 4 }
  };
  function reportStatus(report) { return statusDetails[report.status] || statusDetails.NEW; }
  function reportTimeline(status) {
    const steps = ['Submitted', 'Verified', 'Assigned', 'Resolved'];
    return `<div class="mt-3"><div class="flex items-center justify-between text-[10px] font-semibold text-gray-500">${steps.map((step, index) => `<span class="${index + 1 <= status.step ? 'text-emerald-700' : ''}">${step}</span>`).join('')}</div><div class="mt-1 grid grid-cols-4 gap-1">${steps.map((_, index) => `<span class="h-1 rounded-full ${index + 1 <= status.step ? 'bg-emerald-600' : 'bg-gray-200'}"></span>`).join('')}</div></div>`;
  }
  function renderReports() {
    const host = $('#reports-list'); if (!host) return;
    const reports = loadReports();
    host.innerHTML = reports.length ? `<div class="space-y-3">${reports.map(report => {
      const status = reportStatus(report);
      return `<article class="rounded-xl border border-gray-100 bg-[#fafbf8] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-gray-800">${escape(report.type)}</p><p class="mt-1 text-xs text-gray-500">${escape(report.location)} &middot; ${escape(report.date || 'Today')}</p></div><span class="rounded-full px-2 py-1 text-[10px] font-bold ${status.badge}">${status.label}</span></div><p class="mt-2 text-sm text-gray-600">${escape(report.description)}</p><p class="mt-2 text-xs text-gray-500">${status.note}</p>${reportTimeline(status)}<div class="mt-3 flex items-center justify-between gap-3"><p class="text-[11px] font-semibold text-emerald-700">ID: ${escape(report.id)}</p><button type="button" data-delete-report="${escape(report.id)}" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">Delete report</button></div></article>`;
    }).join('')}</div>` : '<div class="rounded-xl border border-dashed border-gray-200 bg-[#fafbf8] p-7 text-center"><p class="font-bold text-gray-700">No reports yet</p><p class="mt-1 text-xs text-gray-500">Send your first cleanliness report to get started.</p><button data-new-report class="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Create report</button></div>';
    $('[data-new-report]', host)?.addEventListener('click', openReport);
    $$('[data-delete-report]', host).forEach(button => button.addEventListener('click', () => confirmDeleteReport(button.dataset.deleteReport)));
  }
  function confirmDeleteReport(id) {
    const report = loadReports().find(item => item.id === id);
    if (!report) return;
    modal('Delete report?', `<p class="text-sm text-gray-600">Delete <b>${escape(report.type)}</b> (${escape(report.id)})? This cannot be undone.</p><div class="mt-5 flex justify-end gap-3"><button type="button" data-close class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Keep report</button><button type="button" id="confirm-delete-report" class="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">Delete report</button></div>`);
    $('#confirm-delete-report')?.addEventListener('click', () => { if (deleteReport(id)) { closeModal(); renderReports(); toast('Report deleted.'); } });
  }
  function renderCitizenAnnouncements() {
    const host = $('#citizen-announcements');
    if (!host) return;
    const announcements = store.get('swachhSaathiAnnouncements', []);
    host.hidden = !announcements.length;
    host.innerHTML = announcements.slice(0, 3).map(item => `<article class="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Municipality announcement${item.target && item.target !== 'All' ? ` · ${escape(item.target)}` : ''}</p><h3 class="mt-1 text-sm font-extrabold text-emerald-950">${escape(item.title)}</h3><p class="mt-1 text-sm text-gray-700">${escape(item.message)}</p><p class="mt-2 text-[10px] text-emerald-700">Published ${escape(item.date || 'just now')}</p></article>`).join('');
  }
  function enableCitizenAlerts(button) {
    if (!('Notification' in window)) { toast('Browser alerts are not available on this device.', 'error'); return; }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') { localStorage.setItem('swachhSaathiCitizenAlerts', 'true'); button.textContent = 'Alerts enabled'; toast('Municipality alerts are enabled on this device.'); }
      else toast('Allow notifications in your browser settings to receive alerts.', 'error');
    });
  }
  function announcementSection() {
    const section = document.createElement('section'); section.id = 'citizen-announcements-section'; section.className = 'max-w-6xl mx-auto px-4 pt-8';
    section.innerHTML = '<div class="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div class="flex flex-wrap items-center justify-between gap-3"><div><span class="text-xs font-bold tracking-wider text-emerald-800">MUNICIPALITY UPDATES</span><h2 class="mt-1 text-xl font-extrabold text-emerald-950">Announcements for citizens</h2></div><button type="button" id="enable-citizen-alerts" class="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">Enable phone alerts</button></div><div id="citizen-announcements" class="mt-4 space-y-3"></div></div>';
    document.querySelector('footer')?.before(section); renderCitizenAnnouncements();
    $('#enable-citizen-alerts', section)?.addEventListener('click', event => enableCitizenAlerts(event.currentTarget));
  }
  function reportSection() {
    const section = document.createElement('section'); section.id = 'my-reports'; section.className = 'max-w-6xl mx-auto px-4 py-10 scroll-mt-16';
    section.innerHTML = '<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"><div class="flex items-center justify-between gap-4 mb-4"><div><span class="text-xs font-bold text-emerald-800 tracking-wider">MY REPORTS</span><h2 class="text-2xl font-extrabold text-emerald-950">मेरी शिकायतें</h2></div><button data-new-report class="bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-800">नई रिपोर्ट</button></div><div id="reports-list"></div></div>';
    document.querySelector('footer')?.before(section); renderReports();
    $('[data-new-report]', section).addEventListener('click', openReport);
  }
  function openReport() {
    modal('कूड़ा / समस्या बताएं', `<form id="report-form" class="space-y-4"><label class="block text-sm font-semibold text-gray-700">Waste / problem type<select required name="type" class="${field} mt-1"><option value="">चुनें</option><option>Garbage pile</option><option>Overflowing bin</option><option>Street cleaning</option><option>Drain / sanitation</option></select></label><label class="block text-sm font-semibold text-gray-700">Location / area<input required name="location" value="${escape(localStorage.getItem('swachhSaathiArea') || '')}" class="${field} mt-1" placeholder="e.g. Ward 4, Main Road"></label><label class="block text-sm font-semibold text-gray-700">Description<textarea required name="description" class="${field} mt-1" rows="3" placeholder="समस्या के बारे में लिखें"></textarea></label><label class="block text-sm font-semibold text-gray-700">Photo (optional)<input name="image" type="file" accept="image/*" class="mt-1 block w-full text-xs text-gray-600"></label><p id="form-error" class="hidden text-xs text-red-600"></p><button class="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Submit report</button></form>`);
    $('#report-form').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget); if (!f.get('type') || !f.get('location') || !f.get('description')) { const err = $('#form-error'); err.textContent = 'कृपया सभी जरूरी जानकारी भरें।'; err.classList.remove('hidden'); return; }
      const submit = $('button[type="submit"]', e.currentTarget); if (submit?.disabled) return; if (submit) submit.disabled = true;
      const report = createReport({ type: f.get('type'), location: f.get('location').trim(), description: f.get('description').trim(), image: f.get('image')?.name || '', date: new Date().toLocaleDateString('en-IN') }); e.currentTarget.reset(); closeModal(); renderReports(); scrollTo('my-reports'); toast(`${translate('messages.success')} (${report.id})`); });
  }
  document.addEventListener('swachh:report-issue', event => {
    openReport();
    const bin = window.SwachhMap?.loadDustbins?.().find(item => item.id === event.detail?.binId);
    const location = $('#report-form [name="location"]');
    const description = $('#report-form [name="description"]');
    if (bin && location) { location.value = bin.name; if (description) description.value = `Issue reported for ${bin.id}: `; }
  });
  function openArea() {
    const saved = localStorage.getItem('swachhSaathiArea') || '';
    modal('My Area', `<form id="area-form" class="space-y-4"><p class="text-sm text-gray-600">अपना गांव, वार्ड या locality चुनें। जानकारी आपके browser में सुरक्षित रहेगी।</p><label class="block text-sm font-semibold text-gray-700">Your area<input required name="area" value="${escape(saved)}" class="${field} mt-1" placeholder="e.g. Indira Nagar, Ward 5"></label><button class="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Save and view area</button></form>`);
    $('#area-form').addEventListener('submit', e => { e.preventDefault(); const value = new FormData(e.currentTarget).get('area').trim(); if (!value) return; localStorage.setItem('swachhSaathiArea', value); closeModal(); updateArea(value); scrollTo('my-area'); toast(`${value} saved as your area.`); });
  }
  function updateArea(name) { if (!area) return; const badge = $('span', area); if (badge) badge.textContent = `MY AREA · ${name}`; const caption = $('.absolute.bottom-4 span', hero); if (caption) caption.textContent = `📍 ${name} 91% साफ`; }
  function openAuth(kind) {
    const signup = kind === 'signup';
    modal(signup ? 'Create your account' : 'Login', `<form id="auth-form" class="space-y-4">${signup ? `<label class="block text-sm font-semibold text-gray-700">Name<input required name="name" class="${field} mt-1" autocomplete="name"></label>` : ''}<label class="block text-sm font-semibold text-gray-700">Email or mobile<input required name="identity" class="${field} mt-1" autocomplete="username"></label><label class="block text-sm font-semibold text-gray-700">Password<input required minlength="4" name="password" type="password" class="${field} mt-1" autocomplete="${signup ? 'new-password' : 'current-password'}"></label>${signup ? `<label class="block text-sm font-semibold text-gray-700">Confirm password<input required name="confirm" type="password" class="${field} mt-1" autocomplete="new-password"></label>` : ''}<p id="auth-error" class="hidden text-xs text-red-600"></p><button class="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">${signup ? 'Sign up' : 'Login'}</button></form>`);
    $('#auth-form').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget), error = $('#auth-error'); const identity = f.get('identity').trim(), password = f.get('password'); if (signup && password !== f.get('confirm')) { error.textContent = 'Passwords do not match.'; error.classList.remove('hidden'); return; } let user = store.get('swachhSaathiUser', null); if (signup) { user = { name: f.get('name').trim(), identity, password }; store.set('swachhSaathiUser', user); } else if (!user || user.identity !== identity || user.password !== password) { error.textContent = 'Incorrect details. Create an account first.'; error.classList.remove('hidden'); return; } sessionStorage.setItem('swachhSaathiSession', 'true'); closeModal(); updateAuth(); toast(signup ? 'Account created. You are now signed in.' : 'Welcome back!'); });
  }
  function updateAuth() { const user = store.get('swachhSaathiUser', null); if (!user || !sessionStorage.getItem('swachhSaathiSession')) return; const login = $('[data-auth="login"]'); if (login) { login.textContent = `HI, ${user.name?.split(' ')[0]?.toUpperCase() || 'SAATHI'}`; login.onclick = () => toast('You are signed in on this device.'); } }

  const translations = window.SwachhTranslations || {};
  let language = localStorage.getItem('swachhSaathiLanguage') || 'hi';
  const translate = key => key.split('.').reduce((value, part) => value?.[part], translations[language]) || key;
  function localizeDialog(wrapper) {
    const report = $('#report-form', wrapper), auth = $('#auth-form', wrapper);
    const setLabel = (form, name, key) => { const input = $(`[name="${name}"]`, form); const label = input?.closest('label'); if (label?.firstChild) label.firstChild.nodeValue = `${translate(key)} `; };
    if (report) { setLabel(report, 'type', 'forms.type'); setLabel(report, 'location', 'forms.location'); setLabel(report, 'description', 'forms.description'); setLabel(report, 'image', 'forms.photo'); const submit = $('button[type="submit"]', report) || $('button', report); if (submit) { submit.type = 'submit'; submit.textContent = translate('actions.submit'); } }
    if (auth) { setLabel(auth, 'name', 'forms.name'); setLabel(auth, 'identity', 'forms.email'); setLabel(auth, 'password', 'forms.password'); setLabel(auth, 'confirm', 'forms.confirm'); }
  }
  function replaceLanguageButton() {
    const oldButton = $('nav button');
    if (!oldButton || oldButton.id === 'language-toggle') return;
    const selector = document.createElement('div');
    selector.id = 'language-selector'; selector.className = 'relative';
    selector.innerHTML = '<button id="language-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="language-menu" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-gray-100 hover:bg-emerald-50 rounded text-gray-700 transition"><span id="selected-language"></span><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button><div id="language-menu" class="hidden absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-emerald-100 bg-white py-1 shadow-xl z-[80]" role="listbox" aria-label="Select language"></div>';
    oldButton.replaceWith(selector);
  }
  function closeLanguageMenu() { const menu = $('#language-menu'), toggle = $('#language-toggle'); menu?.classList.add('hidden'); toggle?.setAttribute('aria-expanded', 'false'); }
  function renderLanguageMenu() {
    const menu = $('#language-menu'); if (!menu) return;
    menu.innerHTML = Object.entries(translations).map(([code, item]) => `<button type="button" role="option" aria-selected="${code === language}" data-language="${code}" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-900"><span class="w-4 text-emerald-700">${code === language ? '✓' : ''}</span><span>${item.label}</span><span class="ml-auto text-[10px] text-gray-400">${code.toUpperCase()}</span></button>`).join('');
    $$('[data-language]', menu).forEach(option => option.addEventListener('click', () => { language = option.dataset.language; localStorage.setItem('swachhSaathiLanguage', language); applyLanguage(); closeLanguageMenu(); toast(translate('messages.saved')); }));
  }
  function applyLanguage() {
    const dictionary = translations[language] || translations.hi; if (!dictionary) return;
    document.documentElement.lang = language;
    $$('[data-i18n]').forEach(node => { const value = node.dataset.i18n.split('.').reduce((obj, part) => obj?.[part], dictionary); if (value) node.textContent = value; });
    const heroTitle = $('h1', hero), heroParagraphs = $$('p', hero);
    if (heroTitle) heroTitle.innerHTML = dictionary.heroHeading;
    if (heroParagraphs[1]) heroParagraphs[1].textContent = dictionary.heroDescription;
    if (heroParagraphs[2]) heroParagraphs[2].textContent = `👥 ${dictionary.sections.participation}`;
    const heroCtas = $$('button', hero);
    if (heroCtas[0]) heroCtas[0].innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i> ${dictionary.actions.report}`;
    if (heroCtas[1]) heroCtas[1].innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 text-red-500"></i> ${dictionary.actions.area}`;
    const navLogin = $('[data-auth="login"]'), navSignup = $('[data-auth="signup"]');
    if (navLogin && !sessionStorage.getItem('swachhSaathiSession')) navLogin.textContent = dictionary.actions.login;
    if (navSignup) navSignup.textContent = dictionary.actions.signup;
    const quickTitles = $$('h3', quick); if (quickTitles[0]) quickTitles[0].textContent = dictionary.actions.report; if (quickTitles[3]) quickTitles[3].textContent = dictionary.sections.reports; if (quickTitles[4]) quickTitles[4].textContent = dictionary.actions.area;
    const storiesTitle = $('h2', stories); if (storiesTitle) storiesTitle.textContent = dictionary.sections.stories;
    const howTitle = $('#how-it-works h2'); if (howTitle) howTitle.textContent = dictionary.sections.how;
    $('#selected-language').textContent = dictionary.label; renderLanguageMenu(); window.lucide?.createIcons();
  }
  function initializeLanguageSelector() {
    replaceLanguageButton(); applyLanguage();
    const toggle = $('#language-toggle'), menu = $('#language-menu');
    toggle?.addEventListener('click', () => { const opening = menu.classList.contains('hidden'); menu.classList.toggle('hidden'); toggle.setAttribute('aria-expanded', String(opening)); });
    toggle?.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); menu.classList.remove('hidden'); toggle.setAttribute('aria-expanded', 'true'); $('[data-language]', menu)?.focus(); } });
    document.addEventListener('click', event => { if (!$('#language-selector')?.contains(event.target)) closeLanguageMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLanguageMenu(); });
  }

  window.addEventListener('storage', event => {
    if (event.key !== 'swachhSaathiAnnouncements') return;
    renderCitizenAnnouncements();
    const latest = store.get('swachhSaathiAnnouncements', [])[0];
    if (!latest) return;
    toast(`New announcement: ${latest.title}`);
    if (localStorage.getItem('swachhSaathiCitizenAlerts') === 'true' && Notification.permission === 'granted') new Notification(latest.title, { body: latest.message, icon: 'favicon.ico' });
  });
  announcementSection();
  reportSection();
  if (localStorage.getItem('swachhSaathiArea')) updateArea(localStorage.getItem('swachhSaathiArea'));
  updateAuth();
  // Existing buttons and navigation retain their visual styling; this attaches behavior without changing the design.
  $$('nav a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const label = a.textContent.trim(); if (label === 'Home') scrollTo('home'); else if (label === 'My Area') openArea(); else if (label === 'Stories') scrollTo('stories'); else if (label === 'How It Works') scrollTo('how-it-works'); else if (label === 'My Reports') { renderReports(); scrollTo('my-reports'); } }));
  const mobileMenu = $('#mobile-menu'), menuToggle = $('#menu-toggle');
  menuToggle?.addEventListener('click', () => { const open = mobileMenu.classList.toggle('hidden'); menuToggle.setAttribute('aria-expanded', String(!open)); });
  $$('.mobile-navigation').forEach(a => a.addEventListener('click', e => { e.preventDefault(); mobileMenu.classList.add('hidden'); menuToggle?.setAttribute('aria-expanded', 'false'); const label = a.textContent.trim(); if (label === 'Home') scrollTo('home'); else if (label === 'My Area') openArea(); else if (label === 'Stories') scrollTo('stories'); else if (label === 'How It Works') scrollTo('how-it-works'); else { renderReports(); scrollTo('my-reports'); } }));
  // External footer links must keep their normal browser navigation behavior.
  $$('footer a[target="_blank"], footer a[href^="mailto:"]').forEach(link => link.addEventListener('click', event => event.stopImmediatePropagation(), true));
  const allButtons = $$('button');
  const login = $('[data-auth="login"]'); const signup = $('[data-auth="signup"]');
  login?.addEventListener('click', () => openAuth('login')); signup?.addEventListener('click', () => openAuth('signup'));
  // The first CTA pair is the report and area controls; the CTA banner is another report entry point.
  const heroButtons = $$('button', hero); heroButtons[0]?.addEventListener('click', openReport); heroButtons[1]?.addEventListener('click', openArea);
  const quickCards = $$('.grid > div', quick); quickCards.forEach((card, i) => { card.tabIndex = 0; card.setAttribute('role', 'button'); card.addEventListener('click', () => i === 1 || i === 4 ? openArea() : i === 3 ? (renderReports(), scrollTo('my-reports')) : openReport()); card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); }); });
  $$('button').filter(b => b.textContent.includes('❤️')).forEach(b => b.addEventListener('click', openReport));
  $$('.grid > div', stories).forEach(card => { card.tabIndex = 0; card.setAttribute('role', 'button'); card.addEventListener('click', () => modal('Community story', '<p class="text-sm text-gray-600">इस community की पहल ने स्थानीय लोगों को साथ लाकर क्षेत्र को साफ और बेहतर बनाया।</p>')); });
  $$('footer a').forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); if (i === 0) openReport(); else if (i === 2) { renderReports(); scrollTo('my-reports'); } else if (i === 3) scrollTo('stories'); else if (i === 5) openArea(); else toast('This prototype feature will be available soon.'); }));
  const hindi = allButtons.find(b => b.textContent.includes('à¤¹') || b.textContent.includes('हिंदी')); hindi?.addEventListener('click', () => toast('आप पहले से हिंदी अनुभव का उपयोग कर रहे हैं।'));
  initializeLanguageSelector();
})();
