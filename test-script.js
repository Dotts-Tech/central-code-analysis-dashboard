// test-script.js
// Builds animated colorful cards using central/data/test-index.json
// Requires Chart.js loaded in the page (CDN in HTML)

(async function(){
  const indexPath = 'data/test-index.json';
  const container = document.getElementById('card-container');
  const search = document.getElementById('search');
  const lastUpdatedEl = document.getElementById('last-updated');

  function makeEl(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text !== undefined) e.textContent = text; return e; }

  // Safe fetch utility
  async function fetchJson(path){
    try{
      const r = await fetch(path, {cache: "no-store"});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }catch(err){
      console.warn('fetchJson failed for', path, err);
      return null;
    }
  }

  // try multiple shapes for counts
  function extractCounts(testJson){
    if(!testJson) return {pass:0, fail:0, total:0};
    // common Salesforce shapes:
    // 1) result.summary.testsPassed / testsFailed
    const s = testJson.result?.summary || testJson.result?.summary || null;
    if(s && (s.testsPassed !== undefined || s.testsFailed !== undefined)){
      const pass = parseInt(s.testsPassed || 0);
      const fail = parseInt(s.testsFailed || 0);
      return {pass, fail, total: pass+fail};
    }
    // 2) result.summary.numTestsRun / numFailures
    if(s && (s.numTestsRun !== undefined)){
      const total = parseInt(s.numTestsRun||0);
      const fail = parseInt(s.numFailures || 0);
      const pass = total - fail;
      return {pass, fail, total};
    }
    // 3) result.tests[] array with Outcome property
    const arr = testJson.result?.tests || testJson.tests || null;
    if(Array.isArray(arr)){
      const pass = arr.filter(t => (t.Outcome||t.outcome||'').toLowerCase() === 'pass').length;
      const fail = arr.length - pass;
      return {pass, fail, total: arr.length};
    }
    // fallback: try top-level fields
    return {pass:0, fail:0, total:0};
  }

  // coverage percent extraction
  function extractCoverage(testJson){
    // many shapes - try plausible paths
    const covArr = testJson.result?.coverage?.coverage || testJson.result?.coverage || testJson.coverage || null;
    if(Array.isArray(covArr) && covArr.length){
      // compute average coverage %
      let sum=0, count=0;
      covArr.forEach(c=>{
        const covered = c.numLinesCovered || c.coveredLines || 0;
        const uncovered = c.numLinesUncovered || c.uncoveredLines || 0;
        if(covered+uncovered>0){ sum += (covered/(covered+uncovered))*100; count++; }
      });
      if(count>0) return Math.round(sum/count);
    }
    // maybe summary percent
    const overall = testJson.result?.summary?.codeCoverage || testJson.result?.summary?.coverage || null;
    if(typeof overall === 'number') return Math.round(overall);
    return null;
  }

  // create canvas id
  let chartCounter = 0;
  function createMiniChart(ctx, pass, fail){
    const id = 'c' + (chartCounter++);
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.className = 'canvas-sm';
    canvas.width = 160;
    canvas.height = 80;

    // Chart.js bar
    setTimeout(()=>{ // defer to allow insert into DOM
      try{
        new Chart(canvas.getContext('2d'), {
          type:'bar',
          data:{
            labels:['Pass','Fail'],
            datasets:[{
              label:'Tests',
              data:[pass, fail],
              backgroundColor: [ 'rgba(46,204,113,0.95)', 'rgba(231,76,60,0.95)' ],
              borderRadius: 6,
              barThickness: 16
            }]
          },
          options:{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{ display:false } },
            scales:{
              x:{ grid:{ display:false }, ticks:{ color:'#666' } },
              y:{ display:false, min:0 }
            },
            interaction:{ mode:'index', intersect:false }
          }
        });
      }catch(e){ console.warn('Chart error', e); }
    }, 10);

    return canvas;
  }

  // render single card
  async function renderCard(repo, entry){
    const card = makeEl('div','card');
    const head = makeEl('div','card-head');
    const title = makeEl('h3',null,repo);
    const badges = makeEl('div','repo-badges');

    // placeholders badges
    const badgePass = makeEl('div','badge small badge-pass','—');
    badgePass.classList.add('badge','pass');
    const badgeFail = makeEl('div','badge small badge-fail','—');
    badgeFail.classList.add('badge','fail');
    const badgeCov = makeEl('div','badge small badge-cover','—');
    badgeCov.classList.add('badge','cover');

    badges.appendChild(badgePass);
    badges.appendChild(badgeFail);
    badges.appendChild(badgeCov);

    head.appendChild(title);
    head.appendChild(badges);
    card.appendChild(head);

    // stats area
    const stats = makeEl('div','stats');
    const s1 = makeEl('div','stat'); s1.innerHTML = `<strong>—</strong><small>Pass</small>`;
    const s2 = makeEl('div','stat'); s2.innerHTML = `<strong>—</strong><small>Fail</small>`;
    const s3 = makeEl('div','stat'); s3.innerHTML = `<strong>—</strong><small>Total</small>`;
    stats.appendChild(s1); stats.appendChild(s2); stats.appendChild(s3);
    card.appendChild(stats);

    // chart
    const cw = makeEl('div','chart-wrap');
    const placeholder = createMiniChart(document,0,0);
    cw.appendChild(placeholder);
    card.appendChild(cw);

    // links row
    const links = makeEl('div','links');
    // JSON link
    if(entry.json){
      const a = makeEl('a','l-json', 'JSON');
      a.href = `data/${entry.json}`;
      a.target = '_blank';
      links.appendChild(a);
    }
    // pass/fail/coverage links
    if(entry.pass){
      const a = makeEl('a','l-pass','PASS'); a.href = `data/${entry.pass}`; a.target = '_blank'; links.appendChild(a);
    }
    if(entry.fail){
      const a = makeEl('a','l-fail','FAIL'); a.href = `data/${entry.fail}`; a.target = '_blank'; links.appendChild(a);
    }
    if(entry.coverage){
      const a = makeEl('a','l-coverage','COVERAGE'); a.href = `data/${entry.coverage}`; a.target = '_blank'; links.appendChild(a);
    }
    card.appendChild(links);

    // attach then fetch details to update
    container.appendChild(card);

    // fetch the JSON referenced
    let jsonPath = entry.json || entry['json'] || `${repo}.json`;
    const jsonData = await fetchJson(`data/${jsonPath}`);
    const counts = extractCounts(jsonData);
    const cov = extractCoverage(jsonData) ?? null;

    // update badges & stats
    badgePass.textContent = `✓ ${counts.pass||0}`;
    badgeFail.textContent = `✕ ${counts.fail||0}`;
    badgeCov.textContent = cov !== null ? `${cov}%` : '—';

    s1.innerHTML = `<strong>${counts.pass||0}</strong><small>Pass</small>`;
    s2.innerHTML = `<strong>${counts.fail||0}</strong><small>Fail</small>`;
    s3.innerHTML = `<strong>${counts.total||0}</strong><small>Total</small>`;

    // replace chart canvas
    cw.innerHTML = '';
    cw.appendChild(createMiniChart(null, counts.pass||0, counts.fail||0));
  }

  // load index and render all
  const index = await fetchJson(indexPath);
  if(!index || Object.keys(index).length === 0){
    container.innerHTML = `<div class="empty">No data found. Make sure <code>data/test-index.json</code> exists and is accessible.</div>`;
    return;
  }

  // last updated
  lastUpdatedEl.textContent = new Date().toLocaleString();

  // render all
  const repos = Object.keys(index).sort((a,b)=>a.localeCompare(b));
  for(const r of repos) await renderCard(r, index[r]);

  // search filter
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    const cards = Array.from(container.querySelectorAll('.card'));
    repos.forEach((repo, i) => {
      const card = cards[i];
      card.style.display = (!q || repo.toLowerCase().includes(q)) ? '' : 'none';
    });
  });

})();
