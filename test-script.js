// test-script.js
// Dynamic dashboard client for test-index.json and data/* artifacts
// - tries test-index.json then data/test-index.json
// - card shows fullName if present or key uppercase
// - modal with tabs: report / summary / charts
// - uses Chart.js (CDN included in HTML)

const grid = document.getElementById('grid');
const searchEl = document.getElementById('search');
const themeToggle = document.getElementById('themeToggle');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalSub = document.getElementById('modalSub');
const openNew = document.getElementById('openNew');
const closeModal = document.getElementById('closeModal');

const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');
const reportFrame = document.getElementById('reportFrame');
const summaryContent = document.getElementById('summaryContent');
const passFailCtx = document.getElementById('passFailChart');
const coverageCtx = document.getElementById('coverageChart');

let indexData = {};
let passFailChart = null;
let coverageChart = null;

// --- Load index ---
async function loadIndex() {
  const candidates = ['test-index.json', 'data/test-index.json'];
  for (const url of candidates) {
    try {
      const r = await fetch(url, {cache: 'no-cache'});
      if (!r.ok) continue;
      indexData = await r.json();
      console.log('Loaded index from', url);
      renderCards();
      return;
    } catch (e) { /* continue */ }
  }
  grid.innerHTML = '<div class="card"><div class="fullname">No index found</div><div class="muted">Place test-index.json or data/test-index.json in the repo root.</div></div>';
}

// --- Render cards ---
function renderCards() {
  grid.innerHTML = '';
  const q = (searchEl.value || '').toLowerCase();

  Object.keys(indexData).sort().forEach(key => {
    const entry = indexData[key];
    const fullName = entry.fullName || entry.name || key.toUpperCase();

    if (q && !fullName.toLowerCase().includes(q) && !key.toLowerCase().includes(q)) return;

    const card = document.createElement('div');
    card.className = 'card';

    const head = document.createElement('div');
    head.className = 'card-head';
    const nameEl = document.createElement('div');
    nameEl.className = 'fullname';
    nameEl.textContent = fullName;
    head.appendChild(nameEl);

    const short = document.createElement('div');
    short.className = 'muted';
    short.textContent = key;
    head.appendChild(short);

    card.appendChild(head);

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    //if (entry.json) actions.appendChild(createBtn('General JSON', 'json', () => openJsonSummary(entry.json, fullName, key)));
    if (entry.apex?.html) actions.appendChild(createBtn('Apex Report', 'html', () => openModal(entry.apex.html, fullName, key)));
    else if (entry.apex?.json) actions.appendChild(createBtn('Apex Reports', 'json', () => openJsonSummary(entry.apex.json, fullName, key)));

    if (entry.analyzer?.html) actions.appendChild(createBtn('Analyzer Report', 'html', () => openModal(entry.analyzer.html, fullName, key)));
    else if (entry.analyzer?.json) actions.appendChild(createBtn('Analyzer JSON', 'json', () => openJsonSummary(entry.analyzer.json, fullName, key)));

    card.appendChild(actions);
    grid.appendChild(card);
  });
}

// --- Button helper ---
function createBtn(label, kind, onClick) {
  const b = document.createElement('button');
  b.className = 'action-btn ' + (kind === 'html' ? 'html' : 'json');
  b.textContent = label;
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}

// --- Open modal (HTML report) ---
function openModal(path, title, repoKey) {
  modalTitle.textContent = title;
  modalSub.textContent = repoKey || '';
  openNew.style.display = 'inline-block';
  openNew.onclick = () => window.open(path, '_blank');

  reportFrame.src = path;
  showTabName('report');
  modalBackdrop.style.display = 'grid';
  document.body.classList.add('modal-open');
}

// --- Open modal (JSON summary + charts) ---
async function openJsonSummary(jsonPath, title, repoKey) {
  modalTitle.textContent = title;
  modalSub.textContent = repoKey || '';
  openNew.style.display = 'none';
  showTabName('summary');
  modalBackdrop.style.display = 'grid';
  document.body.classList.add('modal-open');

  try {
    const r = await fetch(jsonPath, {cache:'no-cache'});
    if (!r.ok) throw new Error('Failed to load JSON: ' + r.status);
    const j = await r.json();
    renderSummary(j);
    renderCharts(j);
  } catch (e) {
    summaryContent.innerHTML = `<div class="card"><div class="fullname">Error</div><div class="muted">${e.message}</div></div>`;
    showTabName('summary');
  }
}

