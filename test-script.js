document.addEventListener('DOMContentLoaded', () => {
  const resultsContainer = document.getElementById('results');
  const modal = document.getElementById('report-modal');
  const reportFrame = document.getElementById('report-frame');
  const modalTitle = document.getElementById('modal-title');
  const downloadBtn = document.getElementById('modal-download-btn');
  const closeBtn = document.querySelector('.close-button');
  
  // Store the current report URL for downloading
  let currentReportUrl = '';
  let currentReportName = '';

  /* ---------- MODAL ---------- */
  function openModal(url, title) {
    currentReportUrl = url;
    currentReportName = title;
    reportFrame.src = url;
    modalTitle.textContent = title;
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
    reportFrame.src = '';
    currentReportUrl = '';
    currentReportName = '';
  }

  closeBtn.onclick = closeModal;
  window.onclick = e => e.target === modal && closeModal();

  /* ---------- FILE DOWNLOADER ---------- */
  async function downloadFile(url, filename) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${filename}. Please check the console for details.`);
    }
  }

  // Set up download button click event
  downloadBtn.onclick = () => {
    if (currentReportUrl) {
      const filename = `${currentReportName.replace(/\s+/g, '-').toLowerCase()}-report.html`;
      downloadFile(currentReportUrl, filename);
    }
  };

  /* ---------- DASHBOARD ---------- */
  async function renderDashboard() {
    resultsContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    `;

    try {
      const cacheBust = Date.now();
      const indexResp = await fetch(`test-index.json?t=${cacheBust}`);
      if (!indexResp.ok) throw new Error('Could not fetch index.json');
      const indexData = await indexResp.json();

      const repos = Object.keys(indexData).sort();
      
      const dashboardContainer = document.createElement('div');
      dashboardContainer.className = 'dashboard-container';
      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(dashboardContainer);

      for (const repoName of repos) {
        const repo = indexData[repoName];
        const card = document.createElement('div');
        card.className = 'repo-card';

        card.innerHTML = `
          <h2>${repoName}</h2>
          <p class="updated">Updated: ${new Date(repo.updated).toLocaleString()}</p>
        `;

        /* ---------- ANALYZER ---------- */
        const violationSection = document.createElement('div');
        violationSection.className = 'violation-section';
        
        const violationTitle = document.createElement('div');
        violationTitle.className = 'section-title';
        violationTitle.innerHTML = '<i class="fas fa-shield-alt"></i> Code Violations';
        violationSection.appendChild(violationTitle);
        
        const violationWrap = document.createElement('div');
        violationSection.appendChild(violationWrap);
        card.appendChild(violationSection);

        if (repo.analyzer?.json) {
          fetch(`${repo.analyzer.json}?t=${cacheBust}`)
            .then(r => r.json())
            .then(a => {
              const v = a.violationCounts || {};
              violationWrap.innerHTML = `
                <div class="violation-boxes">
                  <div class="box critical">${v.sev1 || 0}</div>
                  <div class="box high">${v.sev2 || 0}</div>
                  <div class="box medium">${v.sev3 || 0}</div>
                  <div class="box low">${v.sev4 || 0}</div>
                  <div class="box info">${v.sev5 || 0}</div>
                </div>
                <div class="labels">
                  <span>CRITICAL</span><span>HIGH</span><span>MEDIUM</span><span>LOW</span><span>INFO</span>
                </div>
              `;
            })
            .catch(() => {
              violationWrap.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Violation data unavailable</p>';
            });
        } else {
          violationWrap.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No violation data available</p>';
        }

        /* ---------- APEX ---------- */
        const apexSection = document.createElement('div');
        apexSection.className = 'apex-section';
        
        const apexTitle = document.createElement('div');
        apexTitle.className = 'section-title';
        apexTitle.innerHTML = '<i class="fas fa-vial"></i> Apex Tests';
        apexSection.appendChild(apexTitle);
        
        const apexDiv = document.createElement('div');
        apexDiv.className = 'apex-summary';
        apexDiv.innerHTML = '<strong>Loading...</strong>';
        apexSection.appendChild(apexDiv);
        card.appendChild(apexSection);

        if (repo.apex?.json) {
          fetch(`${repo.apex.json}?t=${cacheBust}`)
            .then(r => r.json())
            .then(a => {
              const summary = a.result?.summary || {};
              const coverageData = a.result?.coverage?.coverage;

              let coveragePercent = 0;
              if (Array.isArray(coverageData) && coverageData.length > 0) {
                const totalCoverage = coverageData.reduce((sum, item) => sum + (item.coveredPercent || 0), 0);
                const averageCoverage = totalCoverage / coverageData.length;
                coveragePercent = Math.round(averageCoverage * 100) / 100;
              }

              apexDiv.innerHTML = `
                <span class="pass"><i class="fas fa-check-circle"></i> ${summary.passing || 0} Passed</span> |
                <span class="fail"><i class="fas fa-times-circle"></i> ${summary.failing || 0} Failed</span> |
                <span><i class="fas fa-chart-pie"></i> Coverage: ${coveragePercent}%</span>
              `;
            })
            .catch(() => {
              apexDiv.innerHTML = '<strong>Apex Tests:</strong> Not available';
            });
        } else {
          apexDiv.innerHTML = '<strong>Apex Tests:</strong> Not available';
        }

        /* ---------- BUTTONS ---------- */
        const actions = document.createElement('div');
        actions.className = 'actions';

        if (repo.apex?.html) {
          const btn = document.createElement('button');
          btn.innerHTML = '<i class="fas fa-eye"></i> View Apex Report';
          btn.onclick = () => openModal(repo.apex.html, `${repoName} Apex Report`);
          actions.appendChild(btn);
        }

        if (repo.analyzer?.html) {
          const btn = document.createElement('button');
          btn.innerHTML = '<i class="fas fa-eye"></i> View Analyzer Report';
          btn.onclick = () => openModal(repo.analyzer.html, `${repoName} Analyzer Report`);
          actions.appendChild(btn);
        }

        card.appendChild(actions);
        dashboardContainer.appendChild(card);
      }

    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = '<p class="error">Failed to load dashboard. Please try again later.</p>';
    }
  }

  renderDashboard();
});
