class Dashboard {
    constructor() {
        this.repositories = {};
        this.currentRepo = null;
        this.currentFilter = 'all';
        this.indexFile = 'test-index.json';
        
        this.init();
    }

    async init() {
        console.log('🚀 Dashboard Initializing...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial load
        await this.loadData();
        
        // Update timestamp
        this.updateTimestamp();
        
        console.log('✅ Dashboard Ready!');
    }

    setupEventListeners() {
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterRepositories(e.target.value);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('closeDetailModal').addEventListener('click', () => {
            this.closeDetailModal();
        });

        // Full report button
        document.getElementById('openFullReport').addEventListener('click', () => {
            this.openFullReport();
        });

        // Close modal on overlay click
        document.getElementById('reportModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDetailModal();
            }
        });
    }

    async loadData() {
        try {
            this.showLoading();
            
            const response = await fetch(this.indexFile + '?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            this.repositories = await response.json();
            console.log(`📁 Loaded ${Object.keys(this.repositories).length} repositories`);
            
            this.updateStats();
            this.renderRepositories();
            this.updateTimestamp();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(error.message);
        }
    }

    updateStats() {
        const repos = Object.keys(this.repositories);
        const totalRepos = repos.length;
        
        let apexCount = 0;
        let analyzerCount = 0;
        let passingCount = 0;
        
        repos.forEach(repoName => {
            const repo = this.repositories[repoName];
            
            if (repo.apex) apexCount++;
            if (repo.analyzer) analyzerCount++;
            
            const status = this.getRepoStatus(repoName);
            if (status === 'passing') passingCount++;
        });
        
        const healthScore = totalRepos > 0 ? Math.round((passingCount / totalRepos) * 100) : 0;
        
        // Update stats cards
        document.getElementById('totalRepos').textContent = totalRepos;
        document.getElementById('apexReports').textContent = apexCount;
        document.getElementById('analyzerReports').textContent = analyzerCount;
        document.getElementById('healthScore').textContent = `${healthScore}%`;
        
        // Update footer
        document.getElementById('reposCount').textContent = `${totalRepos} repositories`;
    }

    getRepoStatus(repoName) {
        const repo = this.repositories[repoName];
        
        // Check apex results
        if (repo.apex && repo.apex.summary) {
            if (repo.apex.summary.failing > 0) return 'failing';
            if (repo.apex.summary.passing === 0 && repo.apex.summary.testsRan > 0) return 'failing';
        }
        
        return 'passing';
    }

    renderRepositories() {
        const reposGrid = document.getElementById('reposGrid');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        // Filter repositories
        const filteredRepos = Object.keys(this.repositories).filter(repoName => {
            const repo = this.repositories[repoName];
            const status = this.getRepoStatus(repoName);
            
            // Apply search filter
            if (searchTerm && !repoName.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Apply status filter
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === 'passing' && status !== 'passing') return false;
                if (this.currentFilter === 'failing' && status !== 'failing') return false;
                if (this.currentFilter === 'apex' && !repo.apex) return false;
                if (this.currentFilter === 'analyzer' && !repo.analyzer) return false;
            }
            
            return true;
        }).sort();
        
        if (filteredRepos.length === 0) {
            reposGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No repositories found</h3>
                    <p>Try changing your search or filter criteria</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filteredRepos.forEach(repoName => {
            const repo = this.repositories[repoName];
            const status = this.getRepoStatus(repoName);
            const statusClass = `status-${status}`;
            const cardClass = `repo-card ${status}`;
            
            // Get apex summary if available
            let totalTests = 0;
            let passedTests = 0;
            let coverage = 0;
            
            if (repo.apex && repo.apex.summary) {
                totalTests = repo.apex.summary.testsRan || 0;
                passedTests = repo.apex.summary.passing || 0;
                coverage = repo.apex.summary.coveredPercent || 0;
            }
            
            // Coverage class
            let coverageClass = 'coverage-poor';
            if (coverage >= 75) coverageClass = 'coverage-good';
            else if (coverage >= 50) coverageClass = 'coverage-warning';
            
            html += `
                <div class="${cardClass}" data-repo="${repoName}">
                    <div class="repo-header">
                        <div class="repo-name">${repoName}</div>
                        <div class="repo-status ${statusClass}">
                            ${status.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="repo-description">
                        <i class="fas fa-code-branch"></i> 
                        ${repo.apex ? '<span class="badge apex">Apex</span>' : ''}
                        ${repo.analyzer ? '<span class="badge analyzer">Analyzer</span>' : ''}
                    </div>
                    
                    <div class="repo-metrics">
                        <div class="metric">
                            <div class="metric-value">${totalTests}</div>
                            <div class="metric-label">Total Tests</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value ${status === 'passing' ? 'coverage-good' : 'coverage-poor'}">
                                ${passedTests}
                            </div>
                            <div class="metric-label">Passed Tests</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value ${coverageClass}">${coverage}%</div>
                            <div class="metric-label">Code Coverage</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">
                                ${repo.apex && repo.analyzer ? 'Both' : repo.apex ? 'Apex' : 'Analyzer'}
                            </div>
                            <div class="metric-label">Report Type</div>
                        </div>
                    </div>
                    
                    <div class="repo-actions">
                        <button class="action-btn btn-primary" onclick="dashboard.viewDetails('${repoName}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn btn-secondary" onclick="dashboard.openReports('${repoName}')">
                            <i class="fas fa-chart-bar"></i> Reports
                        </button>
                    </div>
                </div>
            `;
        });
        
        reposGrid.innerHTML = html;
    }

    filterRepositories(searchTerm) {
        this.renderRepositories();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderRepositories();
    }

    viewDetails(repoName) {
        this.currentRepo = repoName;
        const repo = this.repositories[repoName];
        
        const modal = document.getElementById('detailModal');
        const title = document.getElementById('detailTitle');
        const content = document.getElementById('detailContent');
        
        // Get apex summary
        let apexSummary = { testsRan: 0, passing: 0, failing: 0, coveredPercent: 0 };
        if (repo.apex && repo.apex.summary) {
            apexSummary = repo.apex.summary;
        }
        
        title.textContent = repoName;
        
        content.innerHTML = `
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Repository Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value status-${this.getRepoStatus(repoName)}">
                            ${this.getRepoStatus(repoName).toUpperCase()}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Reports Available</div>
                        <div class="detail-value">
                            ${repo.apex ? 'Apex ' : ''}${repo.analyzer ? 'Analyzer' : ''}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Last Updated</div>
                        <div class="detail-value">Recent</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-flask"></i> Apex Test Summary</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Total Tests</div>
                        <div class="detail-value">${apexSummary.testsRan}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Passed</div>
                        <div class="detail-value coverage-good">${apexSummary.passing}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Failed</div>
                        <div class="detail-value coverage-poor">${apexSummary.failing}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Coverage</div>
                        <div class="detail-value">
                            <span class="${apexSummary.coveredPercent >= 75 ? 'coverage-good' : apexSummary.coveredPercent >= 50 ? 'coverage-warning' : 'coverage-poor'}">
                                ${apexSummary.coveredPercent}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-external-link-alt"></i> Quick Actions</h3>
                <div class="repo-actions">
                    <button class="action-btn btn-success" onclick="dashboard.openReports('${repoName}')">
                        <i class="fas fa-chart-bar"></i> View All Reports
                    </button>
                    ${repo.apex && repo.apex.html ? `
                        <button class="action-btn btn-primary" onclick="window.open('${repo.apex.html}', '_blank')">
                            <i class="fas fa-file-alt"></i> Open Apex Report
                        </button>
                    ` : ''}
                    ${repo.analyzer && repo.analy
