#!/usr/bin/env node
// Page check: every page a reader can open has what it needs to be found, shared and read in both languages.
// Fails (exit 1) on: no <html lang>, no title, no description or link-preview tags, an image without alt text,
// headings that skip a level, or English text without its 中文 twin (and the other way round).
// It also keeps the files that list lessons in step with lessons.js: sitemap.xml, the no-JavaScript lesson list on
// the track page, and the "start here" links (data-start) that point at the first published lesson.
// Each lesson carries <meta name="updated" content="YYYY-MM-DD">, shown on the page as "Updated ...". --fix sets it to
// today (Malaysia time) when the lesson's text differs from the last commit, or to its last commit date when it is missing.
// Usage: node scripts/check-pages.mjs [--fix] [page.html ...]   (no pages = every page; --fix rewrites those lists)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadTracks } from './lib.mjs';

const root = new URL('..', import.meta.url);
const FIX = process.argv.includes('--fix');
const TR = loadTracks(new URL('.', root).pathname);
const all = ['index.html', 'ecosystem.html', '404.html', ...TR.flatMap(t => readdirSync(new URL(t.dir + '/', root)).filter(f => f.endsWith('.html')).map(f => t.dir + '/' + f))];
const named = process.argv.slice(2).filter(a => a !== '--fix');
const pages = named.length ? named : all;
const problems = [];
const bad = (p, m) => problems.push(`${p}: ${m}`);
const count = (s, re) => (s.match(re) || []).length;

