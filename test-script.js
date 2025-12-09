// Configuration
const CONFIG = {
    indexFile: 'test-index.json',
    repoBaseUrl: 'data/',
    updateInterval: 30000 // 30 seconds
};

// State management
let state = {
    repos: {},
    filter: 'all',
    stats: {
        total: 0,
        hasApex: 0,
        hasAnalyzer: 0,
        allReports: 0
    }
};

// DOM Elements
let elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    setupEventListeners();
    await loadDashboard();
    startAutoRefresh();
});

function initializeElements() {
    elements = {
        dashboardGrid: document.getElementById('dashboardGrid'),
        totalRepos: document.getElementById('totalRepos'),
        apexRepos: document.getElementById('apexRepos'),
        analyzerRepos: document.getElementById('analyzerRepos'),
        allReportsRepos: document.getElementById('allReportsRepos'),
        loading: document.getElementById('loading'),
        filterAll: document.getElementById('filterAll'),
        filterApex: document.getElementById('filterApex'),
        filterAnalyzer: document.getElementById('filterAnalyzer'),
        refreshBtn: document.getElementById('refreshBtn')
    };
}

function setupEventListeners() {
    elements.filterAll?.addEventListener('click', () => setFilter('all'));
    elements.filterApex?.addEventListener('click', () => setFilter('apex'));
    elements.filterAnalyzer?.addEventListener('click', () => setFilter('analyzer'));
    elements.refreshBtn?.addEventListener('click', loadDashboard);
}

async function loadDashboard() {
    try {
        showLoading(true);
        
        // Load index file
        const response = await fetch(CONFIG.indexFile);
        if (!response.ok) throw new Error('Failed to load index');
        
        const indexData = await response.json();
        state.repos = indexData;
        
        // Load detailed data for each repo
        const repoKeys = Object.keys(state.repos);
        state.stats.total = repoKeys.length;
        state.stats.hasApex = 0;
        state.stats.hasAnalyzer = 0;
        state.stats.allReports = 0;
        
        for (const repoName of repoKeys) {
            const repo = state.repos[repoName];
            
            // Load Apex data if available
            if (repo.apex?.json) {
                try {
                    const apexResponse = await fetch(repo.apex.json);
                    if (apexResponse.ok) {
                        repo.apex.data = await apexResponse.json();
                        state.stats.hasApex++;
                    }
                } catch (error) {
                    console.warn(`Failed to load Apex data for ${repoName}:`, error);
                }
            }
            
            // Load Analyzer data if available
            if (repo.analyzer?.json) {
                try {
                    const analyzerResponse = await fetch(repo.analyzer.json);
                    if (analyzerResponse.ok) {
                        repo.analyzer.data = await analyzerResponse.json();
                        state.stats.hasAnalyzer++;
                    }
                } catch (error) {
                    console.warn(`Failed to load Analyzer data for ${repoName}:`, error);
                }
            }
            
            // Check if repo has both reports
            if (repo.apex?.json && repo.analyzer?.json) {
                state.stats.allReports++;
            }
        }
        
        renderDashboard();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Please try again.');
    } finally {
        showLoading(false);
    }
}

function setFilter(filterType) {
    state.filter = filterType;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    renderDashboard();
}

function renderDashboard() {
    // Update stats
    if (elements.totalRepos) elements.totalRepos.textContent = state.stats.total;
    if (elements.apexRepos) elements.apexRepos.textContent = state.stats.hasApex;
    if (elements.analyzerRepos) elements.analyzerRepos.textContent = state.stats.hasAnalyzer;
    if (elements.allReportsRepos) elements.allReportsRepos.textContent = state.stats.allReports;
    
    // Filter repos
    const filteredRepos = Object.entries(state.repos).filter(([repoName, repoData]) => {
        if (state.filter === 'all') return true;
        if (state.filter === 'apex') return repoData.apex?.json;
        if (state.filter === 'analyzer') return repoData.analyzer?.json;
        return true;
    });
    
    // Render cards
    if (elements.dashboardGrid) {
        if (filteredRepos.length === 0) {
            elements.dashboardGrid.innerHTML = `
                <div class="no-repos">
                    <h3>No repositories found</h3>
                    <p>${state.filter !== 'all' ? 'Try changing the filter or ' : ''}run the analysis workflow to generate reports.</p>
                </div>
            `;
        } else {
            elements.dashboardGrid.innerHTML = filteredRepos.map(([repoName, repoData]) => 
                createRepoCard(repoName, repoData)
            ).join('');
        }
    }
}

