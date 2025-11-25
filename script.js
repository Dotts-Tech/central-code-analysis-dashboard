async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;

  try {
    const indexResp = await fetch('index.json');
    const reposObj = await indexResp.json();
    const repos = Array.isArray(reposObj) ? reposObj : Object.keys(reposObj);

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        console.log("Fetching:", `data/${repo}.json`);

        const scanResp = await fetch(`data/${repo}.json`);
        if (!scanResp.ok) throw new Error("File not found");

        const data = await scanResp.json();

        // Update summary totals
        totalCritical += data.violationCounts.sev1 || 0;
        totalHigh     += data.violationCounts.sev2 || 0;
        totalMedium   += data.violationCounts.sev3 || 0;
        totalLow      += data.violationCounts.sev5 || 0;

        // Create repo card
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.open(`data/${repo}.json`, '_blank');

        card.innerHTML = `
          <h3>${repo}</h3>
          <div class="violation-counts">
            <span class="critical">Critical: ${data.violationCounts.sev1 || 0}</span>
            <span class="high">High: ${data.violationCounts.sev2 || 0}</span>
            <span class="medium">Medium: ${data.violationCounts.sev3 || 0}</span>
            <span class="low">Low: ${data.violationCounts.sev5 || 0}</span>
          </div>
          <button class="view-details">View Details</button>
        `;

        container.appendChild(card);

      } catch (err) {
        console.error('Error loading repo:', repo, err);

        const errorCard = document.createElement('div');
        errorCard.className = 'card error';
        errorCard.innerHTML = `
          <h3>${repo}</h3>
          <p>Error loading data</p>
        `;
        container.appendChild(errorCard);
      }
    }

    // Update severity summary boxes
    document.getElementById("sevCritical").innerText = totalCritical;
    document.getElementById("sevHigh").innerText     = totalHigh;
    document.getElementById("sevMedium").innerText   = totalMedium;
    document.getElementById("sevLow").innerText      = totalLow;

  } catch (err) {
    container.innerHTML = '<p>Error loading dashboard.</p>';
    console.error(err);
  }
}

loadDashboard();
