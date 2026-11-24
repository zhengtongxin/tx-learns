#!/usr/bin/env node
// Quality check, part 1 (accessibility and weight). Opens every page in a headless browser on a desktop and a phone, in EN and 中文,
// and runs axe-core on it. No AI: the same page always gets the same result.
//   fails on   serious/critical axe violations (colour contrast included, in both languages); something you can click or type in
//              that Tab never reaches, or a positive tabindex; a lesson page whose HTML + assets weigh over 1.5 MB; any <img> without
//              width and height
//   notes on   moderate/minor axe findings, other pages over 1 MB, many requests
// axe-core is not a dependency of the repo: the workflow installs it (`npm install --no-save axe-core@4.10.2`) and AXE_DIR points at it.
// Usage: node scripts/check-a11y.mjs [--base URL] [--pages a.html,b.html] [--out DIR]
// Env: PLAYWRIGHT_DIR / AXE_DIR are folders where `playwright` / `axe-core` are installed (node_modules inside), if not resolvable here.
// Exit code: 0 nothing failed (notes are fine), 1 something failed, 2 the check itself broke.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { arg, allPages, serve } from './lib-quality.mjs';

const OUT = resolve(arg('out', 'quality-out'));
const modReq = dir => createRequire(dir ? join(resolve(dir), 'node_modules/') : import.meta.url);
const { chromium } = modReq(process.env.PLAYWRIGHT_DIR)('playwright');
let axeSrc;
try { axeSrc = readFileSync(modReq(process.env.AXE_DIR).resolve('axe-core/axe.min.js'), 'utf8'); }
catch { console.error('axe-core is not installed. Run: npm install --no-save --prefix <dir> axe-core@4.10.2 and set AXE_DIR=<dir>'); process.exit(2); }

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1280, height: 800 } },
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
const LANGS = ['en', 'zh'];
const MAX_BYTES = 1.5 * 1024 * 1024, NOTE_BYTES = 1024 * 1024, NOTE_REQS = 60, MAX_TABS = 90;
const isLesson = p => /\/\d\d-[^/]+\.html$/.test(p);

const fails = [], notes = [], weights = [];
// The same finding on several screens or languages is one entry that lists where it showed.
const seen = new Map();
const add = (list, page, where, what) => {
  const k = `${page}|${what}`, e = seen.get(k);
  if (e) { if (!e.wheres.includes(where)) e.wheres.push(where); return; }
  const n = { page, wheres: [where], what }; seen.set(k, n); list.push(n);
};

