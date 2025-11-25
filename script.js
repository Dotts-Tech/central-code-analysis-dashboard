async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    // Fetch index.json
    const indexResp = await fetch('index.json');
    const reposObj = await indexResp.json();

    // If index.json is an object, get its keys; otherwise use array directly
    const repos = Array.isArray(reposObj) ? reposObj : Object.keys(reposObj);

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        const scan = await fetch(`data/${repo}.json`).then(r => r.json());

        // Calculate total violations safely
        const totalViolations = scan.violations?.length ||
          ((scan.summary?.critical || 0) +
           (scan.summary?.high || 0) +
           (scan.summary?.medium || 0) +
           (scan.summary?.low || 0));

        const safeWidth = (count) => totalViolations ? (count / totalViolations * 100) : 0;

        // Create card
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.json`, '_blank');

        card.innerHTML = `
          <h3>${repo}</h3>
          <p>Total Violations: ${totalViolations}</p>
          <div class="bar critical" style="width:${safeWidth(scan.summary?.critical || 0)}%"></div>
          <div class="bar high" style="width:${safeWidth(scan.summary?.high || 0)}%"></div>
          <div class="bar medium" style="width:${safeWidth(scan.summary?.medium || 0)}%"></div>
          <div class="bar low" style="width:${safeWidth(scan.summary?.low || 0)}%"></div>
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

    // If no repos found
    if (repos.length === 0) {
      container.innerHTML = '<p>No repositories found in index.json</p>';
    }

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

// Load dashboard on page load
loadDashboard();
