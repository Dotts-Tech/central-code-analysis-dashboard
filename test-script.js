async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const indexResp = await fetch('test-index.json');
    const reposObj = await indexResp.json();
    const repos = Array.isArray(reposObj) ? reposObj : Object.keys(reposObj);

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        const scan = await fetch(`data/${repo}.json`).then(r => r.json());

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.html`, '_blank');

        card.innerHTML = `
          <div class="repo-name">${repo.toUpperCase()}</div>

          <div class="violation-boxes">
            <div class="box critical-box">${scan.violationCounts.sev1 || 0}</div>
            <div class="box high-box">${scan.violationCounts.sev2 || 0}</div>
            <div class="box medium-box">${scan.violationCounts.sev3 || 0}</div>
            <div class="box low-box">${scan.violationCounts.sev4 || 0}</div>
            <div class="box info-box">${scan.violationCounts.sev5 || 0}</div>
          </div>
<div class="labels">
  <span>CRITICAL</span>
  <span>HIGH</span>
  <span>MEDIUM</span>
  <span>LOW</span>
  <span>INFO</span>
</div>
        `;

        container.appendChild(card);

      } catch (err) {
        console.error('Error loading repo:', repo, err);

        const errorCard = document.createElement('div');
        errorCard.className = 'card';
        errorCard.innerHTML = `
          <h3>${repo}</h3>
          <p>Error loading data</p>
        `;
        container.appendChild(errorCard);
      }
    }

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

loadDashboard();
