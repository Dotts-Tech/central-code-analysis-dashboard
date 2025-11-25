async function loadData() {
    try {
        const res = await fetch("./data/identiscents.json");

        if (!res.ok) throw new Error("Cannot load JSON");

        const data = await res.json();

        document.getElementById("errorBox").style.display = "none";

        // Severity Mapping
        const critical = data.violationCounts.sev1 || 0;
        const high = data.violationCounts.sev2 || 0;
        const medium = data.violationCounts.sev3 || 0;
        const low = data.violationCounts.sev5 || 0;
        const total = data.violationCounts.total || 0;

        document.getElementById("totalViolations").innerText = total;
        document.getElementById("criticalCount").innerText = critical;
        document.getElementById("highCount").innerText = high;
        document.getElementById("mediumCount").innerText = medium;
        document.getElementById("lowCount").innerText = low;

        buildCharts(critical, high, medium, low);

    } catch (e) {
        document.getElementById("errorBox").style.display = "block";
    }
}

function buildCharts(c, h, m, l) {

    // 1. Trend Chart (Sample)
    new Chart(document.getElementById("trendChart"), {
        type: "bar",
        data: {
            labels: ["Scan 1", "Scan 2", "Scan 3", "Scan 4"],
            datasets: [{
                label: "Violations",
                data: [4, 7, 5, 7],
            }]
        },
        options: { responsive: true }
    });

    // 2. Sparkline Chart (Sample)
    new Chart(document.getElementById("sparkChart"), {
        type: "line",
        data: {
            labels: ["1","2","3","4","5","6","7","8","9","10","11","12"],
            datasets: [{
                data: [2,3,2,5,4,4,6,7,3,5,6,7],
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    // 3. Severity Spread (No donut – simple bar)
    new Chart(document.getElementById("severityChart"), {
        type: "bar",
        data: {
            labels: ["Critical", "High", "Medium", "Low"],
            datasets: [{
                data: [c, h, m, l]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

loadData();
