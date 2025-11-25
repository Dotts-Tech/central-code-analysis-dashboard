async function loadIndex() {
  try {
    const r = await fetch("index.json");
    if (!r.ok) throw new Error("index.json missing");
    const data = await r.json();
    return data.repos;
  } catch (e) {
    console.error(e);
    document.getElementById("summary").innerHTML =
      "<h2>Error loading index.json</h2>";
    return [];
  }
}

async function loadRepo(repo) {
  try {
    const res = await fetch(`data/${repo}.json`);
    if (!res.ok) throw new Error(`${repo}.json missing`);
    return await res.json();
  } catch (err) {
    console.warn("Missing JSON:", repo);
    return null;
  }
}

function makePieChart(canvasId, data) {
  new Chart(document.getElementById(canvasId), {
    type: "pie",
    data: {
      labels: ["sev2", "sev5"],
      datasets: [
        {
          data: [data.violationCounts.sev2, data.violationCounts.sev5]
        }
      ]
    }
  });
}

async function init() {
  const repos = await loadIndex();
  const container = document.getElementById("repo-cards");

  repos.forEach(async (repo) => {
    const data = await loadRepo(repo);

    const card = document.createElement("div");
    card.className = "card";

    if (!data) {
      card.classList.add("error");
      card.innerHTML = `<h3>${repo}</h3><p>Error loading data</p>`;
      container.appendChild(card);
      return;
    }

    const canvasId = `${repo}-chart`;

    card.innerHTML = `
      <h3>${repo}</h3>
      <p><strong>Total:</strong> ${data.violationCounts.total}</p>
      <canvas id="${canvasId}"></canvas>
    `;

    container.appendChild(card);
    makePieChart(canvasId, data);
  });
}

init();
