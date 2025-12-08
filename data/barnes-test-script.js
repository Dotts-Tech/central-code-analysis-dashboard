
document.addEventListener('DOMContentLoaded', function() {
    const pageTitle = document.querySelector('h1.repo-title').textContent;
    const repoName = pageTitle.split(' - ')[0];
    const viewApexBtn = document.getElementById('btnViewApexReport');
    const viewAnalyzerBtn = document.getElementById('btnViewAnalyzerReport');
    const apexModalBody = document.getElementById('apexModalBody');
    const analyzerModalBody = document.getElementById('analyzerModalBody');

    if (viewApexBtn) {
        viewApexBtn.addEventListener('click', function() {
            const apexUrl = `data/${repoName}-apex.html`;
            fetch(apexUrl).then(response => {
                if (!response.ok) { throw new Error('Network response was not ok'); }
                return response.text();
            }).then(html => {
                apexModalBody.innerHTML = html;
            }).catch(error => {
                console.error('Error loading Apex report:', error);
                apexModalBody.innerHTML = '<p>Error loading report. Could not fetch ' + apexUrl + '</p>';
            });
        });
    }

    if (viewAnalyzerBtn) {
        viewAnalyzerBtn.addEventListener('click', function() {
            const analyzerUrl = `data/${repoName}-analyzer.html`;
            fetch(analyzerUrl).then(response => {
                if (!response.ok) { throw new Error('Network response was not ok'); }
                return response.text();
            }).then(html => {
                analyzerModalBody.innerHTML = html;
            }).catch(error => {
                console.error('Error loading Analyzer report:', error);
                analyzerModalBody.innerHTML = '<p>Error loading report. Could not fetch ' + analyzerUrl + '</p>';
            });
        });
    }
});
