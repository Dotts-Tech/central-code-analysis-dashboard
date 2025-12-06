const fs = require('fs');
const dir = './data';

let html = `
<html>
<head><title>Test Dashboard</title>
<style>
  body { font-family: Arial; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 10px; }
  th { background: #000; color: #fff; }
</style>
</head><body>
<h2>📊 All Projects – Test Dashboard</h2>
<table>
  <tr>
    <th>Repository</th>
    <th>JSON</th>
    <th>Pass</th>
    <th>Fail</th>
    <th>Coverage</th>
  </tr>
`;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  const repo = f.replace('.json', '');
  html += `
    <tr>
      <td>${repo}</td>
      <td><a href="data/${repo}.json">JSON</a></td>
      <td><a href="data/${repo}-pass.html">PASS</a></td>
      <td><a href="data/${repo}-fail.html">FAIL</a></td>
      <td><a href="data/${repo}-coverage.html">COVERAGE</a></td>
    </tr>
  `;
});

html += "</table></body></html>";
fs.writeFileSync("test-index.html", html);
