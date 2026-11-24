#!/usr/bin/env node
// Quality check, part 2 (links). No browser, no AI. Reads every page's HTML from the repo folder and checks:
//   fails on   an internal link, image, script or stylesheet that points at a file that is not there; a #anchor that no id or name
//              on the target page matches; a file a project card lists in pkg.files that does not exist
//   warns on   external links that do not answer within a short time (one retry): the other site may be down, so never a failure
// Usage: node scripts/check-links.mjs [--out DIR] [--no-external] [--timeout MS]
// Exit code: 0 nothing failed (warnings are fine), 1 something failed. An unexpected crash exits 1 as well (node's default).
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname, posix } from 'node:path';
import { ROOT, arg, allPages, loadWindow, tracks } from './lib-quality.mjs';

const OUT = resolve(arg('out', 'quality-out'));
const TIMEOUT = +arg('timeout', 8000);
const EXTERNAL = !process.argv.includes('--no-external');

const fails = [], warns = [];
const ids = new Map();   // page path -> Set of ids and names
const idsOf = rel => {
  if (!ids.has(rel)) {
    const set = new Set();
    try { for (const m of readFileSync(join(ROOT, rel), 'utf8').matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/g)) set.add(m[1]); } catch {}
    ids.set(rel, set);
  }
  return ids.get(rel);
};
const isFile = rel => { const f = join(ROOT, rel); return f.startsWith(ROOT) && existsSync(f) && statSync(f).isFile(); };

const external = new Map(); // url -> [pages]
const pages = allPages();
for (const page of pages) {
  const html = readFileSync(join(ROOT, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const dir = posix.dirname(page);
  // <base href="/"> (404.html) makes every relative link start at the site root.
  const hasBase = /<base\s+href=["']\/["']/i.test(html);
  const refs = [...html.matchAll(/\b(href|src)\s*=\s*["']([^"']*)["']/gi)].map(m => m[2].trim().replace(/&amp;/g, '&'));
  for (const ref of new Set(refs)) {
    if (!ref || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(ref) || /[{}]|\$\{/.test(ref)) continue;
    if (/^https?:\/\//i.test(ref) || ref.startsWith('//')) {
      const u = ref.startsWith('//') ? 'https:' + ref : ref;
      if (!external.has(u)) external.set(u, []);
      external.get(u).push(page);
      continue;
    }
    let [path, hash] = ref.split('#');
    path = path.split('?')[0];
    let target;
    if (!path) target = page;
    else {
      target = path.startsWith('/') || hasBase ? posix.normalize(path.replace(/^\//, '')) : posix.normalize(posix.join(dir, path));
      if (target.endsWith('/') || target === '.' || target === '') target = posix.join(target === '.' ? '' : target, 'index.html');
    }
    if (target.startsWith('..')) { fails.push({ page, what: `link leaves the site: ${ref}` }); continue; }
    if (!isFile(target) && !(isFile(target + '.html'))) {
      // Folders served as an index and the function route are not files.
      if (target === 'api/status' || existsSync(join(ROOT, target, 'index.html'))) continue;
      fails.push({ page, what: `missing file: ${ref}` });
      continue;
    }
    if (hash && /\.html?$/.test(target) && !idsOf(target).has(decodeURIComponent(hash))) {
      // A script may create the target after load, so look for the id in the page's own scripts too.
      let scripted = false;
      try { scripted = readFileSync(join(ROOT, target), 'utf8').includes(hash); } catch {}
      if (!scripted) fails.push({ page, what: `anchor #${hash} not found on ${target}` });
    }
  }
}

// Project cards: every file a card lists must exist.
let cards = 0;
for (const t of tracks()) {
  const P = loadWindow(`${t.id}/projects.js`).PROJECTS || {};
  for (const [lesson, card] of Object.entries(P)) {
    const pkg = card && card.pkg;
    if (!pkg) continue;
    cards++;
    for (const f of pkg.files || []) if (!isFile(`${pkg.dir}/${f}`)) fails.push({ page: `${t.id}/${lesson}`, what: `project file missing: ${pkg.dir}/${f}` });
  }
}

// External links: short timeout, one retry, never a failure.
async function ping(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const method of ['HEAD', 'GET']) {
      try {
        const r = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT), headers: { 'user-agent': 'Mozilla/5.0 (compatible; site-link-check)' } });
        if (r.status < 400) return null;
        // Some sites refuse HEAD or automated requests; 401/403/429 mean "there, but not for a robot".
        if ([401, 403, 429, 999].includes(r.status)) return null;
        if (method === 'GET') var last = `HTTP ${r.status}`;
      } catch (e) { var lastErr = e.name === 'TimeoutError' ? 'timed out' : (e.cause && e.cause.code) || e.message; if (method === 'GET') last = lastErr; }
    }
    if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
    var res = last;
  }
  return res || 'no answer';
}
if (EXTERNAL) {
  const urls = [...external.keys()];
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < urls.length) {
      const u = urls[next++], why = await ping(u);
      if (why) warns.push({ page: [...new Set(external.get(u))].slice(0, 3).join(', '), what: `${u}: ${why}` });
    }
  }));
}

const summary = fails.length
  ? `${fails.length} broken internal link(s) or missing file(s), ${warns.length} external warning(s).`
  : `${pages.length} pages, ${cards} project cards: every internal link, anchor and project file is there${EXTERNAL ? `, ${external.size} external links checked, ${warns.length} warning(s)` : ''}.`;
const md = ['# Link check', summary, '',
  ...(fails.length ? ['## Problems', ...fails.map(f => `- ${f.page}: ${f.what}`), ''] : []),
  ...(warns.length ? ['## External warnings (the other site may be down)', ...warns.map(f => `- ${f.page}: ${f.what}`), ''] : [])].join('\n');
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'links.json'), JSON.stringify({ summary, fails, warns }, null, 1));
writeFileSync(join(OUT, 'links.md'), md);
console.log(md);
process.exit(fails.length ? 1 : 0);
