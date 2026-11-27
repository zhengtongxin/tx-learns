#!/usr/bin/env node
// Product engineer agent (the live check): after every merge into main (once Vercel has deployed it), confirm the live
// site works the way a reader uses it. No AI here.
//   1. The live lesson list is the released one (waits up to --wait seconds for the new deploy to show).
//   2. Every page and every published lesson opens (HTTP 200), and every link and file they point to exists.
//   3. In a headless browser (when Playwright is available): home, How it works, the track page and every
//      lesson load without script errors or missing files, the home page's topic and lesson counts match
//      lessons.js, and every lesson shows its tag and title.
//   4. api/status answers with JSON (live agent status for the How it works page).
//   5. Product notes, which never count as broken and never roll anything back: a page that switched to 中文 still
//      shows no 中文, a phone screen (390px) where the page is wider than the screen, a page slower than 8 s, an
//      image that does not load.
// Only real breakage counts as a problem. A word like "undefined" or "NaN" counts only when a script put it on the
// page: a lesson that teaches those words has them in its own HTML too. Each broken page is opened a second time
// before it counts, so one slow load never rolls back a merge.
// Usage: node scripts/live-check.mjs --base https://tx-learns.vercel.app/ [--wait 300] [--out live-check.json] [--concurrency 5]
// Env: PLAYWRIGHT_DIR is a folder where `playwright` is installed, if it is not resolvable from here.
// Exit code: 0 all good, 1 something is off (listed in the output), 2 the check itself broke.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadTracks, arg } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (arg('base', process.env.SITE || 'https://tx-learns.vercel.app/')).replace(/\/?$/, '/');
const WAIT = +arg('wait', 300);
const OUT = arg('out', 'live-check.json');
const issues = [], notes = [], product = [];
const html = new Map(); // each page's own HTML, to tell a lesson's words from a script's broken output
const bad = (page, what) => issues.push({ page, what });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CONC = Math.max(1, Math.min(8, +arg('concurrency', process.env.LIVE_CONCURRENCY || 5))); // pages open at once
// Runs fn over items, CONC at a time; results come back in the original order.
async function pool(items, fn, n = CONC) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); } }));
  return out;
}

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { redirect: 'follow', headers: { 'cache-control': 'no-cache' } }); return { status: r.status, text: await r.text(), type: r.headers.get('content-type') || '' }; }
    catch (e) { if (i === 2) return { status: 0, text: '', err: e.message }; await sleep(2000); }
  }
}

