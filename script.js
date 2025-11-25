async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const index = await fetch('index.json').then(r => r.json());
    container.innerHTML = '';

    for (const file of index.repos) {
      const scan = await fetch(`data/${file}`).then(r => r.json());
      
      // create a card
      const card = document.createElement('div');
      card.style = "padding:12px;margin:10px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9";

      card.innerHTML = `
        <h3>${file.replace('.json','')}</h3>
        <p><strong>Total Violations:</strong> ${scan.summary ? scan.summary.critical + scan.summary.high + scan.summary.medium + scan.summary.low : 0}</p>
        <p>
          <strong>Critical:</strong> ${scan.summary?.critical || 0} &nbsp;
          <strong>High:</strong> ${scan.summary?.high || 0} &nbsp;
          <strong>Medium:</strong> ${scan.summary?.medium || 0} &nbsp;
          <strong>Low:</strong> ${scan.summary?.low || 0}
        </p>
      `;

      container.appendChild(card);
    }

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

loadDashboard();
