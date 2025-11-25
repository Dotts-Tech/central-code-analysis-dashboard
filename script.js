fetch("identiscents.json")
  .then((res) => res.json())
  .then((data) => {
    document.getElementById("sevCritical").textContent = data.violationCounts.sev1;
    document.getElementById("sevHigh").textContent = data.violationCounts.sev2;
    document.getElementById("sevMedium").textContent = data.violationCounts.sev3;
    document.getElementById("sevLow").textContent = data.violationCounts.sev4;

    const tbody = document.querySelector("#violationTable tbody");
    tbody.innerHTML = "";

    Object.entries(data.violationCounts).forEach(([key, value]) => {
      if (key !== "total") {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${key}</td>
          <td>${key.toUpperCase()}</td>
          <td>${value}</td>
        `;
        tbody.appendChild(row);
      }
    });

    document.getElementById("jsonPanel").textContent =
      JSON.stringify(data, null, 2);
  });
