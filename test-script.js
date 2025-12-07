// Theme toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  // Load test and coverage data
  fetch('data/barnes-results.json')
    .then(r => r.json())
    .then(json => {
      renderSummary(json);
      renderTests(json.result?.tests || []);
      renderCoverage(json.result?.coverage?.coverage || [], json.result?.summary);
      initFilters();
    })
    .catch(err => console.error('Error loading barnes-results.json:', err));
});

// Summary header
function renderSummary(json) {
  const s = json.result?.summary || {};
  const el = document.getElementById('summary');
  el.textContent = `Tests Ran: ${s.testsRan ?? '-'} | Pass Rate: ${s.passRate ?? '-'} | Fail Rate: ${s.failRate ?? '-'} | Org Coverage: ${s.orgWideCoverage ?? '-'} | Test Run Coverage: ${s.testRunCoverage ?? '-'}`;
}

// Tests table
function renderTests(tests) {
  const body = document.getElementById('tests-body');
  body.innerHTML = '';
  tests.forEach(t => {
    const tr = document.createElement('tr');
    tr.className = (t.Outcome === 'Pass' ? 'pass' : 'fail');
    tr.dataset.outcome = t.Outcome;
    tr.dataset.class = t.ApexClass?.Name?.toLowerCase() || '';

    tr.innerHTML = `
      <td>${safe(t.ApexClass?.Name)}</td>
      <td>${safe(t.MethodName)}</td>
      <td>${safe(t.Outcome)}</td>
      <td>${safe(t.Message)}</td>
      <td>${safe(t.StackTrace)}</td>
    `;
    body.appendChild(tr);
  });
}

// Coverage table
function renderCoverage(coverageEntries, summary) {
  const body = document.getElementById('coverage-body');
  body.innerHTML = '';

  if (coverageEntries.length > 0) {
    let totalC = 0, totalU = 0;
    coverageEntries.forEach(c => {
      const covered = c.NumLinesCovered;
      const uncovered = c.NumLinesUncovered;
      const total = covered + uncovered;
      const pct = total === 0 ? 0 : Math.round((covered * 100) / total);

      totalC += covered; totalU += uncovered;

      const tr = document.createElement('tr');
      tr.className = pct >= 90 ? 'high' : (pct >= 50 ? 'medium' : 'low');
      tr.dataset.coverageBucket = tr.className;
      tr.dataset.class = (c.name || '').toLowerCase();

      tr.innerHTML = `
        <td>${safe(c.name)}</td>
        <td>${covered}</td>
        <td>${uncovered}</td>
        <td>${pct}%</td>
      `;
      body.appendChild(tr);
    });

    const overall = document.createElement('tr');
    const total = totalC + totalU;
    const overallPct = total === 0 ? 0 : Math.round((totalC * 100) / total);
    overall.innerHTML = `
      <td><b>Overall Coverage</b></td>
      <td>${totalC}</td>
      <td>${totalU}</td>
      <td>${overallPct}%</td>
    `;
    body.appendChild(overall);
  } else {
    const orgRow = document.createElement('tr');
    orgRow.innerHTML = `<td><b>Org Wide Coverage</b></td><td colspan="3">${safe(summary?.orgWideCoverage)}</td>`;
    body.appendChild(orgRow);

    const runRow = document.createElement('tr');
    runRow.innerHTML = `<td><b>Test Run Coverage</b></td><td colspan="3">${safe(summary?.testRunCoverage)}</td>`;
    body.appendChild(runRow);
  }
}

// Filters
function initFilters() {
  const classInput = document.getElementById('filter-class');
  const outcomeSelect = document.getElementById('filter-outcome');
  const coverageSelect = document.getElementById('filter-coverage');

  const applyFilters = () => {
    const classTerm = classInput.value.trim().toLowerCase();
    const outcome = outcomeSelect.value;
    const coverageBucket = coverageSelect.value;

    // Filter tests
    document.querySelectorAll('#tests-body tr').forEach(tr => {
      const matchesClass = !classTerm || tr.dataset.class.includes(classTerm);
      const matchesOutcome = !outcome || tr.dataset.outcome === outcome;
      tr.style.display = (matchesClass && matchesOutcome) ? '' : 'none';
    });

    // Filter coverage
    document.querySelectorAll('#coverage-body tr').forEach(tr => {
      if (!tr.dataset) return;
      const matchesClass = !classTerm || (tr.dataset.class || '').includes(classTerm);
      const matchesBucket = !coverageBucket || (tr.dataset.coverageBucket || '') === coverageBucket;
      if (!tr.dataset.class && !tr.dataset.coverageBucket) { tr.style.display = ''; return; }
      tr.style.display = (matchesClass && matchesBucket) ? '' : 'none';
    });
  };

  classInput.addEventListener('input', applyFilters);
  outcomeSelect.addEventListener('change', applyFilters);
  coverageSelect.addEventListener('change', applyFilters);
}

// Safe text helper
function safe(val) {
  if (!val) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
