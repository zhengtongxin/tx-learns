#!/usr/bin/env node
// Page check: every page a reader can open has what it needs to be found, shared and read in both languages.
// Fails (exit 1) on: no <html lang>, no title, no description or link-preview tags, an image without alt text,
// headings that skip a level, or English text without its 中文 twin (and the other way round).
// It also keeps the files that list lessons in step with lessons.js: sitemap.xml, the no-JavaScript lesson list on
// the track page, and the "start here" links (data-start) that point at the first published lesson.
// Each lesson carries <meta name="updated" content="YYYY-MM-DD">, shown on the page as "Updated ...". --fix sets it to
// today (Malaysia time) when the lesson's text differs from the last commit, or to its last commit date when it is missing.
// --fix also writes what search engines and caches need, all from the curriculum (tracks.js + <track>/lessons.js):
// <link rel="canonical">, one JSON-LD block per page (WebSite, LearningResource + BreadcrumbList, ...), ?v=<content hash> on
// the shared scripts and styles, and the cache headers and redirects in vercel.json (redirects come from scripts/redirects.json).
// Usage: node scripts/check-pages.mjs [--fix] [page.html ...]   (no pages = every page; --fix rewrites those lists)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { loadTracks } from './lib.mjs';

const root = new URL('..', import.meta.url);
const FIX = process.argv.includes('--fix');
const TR = loadTracks(new URL('.', root).pathname);
const rootPages = readdirSync(new URL('.', root)).filter(f => f.endsWith('.html')).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a < b ? -1 : 1));
const all = [...rootPages, ...TR.flatMap(t => readdirSync(new URL(t.dir + '/', root)).filter(f => f.endsWith('.html')).map(f => t.dir + '/' + f))];
const named = process.argv.slice(2).filter(a => a !== '--fix');
const pages = named.length ? named : all;
const problems = [];
const isLesson = p => /^[\w-]+\/\d\d-[\w-]+\.html$/.test(p);
const DATA_RE = /<script type="application\/json" id="lesson-data">[\s\S]*?<\/script>\n?/;
const LESSON_JS = /<script src="(js\/[\w-]+\.js)(?:\?v=[0-9a-f]*)?"><\/script>/;
// The lesson's own script file text ('' when it has none); `read` gets the path inside the track folder.
const lessonJs = (html, p, read = f => { try { return readFileSync(new URL(f, root), 'utf8'); } catch { return ''; } }) => { const m = html.match(LESSON_JS); return m ? '\n' + read(p.split('/')[0] + '/' + m[1]) : ''; };
const bad = (p, m) => problems.push(`${p}: ${m}`);
const count = (s, re) => (s.match(re) || []).length;