for (const p of pages) {
  let html;
  try { html = readFileSync(new URL(p, root), 'utf8'); } catch { bad(p, 'file not found'); continue; }
  const markup = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const scripts = (html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []).join('\n');

  if (!/<html[^>]*\blang="[a-z-]+"/i.test(html)) bad(p, '<html> has no lang');
  if (!/<title>\s*[^<\s][^<]*<\/title>/i.test(html)) bad(p, 'no <title>');
  for (const [tag, re] of [['meta description', /<meta name="description" content="[^"]{20,}"/],
    ['og:title', /<meta property="og:title" content="[^"]+"/], ['og:description', /<meta property="og:description" content="[^"]+"/],
    ['og:image', /<meta property="og:image" content="https:\/\/[^"]+"/]]) if (!re.test(html)) bad(p, `no ${tag}`);

  if (!/<link rel="icon" href="[^"]+"/.test(html)) bad(p, 'no favicon (<link rel="icon">)');
  for (const img of markup.match(/<img\b[^>]*>/gi) || []) if (!/\balt="/i.test(img)) bad(p, `image without alt text: ${img.slice(0, 80)}`);

  // Headings in order: a page may go down one level at a time (h1 → h2 → h3), never skip one (h2 → h4).
  let last = 0;
  for (const m of markup.replace(/<svg\b[\s\S]*?<\/svg>/gi, '').matchAll(/<h([1-6])\b/gi)) {
    const n = +m[1];
    if (last && n > last + 1) bad(p, `heading jumps from h${last} to h${n}`);
    last = n;
  }

  // EN/中文 twins: markup marked class="en" needs as many class="zh", and so do {en:..., zh:...} strings in scripts.
  const en = count(markup, /class="en"/g), zh = count(markup, /class="zh"/g);
  if (en !== zh) bad(p, `${en} English blocks but ${zh} 中文 blocks; every .en needs a matching .zh`);
  const sen = count(scripts, /\ben\s*:/g), szh = count(scripts, /\bzh\s*:/g);
  if (sen !== szh) bad(p, `scripts have ${sen} English strings but ${szh} 中文 strings`);
}

// "Updated" dates on lessons.
const isLesson = p => /^[\w-]+\/\d\d-[\w-]+\.html$/.test(p);
const UPD = /<meta name="updated" content="([^"]*)">\n?/;
const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const git = (...a) => { try { return execFileSync('git', a, { cwd: new URL('.', root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
for (const p of all.filter(isLesson)) {
  const cur = readFileSync(new URL(p, root), 'utf8'), m = cur.match(UPD);
  if (FIX) {
    const head = git('show', `HEAD:${p}`);
    const changed = head === null || head.replace(UPD, '') !== cur.replace(UPD, '');
    const date = changed ? today : (m && m[1]) || (git('log', '-1', '--format=%cs', '--', p) || '').trim() || today;
    const tag = `<meta name="updated" content="${date}">\n`;
    const next = m ? cur.replace(UPD, tag) : cur.replace(/(<meta name="theme-color"[^>]*>)\n?/, `$1\n${tag}`);
    if (next !== cur) writeFileSync(new URL(p, root), next);
  } else if (!m || !/^\d{4}-\d\d-\d\d$/.test(m[1]) || m[1] > today) bad(p, 'no valid <meta name="updated" content="YYYY-MM-DD"> (run node scripts/check-pages.mjs --fix)');
}

// Lists that come from lessons.js. --fix rewrites them; otherwise a stale list fails the check.
const SITE = 'https://tx-learns.vercel.app/';
const live = TR.flatMap(t => t.T.topics.flatMap(w => w.items).filter(x => x.file).map(x => ({ ...x, path: t.dir + '/' + x.file })));
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const want = {
  'sitemap.xml': '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Made by node scripts/check-pages.mjs --fix from lessons.js. Do not edit by hand. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ['', 'ecosystem.html', ...TR.map(t => t.dir + '/index.html'), ...live.map(x => x.path)].map(u => `<url><loc>${SITE}${u}</loc></url>`).join('\n') + '\n</urlset>\n',
};
const lists = Object.fromEntries(TR.map(t => [t.dir + '/index.html', [/<!-- lessons:start -->[\s\S]*?<!-- lessons:end -->/, '<!-- lessons:start --><noscript><ol>' +
    t.T.topics.flatMap(w => w.items).filter(x => x.file).map(x => `<li><a href="${x.file}">${esc(x.title.en)} · ${esc(x.title.zh)}</a></li>`).join('') + '</ol></noscript><!-- lessons:end -->']]));
const firstOf = t => { const x = t.T.topics.flatMap(w => w.items).find(i => i.file); return x && x.file; };
for (const [f, text] of Object.entries(want)) {
  let cur = ''; try { cur = readFileSync(new URL(f, root), 'utf8'); } catch {}
  if (cur !== text) { if (FIX) writeFileSync(new URL(f, root), text); else bad(f, 'out of date with lessons.js (run node scripts/check-pages.mjs --fix)'); }
}
for (const f of ['index.html', ...TR.map(t => t.dir + '/index.html')]) {
  const cur = readFileSync(new URL(f, root), 'utf8');
  let next = cur;
  if (lists[f]) { const [re, block] = lists[f]; if (!re.test(cur)) bad(f, 'missing <!-- lessons:start --><!-- lessons:end --> markers'); else next = next.replace(re, block); }
  const own = f === 'index.html' ? TR[0] : TR.find(t => t.dir + '/index.html' === f), first = own && firstOf(own);
  if (first) next = next.replace(/(<a [^>]*data-start[^>]*href=")[^"]*(")/g, (m, a, b) => a + (f === 'index.html' ? own.dir + '/' : '') + first + b);
  if (next !== cur) { if (FIX) writeFileSync(new URL(f, root), next); else bad(f, 'lesson list or start link out of date with lessons.js (run node scripts/check-pages.mjs --fix)'); }
}

if (problems.length) { console.log(`✗ Page check failed (${problems.length}):\n` + problems.map(x => '  - ' + x).join('\n')); process.exit(1); }
console.log(`✓ Page check passed: ${pages.length} pages have lang, title, description, link previews, favicon, alt text, heading order, EN/中文 twins and an updated date on each lesson; sitemap, lesson list and start links match lessons.js.`);
