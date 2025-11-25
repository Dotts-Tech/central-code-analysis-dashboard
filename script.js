async function loadDashboard() {
  const container = document.getElementById('results');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const index = await fetch('index.json').then(r => r.json());

    container.innerHTML = '';

    for (const [repo, file] of Object.entries(index)) {
      try {
        const scan = await fetch(`data/${file}`).then(r => r.json());

        const card = document.createElement('div');
        card.className = 'card';

        // Compute total violations
        const total = scan.summary
          ? scan.summary.critical + scan.summary.high + scan.summary.medium + scan.summary.low
          : (scan.violations?.length || 0);

        // Create chart canvas
        const canvas = document.createElement('canvas');
        card.appendChild(canvas);

        // Chart.js pie chart for severity
        new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
              data: [
                scan.summary?.critical || 0,
                scan.summary?.high || 0,
                scan.summary?.medium || 0,
                scan.summary?.low || 0
              ],
              backgroundColor: ['#ff4d4f', '#faad14', '#1890ff', '#52c41a']
            }]
          },
          options: {
            plugins: { legend: { position: 'bottom' }, title: { display: true, text: `${repo} - Total Violations: ${total}` } }
          }
        });

        container.appendChild(card);

      } catch (innerError) {
        console.error('Error loading repo:', repo, innerError);
      }
    }

  } catch (error) {
    container.innerHTML = `<p>Error loading dashboard.</p>`;
    console.error('Dashboard load error:', error);
  }
}

loadDashboard();