for (const p of pages) {
  let html;
  try { html = readFileSync(new URL(p, root), 'utf8'); } catch { bad(p, 'file not found'); continue; }
  const markup = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  // A lesson's own script lives in <track>/js/NN-slug.js: its {en,zh} strings count as if it were inline.
  const scripts = (html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []).join('\n') + (isLesson(p) ? lessonJs(html, p) : '');

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
// Text that --fix generates itself (updated date, canonical, JSON-LD, ?v= versions) does not count as a change to the lesson.
// A lesson's script counts as part of the lesson whether it is inline or in <track>/js/ (moving it is not a change).
const plain = (h, js = '') => h.replace(LESSON_JS, () => '<script>' + js.replace(/^\n/, '') + '</script>').replace(UPD, '').replace(DATA_RE, '').replace(/<link rel="canonical"[^>]*>/, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '').replace(/\?v=[0-9a-f]{8}"/g, '"');
const UPD = /<meta name="updated" content="([^"]*)">\n?/;
const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const git = (...a) => { try { return execFileSync('git', a, { cwd: new URL('.', root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
for (const p of all.filter(isLesson)) {
  const cur = readFileSync(new URL(p, root), 'utf8'), m = cur.match(UPD);
  if (FIX) {
    const head = git('show', `HEAD:${p}`);
    const jsOf = (html, ref) => { const m = html.match(LESSON_JS); return m ? (git('show', `${ref}:${p.split('/')[0]}/${m[1]}`) ?? '') : ''; };
    const jsNow = (() => { const m = cur.match(LESSON_JS); try { return m ? readFileSync(new URL(p.split('/')[0] + '/' + m[1], root), 'utf8') : ''; } catch { return ''; } })();
    const changed = head === null || plain(head, jsOf(head, 'HEAD')) !== plain(cur, jsNow);
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
    ['', 'ecosystem.html', 'glossary.html', ...TR.map(t => t.dir + '/index.html'), ...live.map(x => x.path)].map(u => `<url><loc>${SITE}${u}</loc></url>`).join('\n') + '\n</urlset>\n',
};
const lists = Object.fromEntries(TR.map(t => [t.dir + '/index.html', [/<!-- lessons:start -->[\s\S]*?<!-- lessons:end -->/, '<!-- lessons:start --><noscript><ol>' +
    t.T.topics.flatMap(w => w.items).filter(x => x.file).map(x => `<li><a href="${x.file}">${esc(x.title.en)} · ${esc(x.title.zh)}</a></li>`).join('') + '</ol></noscript><!-- lessons:end -->']]));
const firstOf = t => { const x = t.T.topics.flatMap(w => w.items).find(i => i.file); return x && x.file; };
// The files of every project package (packages/<track>/<name>/**) go into each lesson's data block, so the project card can never miss one.
const walk = (d, pre = '') => { let o = []; try { for (const e of readdirSync(new URL(d, root), { withFileTypes: true })) { if (e.name.startsWith('.')) continue; if (e.isDirectory()) o = o.concat(walk(d + '/' + e.name, pre + e.name + '/')); else o.push(pre + e.name); } } catch {} return o; };
const pkgFilesOf = d => { let dirs = []; try { dirs = readdirSync(new URL('packages/' + d + '/', root), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort(); } catch {} return Object.fromEntries(dirs.map(n => ['packages/' + d + '/' + n, walk('packages/' + d + '/' + n).sort()])); };
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

// ---- Canonical links, JSON-LD, cache-busting versions, vercel.json (all generated; --fix rewrites, otherwise stale = fail) ----
const tracksCtx = { window: {} };
vm.runInNewContext(readFileSync(new URL('tracks.js', root), 'utf8'), tracksCtx, { filename: 'tracks.js' });
const trackMeta = Object.fromEntries(tracksCtx.window.TRACKS.map(t => [t.id, t]));
const LEVELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
const sha = (...fs) => createHash('sha1').update(fs.map(f => readFileSync(new URL(f, root))).reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0))).digest('hex').slice(0, 8);
const hashOf = f => sha(f);
const VERSIONED = /^assets\/(site|teach|build-concepts)\.(js|css)$|^tracks\.js$|^[\w-]+\/lessons\.js$|^[\w-]+\/js\/[\w-]+\.js$/;
const REF = /(\b(?:src|href)=")([^"?#]*)(\?v=[0-9a-f]*)?(")/g;
const resolve = (page, ref) => { const parts = page.split('/').slice(0, -1); for (const seg of ref.split('/')) { if (seg === '..') parts.pop(); else if (seg !== '.' && seg) parts.push(seg); } return parts.join('/'); };
const jsonLd = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const meta = (html, re) => (html.match(re) || [])[1];
const crumbs = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });
const webSite = { '@type': 'WebSite', '@id': SITE + '#site', name: 'TX Learns', url: SITE, inLanguage: ['en', 'zh'] };
const headFor = (p, html) => {
  const url = SITE + (p === 'index.html' ? '' : p);
  const title = (meta(html, /<title>([^<]*)<\/title>/) || '').replace(/ \| TX Learns$/, '');
  const description = meta(html, /<meta name="description" content="([^"]*)"/);
  const own = TR.find(t => p.startsWith(t.dir + '/'));
  let graph;
  if (p === 'index.html') graph = [{ ...webSite, description }];
  else if (own && p === own.dir + '/index.html') {
    const tm = trackMeta[own.id];
    graph = [{ '@type': 'CollectionPage', '@id': url, url, name: tm.title.en, alternateName: tm.title.zh, description, inLanguage: ['en', 'zh'], isPartOf: { '@id': SITE + '#site' } },
      crumbs([['TX Learns', SITE], [tm.title.en, url]])];
  } else if (own) {
    const tm = trackMeta[own.id], file = p.split('/').pop();
    const topic = own.T.topics.find(w => w.items.some(x => x.file === file)), item = topic.items.find(x => x.file === file);
    const mod = meta(html, UPD_RE);
    graph = [{ '@type': 'LearningResource', '@id': url, url, name: item.title.en, alternateName: item.title.zh, description, inLanguage: ['en', 'zh'],
      learningResourceType: 'Interactive lesson', educationalLevel: LEVELS[topic.level], teaches: topic.title.en, ...(mod ? { dateModified: mod } : {}),
      isPartOf: { '@type': 'CollectionPage', name: tm.title.en, url: SITE + own.dir + '/index.html' }, publisher: { '@id': SITE + '#site' } },
      crumbs([['TX Learns', SITE], [tm.title.en, SITE + own.dir + '/index.html'], [item.title.en, url]])];
  } else graph = [{ '@type': 'WebPage', '@id': url, url, name: title, description, inLanguage: ['en', 'zh'], isPartOf: { '@id': SITE + '#site' } }, crumbs([['TX Learns', SITE], [title, url]])];
  return { url, ld: jsonLd({ '@context': 'https://schema.org', '@graph': graph }) };
};
const UPD_RE = /<meta name="updated" content="([^"]*)">/;
const unversioned = [];
// A script file loaded twice runs twice (double nav, listeners, polling): --fix drops the later copy.
const dedupeScripts = html => { const seen = new Set(); return html.replace(/<script src="([^"]+)"><\/script>(\r?\n(?=<script src=))?/g, (m, src) => { const k = src.replace(/\?.*$/, ''); if (seen.has(k)) return ''; seen.add(k); return m; }).replace(/\n{2,}(?=<script)/g, '\n').replace(/(<\/script>)\n(?=\n)/g, '$1'); };
// Each lesson carries its own "Before you start" and project-card data as one small JSON block (no extra requests): the
// source stays in <track>/prereqs.js and <track>/projects.js, and the package file list is read from the packages folder.
const loadWin = f => { const ctx = { window: {} }; try { vm.runInNewContext(readFileSync(new URL(f, root), 'utf8'), ctx, { filename: f }); } catch {} return ctx.window; };
const DATA = {};
for (const t of TR) { const P = loadWin(t.dir + '/prereqs.js').PREREQ || {}, J = loadWin(t.dir + '/projects.js').PROJECTS || {}, F = pkgFilesOf(t.dir);
  for (const f of new Set([...Object.keys(P), ...Object.keys(J)])) { const d = {}; if (P[f]) d.p = P[f]; if (J[f]) { d.j = J[f]; if (J[f].pkg) d.f = F[J[f].pkg.dir] || J[f].pkg.files || []; } DATA[t.dir + '/' + f] = d; } }
const withData = (html, p) => { const d = DATA[p], blk = d ? '<script type="application/json" id="lesson-data">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>\n' : '';
  const bare = html.replace(DATA_RE, ''); return blk && /<script src="\.\.\/tracks\.js/.test(bare) ? bare.replace(/<script src="\.\.\/tracks\.js/, () => blk + '<script src="../tracks.js') : bare; };
