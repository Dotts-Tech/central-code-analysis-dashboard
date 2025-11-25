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

        const totalViolations = scan.violations?.length ||
          ((scan.summary?.critical || 0) +
           (scan.summary?.high || 0) +
           (scan.summary?.medium || 0) +
           (scan.summary?.low || 0));

        // Create card
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.json`, '_blank');

      card.innerHTML = `
  <h3>${repo}</h3>
  <div class="violation-counts">
    <span class="critical">Critical: ${scan.violationCounts.sev1 || 0}</span>
    <span class="high">High: ${scan.violationCounts.sev2 || 0}</span>
    <span class="medium">Medium: ${scan.violationCounts.sev3 || 0}</span>
    <span class="low">Low: ${scan.violationCounts.sev5 || 0}</span>
  </div>
  <button class="view-details">View Details</button>
`;

        container.appendChild(card);

      } catch (err) {
        console.error('Error loading repo:', repo, err);
        const errorCard = document.createElement('div');
        errorCard.className = 'card error';
        errorCard.innerHTML = `<h3>${repo}</h3><p>Error loading data</p>`;
        container.appendChild(errorCard);
      }
    }

    if (repos.length === 0) {
      container.innerHTML = '<p>No repositories found in index.json</p>';
    }

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

loadDashboard();
