document.addEventListener('DOMContentLoaded', function () {

    /* =========================
       DOM ELEMENTS
    ========================== */
    const dashboardContent = document.getElementById('dashboard-content');
    const modal = document.getElementById('report-modal');
    const reportFrame = document.getElementById('report-frame');
    const closeButton = document.querySelector('.close-button');

    /* =========================
       MODAL FUNCTIONS
    ========================== */
    function openModal(reportUrl) {
        if (!reportUrl) return;
        reportFrame.src = reportUrl;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        reportFrame.src = '';
    }

    // Close button click
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // Close modal on outside click
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close modal on ESC key
    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    /* =========================
       DASHBOARD RENDER
    ========================== */
    function renderDashboard() {
        dashboardContent.className = 'loading';
        dashboardContent.innerHTML =
            '<div class="loading">Loading analysis results...</div>';

        const cacheBust = new Date().getTime();
        const indexUrl = `test-index.json?t=${cacheBust}`;

        fetch(indexUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                dashboardContent.innerHTML = '';
                dashboardContent.className = 'dashboard-grid';

                const repos = Object.keys(data || {});
                if (repos.length === 0) {
                    dashboardContent.innerHTML =
                        '<p style="grid-column:1/-1;text-align:center;">No analysis results found.</p>';
                    return;
                }

                repos.sort();

                repos.forEach(repoName => {
                    const card = createRepoCard(repoName, data[repoName]);
                    dashboardContent.appendChild(card);
                });
            })
            .catch(error => {
                console.error(error);
                dashboardContent.className = 'error';
                dashboardContent.innerHTML = `
                    <p>Failed to load <code>test-index.json</code></p>
                    <details>
                        <summary>Error details</summary>
                        <pre>${error.message}</pre>
                    </details>
                `;
            });
    }

    /* =========================
       CREATE REPO CARD
    ========================== */
    function createRepoCard(repoName, repoData = {}) {
        const card = document.createElement('div');
        card.className = 'repo-card';

        const updated = repoData.updated
            ? new Date(repoData.updated).toLocaleString()
            : 'Unknown';

        card.innerHTML = `
            <h2>${repoName}</h2>
            <p>Last Updated: ${updated}</p>
        `;

        /* ----- Stats ----- */
        const statsDiv = document.createElement('div');
        statsDiv.className = 'summary-stats';
        statsDiv.innerHTML = '<strong>Quick Stats:</strong> Loading...';
        card.appendChild(statsDiv);

        /* ----- Links ----- */
        const linksDiv = document.createElement('div');
        linksDiv.className = 'links';

        if (repoData.apex?.html) {
            const apexBtn = document.createElement('button');
            apexBtn.className = 'view-button';
            apexBtn.textContent = 'View Apex Tests';
            apexBtn.onclick = () => openModal(repoData.apex.html);
            linksDiv.appendChild(apexBtn);
        }

        if (repoData.analyzer?.html) {
            const analyzerBtn = document.createElement('button');
            analyzerBtn.className = 'view-button analyzer';
            analyzerBtn.textContent = 'View Code Analysis';
            analyzerBtn.onclick = () => openModal(repoData.analyzer.html);
            linksDiv.appendChild(analyzerBtn);
        }

        card.appendChild(linksDiv);

        /* ----- Fetch Apex Stats ----- */
        if (repoData.apex?.json) {
            const cacheBust = new Date().getTime();
            fetch(`${repoData.apex.json}?t=${cacheBust}`)
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(json => {
                    const summary = json?.result?.summary || {};
                    statsDiv.innerHTML = `
                        <strong>Quick Stats:</strong>
                        <span class="pass">${summary.passing || 0} Passed</span> |
                        <span class="fail">${summary.failing || 0} Failed</span>
                    `;
                })
                .catch(() => {
                    statsDiv.innerHTML =
                        '<strong>Quick Stats:</strong> Not available';
                });
        } else {
            statsDiv.innerHTML =
                '<strong>Quick Stats:</strong> Not available';
        }

        return card;
    }

    /* =========================
       INIT
    ========================== */
    renderDashboard();
});