// A page that loads its track's lessons.js needs tracks.js before it (site.js used to document.write it, which blocks the parser).
const withTracks = html => /<script src="lessons\.js[^"]*"><\/script>/.test(html) && !/<script src="\.\.\/tracks\.js/.test(html) ? html.replace(/<script src="lessons\.js/, '<script src="../tracks.js"></script><script src="lessons.js') : html;
for (const p of pages) {
  const cur = readFileSync(new URL(p, root), 'utf8');
  const tpl = p === '404.html' || p.split('/').pop().startsWith('_'); // 404.html and _template.html get ?v= versions but no canonical or JSON-LD
  const { url, ld } = tpl ? {} : headFor(p, cur);
  let next = withData(withTracks(dedupeScripts(cur)), p).replace(REF, (m, a, ref, v, z) => {
    const target = resolve(p, ref);
    if (!VERSIONED.test(target) || !existsSync(new URL(target, root))) return m;
    return a + ref + '?v=' + hashOf(target) + z;
  });
  if (!tpl) {
  const canon = `<link rel="canonical" href="${url}">`;
  next = /<link rel="canonical"[^>]*>/.test(next) ? next.replace(/<link rel="canonical"[^>]*>/, canon) : next.replace(/(<link rel="icon")/, canon + '$1');
  next = /<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(next) ? next.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => ld) : next.replace('</head>', () => ld + '</head>');
  }
  if (next !== cur) { if (FIX) writeFileSync(new URL(p, root), next); else bad(p, (dedupeScripts(cur) !== cur ? 'a script file is loaded twice, ' : '') + (withTracks(cur) !== cur ? 'tracks.js is not loaded before lessons.js, ' : '') + (withData(withTracks(cur), p) !== withTracks(cur) ? 'the lesson data block is out of date, ' : '') + 'canonical link, JSON-LD or ?v= asset versions out of date (run node scripts/check-pages.mjs --fix)'); }
  // Every use of a file that vercel.json caches as immutable must carry ?v=.
  for (const m of (FIX ? next : cur).matchAll(REF)) { const t = resolve(p, m[2]); if (/^assets\/(site|teach|build-concepts)\.(js|css)$|^[\w-]+\/js\/[\w-]+\.js$/.test(t) && !m[3]) unversioned.push(`${p}: ${m[2]}`); }
}
for (const u of unversioned) bad(u.split(':')[0], 'asset cached as immutable has no ?v= version: ' + u.split(': ')[1]);

