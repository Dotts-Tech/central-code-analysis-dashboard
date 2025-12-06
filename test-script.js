fetch('test-index.json')
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
      
      if (repoData.json) {
        const jsonLink = document.createElement('a');
        jsonLink.href = repoData.json;
        jsonLink.target = '_blank';
        jsonLink.textContent = 'JSON';
        jsonLink.className = 'json-link';
        card.appendChild(jsonLink);
      }

      if (repoData.pass) {
        const passLink = document.createElement('a');
        passLink.href = repoData.pass;
        passLink.target = '_blank';
        passLink.textContent = 'PASS';
        passLink.className = 'pass';
        card.appendChild(passLink);
      }

      if (repoData.fail) {
        const failLink = document.createElement('a');
        failLink.href = repoData.fail;
        failLink.target = '_blank';
        failLink.textContent = 'FAIL';
        failLink.className = 'fail';
        card.appendChild(failLink);
      }

      if (repoData.coverage) {
        const coverageLink = document.createElement('a');
        coverageLink.href = repoData.coverage;
        coverageLink.target = '_blank';
        coverageLink.textContent = 'COVERAGE';
        coverageLink.className = 'coverage';
        card.appendChild(coverageLink);
      }

      container.appendChild(card);
    }
  })
  .catch(err => console.error('Error loading test-index.json:', err));
