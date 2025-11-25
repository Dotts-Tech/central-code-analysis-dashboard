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

        card.innerHTML = `
          <h3>${repo.toUpperCase()}</h3>

          <div class="sev-boxes">

            <div class="sev-item">
              <div class="square cri-box">${scan.violationCounts.sev1 || 0}</div>
              <div class="label">CRITICAL</div>
            </div>

            <div class="sev-item">
              <div class="square hi-box">${scan.violationCounts.sev2 || 0}</div>
              <div class="label">HIGH</div>
            </div>

            <div class="sev-item">
              <div class="square med-box">${scan.violationCounts.sev3 || 0}</div>
              <div class="label">MEDIUM</div>
            </div>

            <div class="sev-item">
              <div class="square low-box">${scan.violationCounts.sev5 || 0}</div>
              <div class="label">LOW</div>
            </div>

          </div>
        `;

        card.onclick = () => window.open(`data/${repo}.json`, '_blank');
        container.appendChild(card);

      } catch (err) {
        const errorCard = document.createElement('div');
        errorCard.className = 'card';
        errorCard.innerHTML = `<h3>${repo}</h3><p>Error loading data</p>`;
        container.appendChild(errorCard);
      }
    }

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
  }
}

loadDashboard();