// Moved or renamed pages: scripts/redirects.json [{from,to}] becomes vercel.json redirects. A published URL is never deleted.
let moves = [];
try { moves = JSON.parse(readFileSync(new URL('scripts/redirects.json', root), 'utf8')); } catch { bad('scripts/redirects.json', 'missing or not valid JSON (an array of {"from":"/old.html","to":"/new.html"})'); }
const exists = u => u === '/' || existsSync(new URL(u.replace(/^\//, ''), root));
const froms = new Set(moves.map(m => m.from));
for (const m of moves) {
  if (!m || !/^\//.test(m.from || '') || !/^(\/|https:\/\/)/.test(m.to || '')) { bad('scripts/redirects.json', 'each entry needs from ("/old") and to ("/new" or https://...): ' + JSON.stringify(m)); continue; }
  if (exists(m.from) && m.from !== '/') bad('scripts/redirects.json', `${m.from} still exists as a page; remove the redirect or the page`);
  if (m.to.startsWith('/') && !exists(m.to)) bad('scripts/redirects.json', `${m.to} (target of ${m.from}) does not exist`);
  if (froms.has(m.to)) bad('scripts/redirects.json', `${m.from} → ${m.to} is a chain: point it straight at the final page`);
}
{ // every URL in the sitemap of main (or the last commit) must still open, or redirect
  let base = null;
  for (const ref of ['origin/main', 'HEAD']) { base = git('show', `${ref}:sitemap.xml`); if (base) break; }
  for (const m of (base || '').matchAll(/<loc>([^<]*)<\/loc>/g)) {
    const path = '/' + m[1].slice(SITE.length);
    if (m[1].startsWith(SITE) && !exists(path) && !froms.has(path)) bad('sitemap.xml', `${path} was published but is gone: add it to scripts/redirects.json (never delete a published URL)`);
  }
}
{ // vercel.json: keep every other key, own `headers` and `redirects`
  const vp = new URL('vercel.json', root);
  let cfg = {}; try { cfg = JSON.parse(readFileSync(vp, 'utf8')); } catch {}
  const h = (source, value) => ({ source, headers: [{ key: 'Cache-Control', value }] });
  const want = { ...cfg, headers: [
    h('/', 'public, max-age=0, must-revalidate'),
    h('/(.*)\\.html', 'public, max-age=0, must-revalidate'),
    // only the files every page references with ?v=<hash> (checked above) are immutable
    h('/assets/(site\\.js|site\\.css|teach\\.js|teach\\.css|build-concepts\\.js|search\\.js)', 'public, max-age=31536000, immutable'),
    // each lesson's own script (<track>/js/NN-slug.js) is versioned the same way
    h('/(' + TR.map(t => t.dir).join('|') + ')/js/(.+\\.js)', 'public, max-age=31536000, immutable'),
    h('/assets/fonts/(.+\\.woff2)', 'public, max-age=31536000, immutable'),
    h('/assets/(.+\\.(?:svg|png|jpg|ico|webp))', 'public, max-age=3600, stale-while-revalidate=86400'),
  ], redirects: moves.filter(m => m && m.from && m.to).map(m => ({ source: m.from, destination: m.to, permanent: true })) };
  if (!want.redirects.length) delete want.redirects;
  const text = JSON.stringify(want, null, 2) + '\n';
  let curText = ''; try { curText = readFileSync(vp, 'utf8'); } catch {}
  if (curText !== text) { if (FIX) writeFileSync(vp, text); else bad('vercel.json', 'cache headers or redirects out of date (run node scripts/check-pages.mjs --fix)'); }
}

// The concept cards on ecosystem.html (assets/build-concepts.js): every lesson link is a published lesson with the titles in lessons.js.
try {
  const w = {}; new Function('window', readFileSync(new URL('assets/build-concepts.js', root), 'utf8'))(w);
  for (const c of w.BUILD_CONCEPTS || []) for (const l of c.lessons) {
    const hit = live.find(x => x.path === l.d + '/' + l.f);
    if (!hit) bad('assets/build-concepts.js', `${c.id}: ${l.d}/${l.f} is not a published lesson`);
    else if (hit.title.en !== l.en || hit.title.zh !== l.zh) bad('assets/build-concepts.js', `${c.id}: title of ${l.f} differs from lessons.js`);
  }
} catch (e) { bad('assets/build-concepts.js', 'cannot read: ' + e.message); }
if (problems.length) { console.log(`✗ Page check failed (${problems.length}):\n` + problems.map(x => '  - ' + x).join('\n')); process.exit(1); }
console.log(`✓ Page check passed: ${pages.length} pages have lang, title, description, link previews, favicon, alt text, heading order, EN/中文 twins and an updated date on each lesson; sitemap, lesson list and start links match lessons.js.`);
