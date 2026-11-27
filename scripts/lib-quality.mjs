// Shared helpers for the quality check (check-a11y.mjs and check-links.mjs): the list of pages, lessons.js / projects.js
// loaders and a tiny static server for the repo folder. No dependencies.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

// Runs one of the site's data files (window.X = ...) in a sandbox and returns the window object.
export function loadWindow(rel) {
  const f = join(ROOT, rel);
  const win = {};
  if (!existsSync(f)) return win;
  vm.runInNewContext(readFileSync(f, 'utf8'), { window: win }, { timeout: 5000 });
  return win;
}

export function tracks() { return loadWindow('tracks.js').TRACKS || []; }

// Every published lesson of every track, as { track, path }.
export function lessons() {
  const out = [];
  for (const t of tracks()) {
    const T = loadWindow(`${t.id}/lessons.js`).TRACK;
    for (const topic of (T && T.topics) || []) for (const it of topic.items || []) if (it.file) out.push({ track: t.id, path: `${t.id}/${it.file}` });
  }
  return out;
}

// Pages every check opens: home, How it works, glossary (when it exists), 404, each track index, each lesson.
export function allPages() {
  const base = ['index.html', 'ecosystem.html', 'glossary.html', 'about.html', 'method.html', 'coach.html', '404.html'];
  const idx = tracks().map(t => t.href || `${t.id}/index.html`);
  return [...base, ...idx, ...lessons().map(l => l.path)].filter((p, i, a) => a.indexOf(p) === i && existsSync(join(ROOT, p)));
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

// A static server for the repo folder, so the checks run without reaching Vercel. /api/status answers with an empty state.
export function serve() {
  return new Promise(ok => {
    const srv = createServer((q, r) => {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      if (p === '/api/status') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end('{"connected":false,"agents":{}}'); }
      const f = join(ROOT, p);
      if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end('not found'); }
      r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
      r.end(readFileSync(f));
    });
    srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}/` }));
  });
}
