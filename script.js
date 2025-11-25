async function loadDashboard() {
  const container = document.getElementById('dashboard');
  container.innerHTML = 'Loading...';

  try {
    // Fetch index.json
    const indexResp = await fetch('index.json');
    const indexData = await indexResp.json();

    container.innerHTML = '';

    for (const repo of Object.keys(indexData)) {
      const fileName = indexData[repo];
      const scanResp = await fetch(`data/${fileName}`);
      const scan = await scanResp.json();

      // Calculate total violations
      const summary = scan.summary || {};
      const total = (summary.critical||0) + (summary.high||0) + (summary.medium||0) + (summary.low||0);

      // Create card
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h2>${repo}</h2>
        <p>Total Violations: <strong>${total}</strong></p>
        <canvas id="chart-${repo}"></canvas>`;

      container.appendChild(card);

      // Chart
      const ctx = card.querySelector(`#chart-${repo}`).getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Violations',
            data: [summary.critical||0, summary.high||0, summary.medium||0, summary.low||0],
            backgroundColor: ['#ff4d4f','#fa8c16','#ffd666','#73d13d']
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

  } catch (err) {
    container.innerHTML = 'Error loading dashboard.';
    console.error(err);
  }
}

loadDashboard();