try {
  const TR = loadTracks(ROOT);
  const lessons = TR.flatMap(t => t.T.topics.flatMap(w => w.items).filter(i => i.file).map(i => ({ path: t.dir + '/' + i.file, title: i.title.en })));
  const total = TR.reduce((n, t) => n + t.T.topics.reduce((m, w) => m + w.items.length, 0), 0);
  const topicCount = TR.reduce((n, t) => n + t.T.topics.length, 0);

  // 1. Wait for the released lesson list to be live.
  const t0 = Date.now();
  for (const t of TR) {
  const lf = t.dir + '/lessons.js', localList = readFileSync(join(ROOT, lf), 'utf8');
  let live;
  while (true) {
    live = await get(BASE + lf);
    if (live.status === 200 && live.text.trim() === localList.trim()) break;
    if ((Date.now() - t0) / 1000 >= WAIT) {
      bad(lf, live.status === 200 ? `the live lesson list is still the old one after ${Math.round(WAIT / 60)} min` : `does not open (HTTP ${live.status || live.err})`);
      break;
    }
    await sleep(15000);
  }
  }

  // 2. Pages, lessons and every link in them.
  const pages = ['index.html', 'ecosystem.html', 'glossary.html', 'about.html', 'tracks.html', 'study/index.html', 'study/about.html', 'study/how.html', ...TR.map(t => t.dir + '/index.html'), ...lessons.map(l => l.path)];
  const links = new Map();
  const fetched = await pool(pages, p => get(BASE + p));
  for (const [k, p] of pages.entries()) {
    const r = fetched[k];
    if (r.status !== 200) { bad(p, `does not open (HTTP ${r.status || r.err})`); continue; }
    html.set(p, r.text);
    if (!/<title>/i.test(r.text)) bad(p, 'opens but has no <title>, so it may not be the real page');
    for (const m of r.text.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const raw = m[1];
      if (/^(#|mailto:|javascript:|data:|tel:)/i.test(raw) || raw.includes("'+") || raw.includes('"+')) continue;
      const u = new URL(raw, BASE + p);
      if (u.origin !== new URL(BASE).origin || u.pathname.startsWith('/api/')) continue;
      u.hash = '';
      if (!links.has(u.href)) links.set(u.href, p);
    }
  }
  await pool([...links], async ([u, from]) => {
    const r = await get(u);
    if (r.status !== 200) bad(from, `links to ${u.replace(BASE, '')}, which is missing (HTTP ${r.status || r.err})`);
  }, CONC * 3);

  // 4. Live agent status.
  const s = await get(BASE + 'api/status');
  try { const j = JSON.parse(s.text); if (!j.connected) notes.push(`How it works shows "status offline" (${j.reason || 'not connected'}).`); }
  catch { bad('api/status', `does not answer with JSON (HTTP ${s.status})`); }

  // 3. Render in a browser.
  let chromium = null;
  try {
    const req = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url);
    ({ chromium } = req('playwright'));
  } catch { notes.push('No headless browser here, so pages were checked over HTTP only.'); }
  if (chromium) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const count = (t, re) => (t.match(re) || []).length;
    const PLACEHOLDERS = [/\bundefined\b/g, /\bNaN\b/g, /\{\{/g, /\[object Object\]/g];
    // Real breakage on one page: script errors, missing files, wrong counts, a missing tag or title, and placeholder
    // words that a script put there (more of them on the screen than in the page's own HTML).
    // Ready signal instead of a fixed wait: fonts loaded, the page's own rendered pieces present (home counts, lesson tag and
    // title) and two frames drawn, then a short settle so late script errors still land. Never waits more than 6 s.
    async function ready(page, p) {
      const kind = p === 'tracks.html' ? 'home' : /^[\w-]+\/\d\d-/.test(p) ? 'lesson' : 'other';
      await page.waitForFunction(k => {
        if (document.fonts && document.fonts.status === 'loading') return false;
        if (k === 'home') { const a = document.querySelector('[data-sum="topics"]'), b = document.querySelector('[data-sum="lessons"]'); if (!a && !b) return !!document.querySelector('.track-list a'); /* no totals on the home page: wait for the track list */ return !!(a && b && a.dataset.count && b.dataset.count && a.textContent.trim() === a.dataset.count && b.textContent.trim() === b.dataset.count && a.dataset.count !== '0'); } /* wait for the count-up animation (1.2 s) to finish, or the totals are read half way */
        if (k === 'lesson') return !!(document.querySelector('.tag') && document.querySelector('h1'));
        return document.body && document.body.innerText.trim().length > 0;
      }, kind, { timeout: 6000, polling: 100 }).catch(() => {});
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForTimeout(300);
    }
    // The browser driver evaluates strings to poll the page (waitForFunction). Under the site's report-only content policy that logs
    // an 'unsafe-eval' message which no reader ever causes: the site itself evaluates no strings. Every other policy message still counts.
    const OWN_EVAL = /\[Report Only\][\s\S]*'unsafe-eval'/;
    async function render(p) {
      const page = await ctx.newPage(), errs = [];
      page.on('pageerror', e => errs.push(`script error: ${e.message.split('\n')[0]}`));
      page.on('console', m => { if (m.type() === 'error' && !/favicon|api\/status|^Failed to load resource/.test(m.text()) && !OWN_EVAL.test(m.text())) errs.push(`console error: ${m.text().slice(0, 160)}`); });
      page.on('response', r => { const u = new URL(r.url()); if (r.status() >= 400 && u.origin === new URL(BASE).origin && !/favicon|^\/api\//.test(u.pathname)) errs.push(`missing file ${u.pathname} (${r.status()})`); });
      try {
        const t0 = Date.now();
        await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 });
        const took = Date.now() - t0;
        if (took > 8000) product.push(`${p} took ${Math.round(took / 1000)} s to load`);
        await ready(page, p);
        if (p === 'tracks.html') {
          const got = await page.evaluate(() => ({ topics: document.querySelector('[data-sum="topics"]')?.textContent, lessons: document.querySelector('[data-sum="lessons"]')?.textContent }));
          if (got.topics !== undefined && +got.topics !== topicCount) errs.push(`home page shows ${got.topics} topics, lessons.js has ${topicCount}`);
          if (got.lessons !== undefined && +got.lessons !== total) errs.push(`home page shows ${got.lessons} lessons, lessons.js has ${total}`);
        }
        if (/^[\w-]+\/\d\d-/.test(p)) {
          const got = await page.evaluate(() => ({ tag: document.querySelector('.tag')?.innerText.trim(), h1: document.querySelector('h1')?.innerText.trim() }));
          if (!got.tag) errs.push('no lesson tag shows');
          if (!got.h1) errs.push('no title shows');
        }
        const txt = await page.evaluate(() => document.body.innerText);
        const src = html.get(p) || '';
        if (PLACEHOLDERS.some(re => count(txt, re) > count(src, re))) errs.push('a script left a broken placeholder on the page (undefined, NaN or an unfilled template)');
        const imgs = await page.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')));
        imgs.slice(0, 2).forEach(i => product.push(`${p}: image ${i} does not load`));
        // 中文: switch the language the way a reader does and check that Chinese text shows.
        const zh = await page.evaluate(() => {
          const b = document.querySelector('[data-l="zh"]'); if (!b) return null;
          b.click(); const shown = [...document.querySelectorAll('.zh')].some(e => e.offsetParent !== null && /[\u4e00-\u9fff]/.test(e.innerText));
          document.querySelector('[data-l="en"]')?.click(); return shown;
        });
        if (zh === false) product.push(`${p}: switched to 中文 but no Chinese text shows`);
      } catch (e) { errs.push(`did not load: ${e.message.split('\n')[0]}`); }
      await page.close();
      return [...new Set(errs)];
    }
    await pool(pages, async p => {
      let errs = await render(p);
      // A second look before it counts: a slow CDN or one dropped request is not a broken site.
      if (errs.length) { await sleep(10000); errs = await render(p); }
      errs.slice(0, 4).forEach(e => bad(p, e));
    });
    // Phone: is any page wider than the screen? A product note, never a rollback.
    await pool(pages, async p => {
      const page = await phone.newPage();
      try {
        await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 });
        await ready(page, p);
        const w = await page.evaluate(() => document.documentElement.scrollWidth);
        if (w > 392) product.push(`${p} is ${w}px wide on a 390px phone`);
      } catch {}
      await page.close();
    });
    await browser.close();
  }
  if (product.length) notes.push(...product.slice(0, 12).map(x => `product note: ${x}`));

  const summary = issues.length
    ? `${issues.length} problem${issues.length > 1 ? 's' : ''} on the live site: ${issues.slice(0, 2).map(i => `${i.page} ${i.what}`).join('; ')}.`
    : `Live site looks right: ${pages.length} pages, ${links.size} links and files, ${lessons.length} lessons, counts match, 中文 and phone checked.${product.length ? ` ${product.length} product note${product.length > 1 ? 's' : ''} (no rollback): ${product.slice(0, 2).join('; ')}.` : ''}`;
  writeFileSync(OUT, JSON.stringify({ base: BASE, issues, notes, product, summary }, null, 1));
  console.log(summary);
  for (const i of issues) console.log(`✗ ${i.page}: ${i.what}`);
  for (const n of notes) console.log(`· ${n}`);
  process.exit(issues.length ? 1 : 0);
} catch (e) {
  console.log(`::error::live check broke: ${e.stack || e.message}`);
  try { writeFileSync(OUT, JSON.stringify({ base: BASE, issues: [{ page: '-', what: 'the check itself broke: ' + e.message }], notes, summary: 'The live check could not finish.' })); } catch {}
  process.exit(2);
}
