async function loadDashboard() {
  const dataFolder = 'data/';
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    // Fetch directory listing
    const repoIndex = await fetch(dataFolder).then(r => r.text());
    const repoMatches = [...repoIndex.matchAll(/href="([^"]+)\/"/g)].map(m => m[1]);

    container.innerHTML = '';

    for (const repo of repoMatches) {
      try {
        const scanIndex = await fetch(`${dataFolder}${repo}/`).then(r => r.text());
        const files = [...scanIndex.matchAll(/href="([^"]+\.json)"/g)].map(m => m[1]);

        if (files.length === 0) continue;

        // Latest result.json
        const latest = files.sort().reverse()[0];
        const scan = await fetch(`${dataFolder}${repo}/${latest}`).then(r => r.json());

        // Create card
        const card = document.createElement('div');
        card.style = "padding:12px;margin:10px;border:1px solid #ddd;border-radius:6px;";

        card.innerHTML = `
          <h3>${repo}</h3>
          <p><strong>Latest Scan:</strong> ${latest}</p>
          <p><strong>Total Violations:</strong> 
            ${(scan.violations?.length) || 
              (scan.summary 
                ? scan.summary.critical + scan.summary.high + scan.summary.medium + scan.summary.low
                : 0)}
          </p>
          <p>
            <strong>Critical:</strong> ${scan.summary?.critical || 0} &nbsp; 
            <strong>High:</strong> ${scan.summary?.high || 0} &nbsp; 
            <strong>Medium:</strong> ${scan.summary?.medium || 0} &nbsp; 
            <strong>Low:</strong> ${scan.summary?.low || 0}
          </p>
        `;

        container.appendChild(card);

      } catch (innerError) {
        console.error('Error loading repo:', repo, innerError);
      }
    }

  } catch (outerError) {
    container.innerHTML = `<p>Error loading dashboard.</p>`;
    console.error('Dashboard load error:', outerError);
  }
}

loadDashboard();