async function checkOne(browser, base, p, vp, lang) {
  const where = `${vp.name} ${lang === 'zh' ? '中文' : 'EN'}`;
  const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, locale: lang === 'zh' ? 'zh-CN' : 'en-US' });
  await ctx.addInitScript(l => { try { localStorage.setItem('learn-lang', l); } catch {} }, lang);
  const page = await ctx.newPage();
  let bytes = 0, reqs = 0;
  const sizes = [];
  page.on('response', r => { reqs++; sizes.push(r.body().then(b => { bytes += b.length; }).catch(() => {})); });
  try {
    const res = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 30000 });
    if (!res || (res.status() >= 400 && p !== '404.html')) { add(fails, p, where, `did not load (HTTP ${res ? res.status() : 'none'})`); return; }
    await page.waitForTimeout(300);
    await Promise.all(sizes);

    // 1. axe-core
    await page.evaluate(src => { (0, eval)(src); }, axeSrc);
    const ax = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })
      .then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')), count: v.nodes.length }))));
    for (const v of ax) {
      const msg = `${v.id} (${v.impact}, ${v.count}x): ${v.help}. e.g. ${v.nodes.join(' | ')}`;
      add(v.impact === 'serious' || v.impact === 'critical' ? fails : notes, p, where, msg);
    }

    // 2. Focus order: everything a person can click or type in must be reachable with Tab.
    const want = await page.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[inert],[hidden],[aria-hidden="true"]'); };
      const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
      const els = [...document.querySelectorAll(sel)].filter(e => !e.disabled && vis(e) && !e.closest('[data-uicheck-skip]'));
      els.forEach((e, i) => e.setAttribute('data-q-id', i));
      return { n: els.length, pos: els.filter(e => +e.getAttribute('tabindex') > 0).length,
        desc: els.map(e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '')).slice(0, 60)) };
    });
    if (want.pos) add(fails, p, where, `${want.pos} element(s) with a positive tabindex (breaks the natural focus order)`);
    if (want.n <= MAX_TABS) {
      const reached = new Set();
      await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
      for (let i = 0; i < want.n + 15 && reached.size < want.n; i++) {
        await page.keyboard.press('Tab');
        const id = await page.evaluate(() => { const a = document.activeElement; return a && a.getAttribute ? a.getAttribute('data-q-id') : null; });
        if (id !== null) reached.add(+id);
      }
      const missing = want.desc.filter((_, i) => !reached.has(i));
      if (missing.length) add(fails, p, where, `Tab never reaches ${missing.length} of ${want.n} controls: ${missing.slice(0, 5).join(', ')}`);
    }

    // 3. Weight and images (once per page: the desktop EN run is the reference).
    if (vp.name === 'desktop' && lang === 'en') {
      const kb = Math.round(bytes / 1024);
      if (bytes > (isLesson(p) ? MAX_BYTES : NOTE_BYTES)) add(isLesson(p) ? fails : notes, p, 'weight', `page weight ${kb} KB, over ${isLesson(p) ? '1.5 MB' : '1 MB'}, in ${reqs} requests`);
      if (reqs > NOTE_REQS) add(notes, p, 'weight', `${reqs} requests (${kb} KB)`);
      weights.push({ page: p, kb, requests: reqs });
      const noDims = await page.evaluate(() => [...document.images].filter(i => !(i.hasAttribute('width') && i.hasAttribute('height'))).map(i => (i.getAttribute('src') || 'inline').slice(0, 60)));
      if (noDims.length) add(fails, p, 'images', `${noDims.length} image(s) without width and height: ${noDims.slice(0, 3).join(', ')}`);
    }
  } catch (e) {
    add(fails, p, where, `the check broke on this page: ${String(e.message || e).split('\n')[0]}`);
  } finally { await ctx.close(); }
}

const pages = arg('pages') ? arg('pages').split(/[,\s]+/).filter(Boolean) : allPages();
const { srv, base: local } = await serve();
const base = (arg('base') || local).replace(/\/?$/, '/');
let browser;
try {
  browser = await chromium.launch();
  const jobs = [];
  for (const p of pages) for (const vp of VIEWPORTS) for (const lang of LANGS) jobs.push([p, vp, lang]);
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const [p, vp, lang] = jobs[next++]; await checkOne(browser, base, p, vp, lang); } };
  await Promise.all(Array.from({ length: 4 }, worker));
} catch (e) { console.error('The accessibility check could not finish: ' + e.message); process.exit(2); }
finally { if (browser) await browser.close(); srv.close(); }

const heavy = weights.sort((a, b) => b.kb - a.kb).slice(0, 3).map(w => `${w.page} ${w.kb} KB`).join(', ');
const summary = fails.length
  ? `${fails.length} accessibility or weight problem(s) on ${new Set(fails.map(f => f.page)).size} page(s), ${notes.length} note(s).`
  : `${pages.length} pages: no serious accessibility problems, focus order and page weight fine${notes.length ? `, ${notes.length} note(s)` : ''}.`;
const md = ['# Accessibility check', summary, heavy ? `Heaviest: ${heavy}.` : '', '',
  ...(fails.length ? ['## Problems', ...fails.map(f => `- ${f.page} [${f.wheres.join(', ')}] ${f.what}`), ''] : []),
  ...(notes.length ? ['## Notes', ...notes.map(f => `- ${f.page} [${f.wheres.join(', ')}] ${f.what}`), ''] : [])].join('\n');
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'a11y.json'), JSON.stringify({ summary, pages: pages.length, fails, notes, weights }, null, 1));
writeFileSync(join(OUT, 'a11y.md'), md);
console.log(md);
process.exit(fails.length ? 1 : 0);
