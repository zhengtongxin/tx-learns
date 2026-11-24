#!/usr/bin/env node
// Builds a short, deterministic efficiency brief for the optimizer agent.
// It measures the repository as it stands and points at likely sources of wasted work;
// it never changes site files and needs no network access.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : '';
const SKIP = new Set(['.git', 'node_modules', 'packages', 'inbox', 'quality-out', 'ui-check-out']);
const SOURCE_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.yml', '.yaml']);
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) walk(full);
      continue;
    }
    const rel = relative(ROOT, full);
    if (SOURCE_EXT.has(extname(entry.name))) files.push({ path: rel, bytes: statSync(full).size });
  }
}

function count(re) {
  return files.reduce((n, file) => n + (readFileSync(join(ROOT, file.path), 'utf8').match(re) || []).length, 0);
}

walk(ROOT);
files.sort((a, b) => b.bytes - a.bytes);

const groups = {
  html: files.filter(f => f.path.endsWith('.html')),
  js: files.filter(f => /\.(js|mjs)$/.test(f.path)),
  json: files.filter(f => f.path.endsWith('.json')),
  workflows: files.filter(f => f.path.startsWith('.github/workflows/')),
};
const sum = list => list.reduce((n, file) => n + file.bytes, 0);
const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`;
const largest = (list, n = 12) => list.slice(0, n).map(file => `- \`${file.path}\` — ${kb(file.bytes)}`).join('\n');
const siteJs = readFileSync(join(ROOT, 'assets/site.js'), 'utf8');
const statusJs = readFileSync(join(ROOT, 'api/status.js'), 'utf8');
const uiCheck = readFileSync(join(ROOT, 'scripts/ui-check.mjs'), 'utf8');

const findings = [];
if (/document\.write/.test(siteJs)) findings.push('Remove the parser-blocking `document.write` bootstrap in `assets/site.js`.');
if (/history:\s*\(a\.history \|\| \[\]\)/.test(statusJs)) findings.push('Bound `/api/status` history instead of returning every retained run.');
if (/waitUntil:\s*'networkidle'/.test(uiCheck)) findings.push('Replace `networkidle` and fixed browser waits with a readiness signal and deterministic settling.');
if (count(/innerHTML\s*=/g) > 25) findings.push('Reduce large `innerHTML` renderers by extracting shared DOM/HTML helpers.');
if (count(/<script type="application\/ld\+json">/g) > 20) findings.push('Generate repeated page metadata from one source instead of maintaining it in every HTML file.');
if (groups.workflows.length >= 10) findings.push('Run changed-page UI checks on PRs and reserve full browser sweeps for scheduled quality runs.');

const report = `# TX Learns efficiency brief

Generated from the repository without changing it. Prefer one focused, measurable improvement per pull request.

## Current shape

- Source files measured: ${files.length}
- HTML: ${groups.html.length} files, ${kb(sum(groups.html))}
- JavaScript: ${groups.js.length} files, ${kb(sum(groups.js))}
- JSON: ${groups.json.length} files, ${kb(sum(groups.json))}
- GitHub workflow files: ${groups.workflows.length}
- Inline \`innerHTML\` assignments: ${count(/innerHTML\s*=/g)}
- Inline JSON-LD blocks: ${count(/<script type="application\/ld\+json">/g)}

## Largest source files

${largest(files)}

## Highest-value opportunities

${findings.length ? findings.map(item => `- ${item}`).join('\n') : '- No high-confidence opportunity from the static scan; inspect runtime measurements before changing code.'}

## Improvement rules

- Preserve the bilingual EN/中文 behavior, lesson content, navigation, progress storage and no-build deployment.
- Prefer lower transferred bytes, fewer requests, less blocking work, less duplication and quieter CI without changing what learners see.
- Make one coherent change, include before/after measurements in the pull request, and leave uncertain refactors alone.
- Never change merge guardrails, agent runners, status recording, project starter/reference code or lesson prose.
`;

if (OUT) writeFileSync(OUT, report);
else process.stdout.write(report);
