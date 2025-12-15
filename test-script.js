document.addEventListener('DOMContentLoaded', function() {
    const dashboardContent = document.getElementById('dashboard-content');
    const modal = document.getElementById('report-modal');
    const reportFrame = document.getElementById('report-frame');
    const closeButton = document.querySelector('.close-button');

    // --- MODAL FUNCTIONS ---
    function openModal(reportUrl) {
        reportFrame.src = reportUrl;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        reportFrame.src = ''; // Clear the iframe src
    }

    closeButton.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    };

    // --- DASHBOARD RENDERING ---
    function renderDashboard() {
        dashboardContent.innerHTML = '<div class="loading">Loading analysis results...</div>';
        dashboardContent.className = 'loading';

        // Use cache-busting to get the latest data
        const cacheBust = new Date().getTime();
        const indexUrl = `test-index.json?t=${cacheBust}`;

        fetch(indexUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                dashboardContent.innerHTML = ''; // Clear loading message
                dashboardContent.className = 'dashboard-grid';

                const repos = Object.keys(data);
                if (repos.length === 0) {
                    dashboardContent.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No analysis results found.</p>';
                    return;
                }

                // Sort repositories alphabetically
                repos.sort();

                repos.forEach(repoName => {
                    const repoData = data[repoName];
                    const card = createRepoCard(repoName, repoData);
                    dashboardContent.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error fetching or parsing test-index.json:', error);
                dashboardContent.className = 'error';
                dashboardContent.innerHTML = `Failed to load dashboard data. Please ensure <code>test-index.json</code> exists and is valid JSON. <br><br> <details> <summary>Error Details</summary> <pre>${error.message}</pre> </details>`;
            });
    }

    function createRepoCard(repoName, repoData) {
        const card = document.createElement('div');
        card.className = 'repo-card';

        // Title and subtitle
        card.innerHTML += `
            <h2>${repoName}</h2>
            <p>Last Updated: ${new Date(repoData.updated).toLocaleString()}</p>
        `;

        // Summary stats container
        const statsDiv = document.createElement('div');
        statsDiv.className = 'summary-stats';
        statsDiv.innerHTML = `<strong>Quick Stats:</strong> Loading...`;
        card.appendChild(statsDiv);

        // Links container
        const linksContainer = document.createElement('div');
        linksContainer.className = 'links';

        // Create buttons for viewing reports
        if (repoData.apex && repoData.apex.html) {
            const apexButton = document.createElement('button');
            apexButton.className = 'view-button';
            apexButton.textContent = 'View Apex Tests';
            apexButton.onclick = () => openModal(repoData.apex.html);
            linksContainer.appendChild(apexButton);
        }

        if (repoData.analyzer && repoData.analyzer.html) {
            const analyzerButton = document.createElement('button');
            analyzerButton.className = 'view-button analyzer';
            analyzerButton.textContent = 'View Code Analysis';
            analyzerButton.onclick = () => openModal(repoData.analyzer.html);
            linksContainer.appendChild(analyzerButton);
        }

        card.appendChild(linksContainer);

        // Fetch summary stats asynchronously to display on the card
        if (repoData.apex && repoData.apex.json) {
            const cacheBust = new Date().getTime();
            const apexUrl = `${repoData.apex.json}?t=${cacheBust}`;

            fetch(apexUrl)
                .then(res => res.ok ? res.json() : Promise.reject('Apex JSON not found'))
                .then(apexJson => {
                    const summary = apexJson.result.summary;
                    statsDiv.innerHTML = `
                        <strong>Quick Stats:</strong> <span class="pass">${summary.passing || 0} Passed</span> | 
                        <span class="fail">${summary.failing || 0} Failed</span> | 
                        
                    `;
                })
                .catch(err => {
                    console.warn(`Could not fetch Apex summary for ${repoName}:`, err);
                    statsDiv.innerHTML = '<strong>Quick Stats:</strong> Not available';
                });
        } else {
            statsDiv.innerHTML = '<strong>Quick Stats:</strong> Not available';
        }

        return card;
    }

    // Initial render
    renderDashboard();
});
