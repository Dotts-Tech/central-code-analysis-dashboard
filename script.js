async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const indexResp = await fetch('index.json');
    const repos = await indexResp.json();  // Array of repo names

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        const scan = await fetch(`data/${repo}.json`).then(r => r.json());

        const totalViolations = scan.violations?.length || 
          (scan.summary ? scan.summary.critical + scan.summary.high + scan.summary.medium + scan.summary.low : 0);

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.json`, '_blank'); // open details in new tab

        card.innerHTML = `
          <h3>${repo}</h3>
          <p>Total Violations: ${totalViolations}</p>
          <div class="bar critical" style="width:${(scan.summary?.critical || 0) / totalViolations * 100}%"></div>
          <div class="bar high" style="width:${(scan.summary?.high || 0) / totalViolations * 100}%"></div>
          <div class="bar medium" style="width:${(scan.summary?.medium || 0) / totalViolations * 100}%"></div>
          <div class="bar low" style="width:${(scan.summary?.low || 0) / totalViolations * 100}%"></div>
        `;
        container.appendChild(card);

      } catch(err) {
        console.error('Error loading repo:', repo, err);
      }
    }
  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

loadDashboard();
