async function loadDashboard() {
  const container = document.getElementById("results");

  try {
    const indexHtml = await fetch("data/").then(r => r.text());
    const repoNames = [...indexHtml.matchAll(/href="([^"]+)\/"/g)].map(m => m[1]);

    container.innerHTML = "";

    for (const repo of repoNames) {
      try {
        const scanIndex = await fetch(`data/${repo}/`).then(r => r.text());
        const files = [...scanIndex.matchAll(/href="([^"]+\.json)"/g)].map(m => m[1]);

        if (files.length === 0) continue;

        const latest = files.sort().reverse()[0];
        const scan = await fetch(`data/${repo}/${latest}`).then(r => r.json());

        const card = document.createElement("div");
        card.style = "padding:12px;margin:10px;border:1px solid #ccc;border-radius:8px;";
        card.innerHTML = `
          <h3>${repo}</h3>
          <p><b>Latest Scan:</b> ${latest}</p>
          <p><b>Total Violations:</b> ${scan.violations?.length || 0}</p>
          <p><b>Critical:</b> ${scan.summary?.critical || 0} |
             <b>High:</b> ${scan.summary?.high || 0} |
             <b>Medium:</b> ${scan.summary?.medium || 0} |
             <b>Low:</b> ${scan.summary?.low || 0}
          </p>
        `;
        container.appendChild(card);
      } catch (e) {
        console.log("Error loading repo", repo, e);
      }
    }
  } catch (e) {
    container.innerHTML = "Error loading dashboard";
  }
}

loadDashboard();
