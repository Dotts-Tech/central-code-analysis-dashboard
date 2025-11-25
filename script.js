async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const indexResp = await fetch('index.json');
    const reposObj = await indexResp.json();
    const repos = Array.isArray(reposObj) ? reposObj : Object.keys(reposObj);

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        const scan = await fetch(`data/${repo}.json`).then(r => r.json());

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.json`, '_blank');

        card.innerHTML = `
          <h3 style="text-align:center">${repo}</h3>

          <div class="violation-boxes">
            <div class="box critical-box">${scan.violationCounts.sev1 || 0}</div>
            <div class="box high-box">${scan.violationCounts.sev2 || 0}</div>
            <div class="box medium-box">${scan.violationCounts.sev3 || 0}</div>
            <div class="box low-box">${scan.violationCounts.sev5 || 0}</div>
          </div>

          <div class="labels">
            <span>Critical</span>
            <span>High</span>
            <span>Medium</span>
            <span>Low</span>
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
