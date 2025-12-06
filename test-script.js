// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Load test-index.json
fetch('data/test-index.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('card-container');
    for (const repo in data) {
      const repoData = data[repo];
      const card = document.createElement('div');
      card.className = 'card';
      
      const title = document.createElement('h3');
      title.textContent = repo;
      card.appendChild(title);

      // JSON link
      if (repoData.json) {
        const jsonLink = document.createElement('a');
        jsonLink.href = 'data/' + repoData.json;
        jsonLink.target = '_blank';
        jsonLink.textContent = 'JSON';
        jsonLink.className = 'json-link';
        card.appendChild(jsonLink);
      }

      // HTML link (dynamic label)
      if (repoData.html) {
        let label = 'HTML';
        if (repoData.html.toLowerCase().includes('pass')) label = 'PASS';
        else if (repoData.html.toLowerCase().includes('fail')) label = 'FAIL';
        else if (repoData.html.toLowerCase().includes('coverage')) label = 'COVERAGE';

        const htmlLink = document.createElement('a');
        htmlLink.href = 'data/' + repoData.html;
        htmlLink.target = '_blank';
        htmlLink.textContent = label;
        htmlLink.className = label.toLowerCase();
        card.appendChild(htmlLink);
      }

      container.appendChild(card);
    }
  })
  .catch(err => console.error('Error loading test-index.json:', err));