function createRepoCard(repoName, repoData) {
    const hasApex = repoData.apex?.json;
    const hasAnalyzer = repoData.analyzer?.json;
    const apexData = repoData.apex?.data;
    const analyzerData = repoData.analyzer?.data;
    
    // Calculate coverage if available
    let coverage = 'N/A';
    let coverageClass = '';
    if (apexData?.result?.summary) {
        const coveragePercent = apexData.result.summary.testRunCoverage || apexData.result.summary.coveredPercent || 0;
        coverage = `${coveragePercent}%`;
        coverageClass = coveragePercent >= 75 ? 'coverage-high' : 
                       coveragePercent >= 50 ? 'coverage-medium' : 'coverage-low';
    }
    
    // Get test results if available
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    if (apexData?.result?.summary) {
        totalTests = apexData.result.summary.testsRan || 0;
        passedTests = apexData.result.summary.passing || 0;
        failedTests = apexData.result.summary.failing || 0;
    }
    
    // Get analyzer violations if available
    let totalViolations = 0;
    let criticalViolations = 0;
    
    if (analyzerData?.summary) {
        totalViolations = analyzerData.summary.violationCount || 0;
        criticalViolations = analyzerData.violations?.filter(v => v.severity === 'CRITICAL').length || 0;
    }
    
    return `
        <div class="repo-card">
            <div class="repo-header">
                <div class="repo-name">${formatRepoName(repoName)}</div>
                <div class="repo-id">${repoName}</div>
            </div>
            
            <div class="status-badges">
                <span class="badge ${hasApex ? 'badge-available' : 'badge-unavailable'}">
                    <i>⚡</i> ${hasApex ? 'Apex Available' : 'No Apex'}
                </span>
                <span class="badge ${hasAnalyzer ? 'badge-available' : 'badge-unavailable'}">
                    <i>🔍</i> ${hasAnalyzer ? 'Analyzer Available' : 'No Analyzer'}
                </span>
            </div>
            
            ${hasApex ? `
                <div class="metrics-container">
                    <h4>Apex Test Results</h4>
                    <div class="metric-row">
                        <span class="metric-label">Total Tests:</span>
                        <span class="metric-value">${totalTests}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Passed:</span>
                        <span class="metric-value" style="color: #4caf50;">${passedTests}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Failed:</span>
                        <span class="metric-value" style="color: ${failedTests > 0 ? '#f44336' : '#666'};">${failedTests}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Coverage:</span>
                        <span class="metric-value coverage-value ${coverageClass}">${coverage}</span>
                    </div>
                </div>
            ` : ''}
            
            ${hasAnalyzer ? `
                <div class="metrics-container">
                    <h4>Code Analyzer Results</h4>
                    <div class="metric-row">
                        <span class="metric-label">Total Violations:</span>
                        <span class="metric-value">${totalViolations}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Critical:</span>
                        <span class="metric-value" style="color: ${criticalViolations > 0 ? '#f44336' : '#4caf50'};">${criticalViolations}</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="actions-container">
                ${hasApex && repoData.apex.html ? `
                    <a href="${repoData.apex.html}" target="_blank" class="action-btn btn-primary">
                        <i>📊</i> View Apex Report
                    </a>
                ` : ''}
                
                ${hasAnalyzer && repoData.analyzer.html ? `
                    <a href="${repoData.analyzer.html}" target="_blank" class="action-btn ${hasApex ? 'btn-secondary' : 'btn-primary'}">
                        <i>🔍</i> View Analyzer Report
                    </a>
                ` : ''}
                
                ${(!hasApex || !hasAnalyzer) ? `
                    <button onclick="analyzeRepo('${repoName}')" class="action-btn btn-danger">
                        <i>🔄</i> Run Analysis
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function formatRepoName(repoName) {
    return repoName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function analyzeRepo(repoName) {
    // This would trigger a GitHub Actions workflow
    alert(`Analysis would be triggered for ${repoName}\n\nIn production, this would call GitHub API to trigger the workflow.`);
    
    // Example implementation:
    // fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `token ${GITHUB_TOKEN}`,
    //         'Accept': 'application/vnd.github.everest-preview+json'
    //     },
    //     body: JSON.stringify({
    //         event_type: 'run-analysis',
    //         client_payload: { repo_name: repoName }
    //     })
    // });
}

function showLoading(show) {
    if (elements.loading) {
        elements.loading.style.display = show ? 'block' : 'none';
    }
    
    if (elements.dashboardGrid) {
        elements.dashboardGrid.style.opacity = show ? '0.5' : '1';
    }
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert';
    alertDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button onclick="this.parentElement.remove()" style="float:right; background:none; border:none; cursor:pointer;">✕</button>
    `;
    
    document.querySelector('.container')?.prepend(alertDiv);
}

function startAutoRefresh() {
    setInterval(() => {
        loadDashboard();
    }, CONFIG.updateInterval);
}

// Expose functions to global scope for button onclick events
window.analyzeRepo = analyzeRepo;