// --- Summary renderer ---
function renderSummary(json) {
  const result = json.result || {};
  const testsArr = result.tests || result.testsRan || result.testResults || result.summary?.tests || [];
  const tests = Array.isArray(testsArr) ? testsArr : [];

  const pass = tests.filter(t => t.Outcome === 'Pass').length;
  const fail = tests.length - pass;

  const covList = result.coverage?.coverage || result.coverage || result.codeCoverage || [];
  let pctSum = 0;
  for (const c of covList) pctSum += (c.coveredPercent ?? c.coveragePercent ?? 0);
  const avgCoverage = covList.length ? Math.round(pctSum / covList.length) : 0;

  // colorful summary cards
  const summaryHtml = `
    <div class="summary-grid">
      <div class="card" style="background:#e0f7fa"><div class="fullname">Total Tests</div><div class="muted">${tests.length}</div></div>
      <div class="card" style="background:#d1fae5"><div class="fullname">Passed</div><div class="muted">${pass}</div></div>
      <div class="card" style="background:#ffe4e6"><div class="fullname">Failed</div><div class="muted">${fail}</div></div>
      <div class="card" style="background:#e0e7ff"><div class="fullname">Avg Coverage</div><div class="muted">${avgCoverage}%</div></div>
    </div>
  `;

  const coverageHtml = covList.map(c => {
    const name = c.name || c.ApexClassName || c.className || '-';
    const pct = (c.coveredPercent ?? c.coveragePercent ?? 0);
    const covered = (c.totalCovered ?? c.NumLinesCovered ?? 0);
    const uncovered = (c.totalUncovered ?? c.NumLinesUncovered ?? 0);
    const color = pct > 90 ? '#d1fae5' : pct > 70 ? '#fef3c7' : '#571828ff';
    return `<div class="card" style="margin-bottom:6px; background:${color}; padding:8px; border-radius:6px">
      <strong>${name}</strong> — ${pct}% (${covered} / ${uncovered})
    </div>`;
  }).join('');

  const failedHtml = tests.filter(t => t.Outcome !== 'Pass').map(t => {
    const className = t.ApexClass?.Name || t.testClassName || t.className || '-';
    const method = t.MethodName || t.methodName || t.name || '-';
    const msg = (t.Message || t.message || t.failureMessage || '').toString().replace(/\n/g,'<br>');
    return `<div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(0,0,0,0.04)">
      <strong>${className} → ${method}</strong><div class="muted">${msg}</div></div>`;
  }).join('') || '<div class="muted">No failed tests</div>';

  summaryContent.innerHTML = `
    ${summaryHtml}
    <h4 style="margin-top:12px">Coverage per Class</h4>
    <div>${coverageHtml}</div>
    <h4 style="margin-top:12px">Failed Tests</h4>
    <div>${failedHtml}</div>
  `;
}

// --- Charts renderer ---
function renderCharts(json) {
  const result = json.result || {};
  const testsArr = result.tests || result.testsRan || result.testResults || result.summary?.tests || [];
  const tests = Array.isArray(testsArr) ? testsArr : [];

  const pass = tests.filter(t => t.Outcome === 'Pass').length;
  const fail = tests.length - pass;

  const covList = result.coverage?.coverage || result.coverage || result.codeCoverage || [];
  const labels = covList.map(c => c.name || c.ApexClassName || c.className || 'Unknown');
  const values = covList.map(c => Number(c.coveredPercent ?? c.coveragePercent ?? 0));

  // --- Pass/Fail chart ---
  if (passFailChart) passFailChart.destroy();
  passFailChart = new Chart(passFailCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Pass', 'Fail'],
      datasets: [{
        label: 'Tests',
        data: [pass, fail],
        backgroundColor: [
          getComputedStyle(document.documentElement).getPropertyValue('--green') || '#22c55e',
          getComputedStyle(document.documentElement).getPropertyValue('--red') || '#ef4444'
        ]
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
  });

  // --- Coverage chart ---
  if (coverageChart) coverageChart.destroy();
  const barColors = values.map(v => v > 90 ? '#d1fae5' : v > 70 ? '#fef3c7' : '#ffe4e6');

  coverageChart = new Chart(coverageCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label:'Coverage %', data: values, backgroundColor: barColors }]
    },
    options: {
      indexAxis: 'y',
      responsive:true,
      scales: { x: { beginAtZero:true, max:100 } },
      plugins: { legend:{display:false} }
    }
  });

  showTabName('charts');
}

// --- Tabs ---
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  showTabName(t.dataset.tab);
}));

function showTabName(name) {
  contents.forEach(c => c.classList.remove('active'));
  const el = document.querySelector(`[data-tab-content="${name}"]`);
  if (el) el.classList.add('active');
}

// --- Modal close ---
closeModal.addEventListener('click', () => {
  modalBackdrop.style.display = 'none';
  reportFrame.src = '';
  document.body.classList.remove('modal-open');
});

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal.click();
});

// --- Search ---
searchEl.addEventListener('input', renderCards);

// --- Theme toggle ---
themeToggle.addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// --- Bootstrap ---
loadIndex();
