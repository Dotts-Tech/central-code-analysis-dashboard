async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const indexResp = await fetch('index.json');
    if (!indexResp.ok) throw new Error('index.json not found');
    const reposObj = await indexResp.json();
    const repos = Array.isArray(reposObj) ? reposObj : Object.keys(reposObj);

    container.innerHTML = '';

    for (const repo of repos) {
      try {
        console.log(`Fetching data/${repo}.json`);
        const scan = await fetch(`data/${repo}.json`).then(r => r.json());

        const template = document.getElementById('card-template');
        const card = template.content.cloneNode(true).querySelector('.card');

        card.querySelector('.repo-name').textContent = repo;
        card.querySelector('.critical').textContent = `Critical: ${scan.violationCounts.sev1 || 0}`;
        card.querySelector('.high').textContent = `High: ${scan.violationCounts.sev2 || 0}`;
        card.querySelector('.medium').textContent = `Medium: ${scan.violationCounts.sev3 || 0}`;
        card.querySelector('.low').textContent = `Low: ${scan.violationCounts.sev5 || 0}`;

        card.querySelector('.view-details').onclick = () => window.open(`data/${repo}.json`, '_blank');

        // Pie chart
        const ctx = card.querySelector('.pie-chart').getContext('2d');
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
              data: [
                scan.violationCounts.sev1 || 0,
                scan.violationCounts.sev2 || 0,
                scan.violationCounts.sev3 || 0,
                scan.violationCounts.sev5 || 0
              ],
              backgroundColor: ['#ff4c4c', '#ff914d', '#ffd14c', '#4caf50']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: { enabled: true }
            }
          }
        });

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
