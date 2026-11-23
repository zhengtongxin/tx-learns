#!/usr/bin/env node
// Live check agent: twice a day (12 PM and 12 AM Malaysia time), confirm the live site looks right. No AI here.
//   1. The live lesson list is the released one (waits up to --wait seconds for the new deploy to show).
//   2. Every page and every published lesson opens (HTTP 200), and every link and file they point to exists.
//   3. In a headless browser (when Playwright is available): home, How it works, the track page and every
//      lesson load without script errors or missing files, the home page's topic and lesson counts match
//      lessons.js, and every lesson shows its tag and title.
//   4. api/status answers with JSON (live agent status for the How it works page).
// Usage: node scripts/live-check.mjs --base https://tx-learns.vercel.app/ [--wait 300] [--out live-check.json]
// Env: PLAYWRIGHT_DIR is a folder where `playwright` is installed, if it is not resolvable from here.
// Exit code: 0 all good, 1 something is off (listed in the output), 2 the check itself broke.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadTrack, arg } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (arg('base', process.env.SITE || 'https://tx-learns.vercel.app/')).replace(/\/?$/, '/');
const WAIT = +arg('wait', 300);
const OUT = arg('out', 'live-check.json');
const issues = [], notes = [];
const bad = (page, what) => issues.push({ page, what });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { redirect: 'follow', headers: { 'cache-control': 'no-cache' } }); return { status: r.status, text: await r.text(), type: r.headers.get('content-type') || '' }; }
    catch (e) { if (i === 2) return { status: 0, text: '', err: e.message }; await sleep(2000); }
  }
}

try {
  const localList = readFileSync(join(ROOT, 'agentic-ai/lessons.js'), 'utf8');
  const T = loadTrack(localList);
  const lessons = T.topics.flatMap(w => w.items).filter(i => i.file).map(i => ({ path: 'agentic-ai/' + i.file, title: i.title.en }));
  const total = T.topics.reduce((n, w) => n + w.items.length, 0);

  // 1. Wait for the released lesson list to be live.
  const t0 = Date.now();
  let live;
  while (true) {
    live = await get(BASE + 'agentic-ai/lessons.js');
    if (live.status === 200 && live.text.trim() === localList.trim()) break;
    if ((Date.now() - t0) / 1000 >= WAIT) {
      bad('agentic-ai/lessons.js', live.status === 200 ? `the live lesson list is still the old one after ${Math.round(WAIT / 60)} min` : `does not open (HTTP ${live.status || live.err})`);
      break;
    }
    await sleep(15000);
  }

  // 2. Pages, lessons and every link in them.
  const pages = ['index.html', 'ecosystem.html', 'agentic-ai/index.html', ...lessons.map(l => l.path)];
  const links = new Map();
  for (const p of pages) {
    const r = await get(BASE + p);
    if (r.status !== 200) { bad(p, `does not open (HTTP ${r.status || r.err})`); continue; }
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
  for (const [u, from] of links) {
    const r = await get(u);
    if (r.status !== 200) bad(from, `links to ${u.replace(BASE, '')}, which is missing (HTTP ${r.status || r.err})`);
  }

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
    for (const p of ['index.html', 'ecosystem.html', 'agentic-ai/index.html', ...lessons.map(l => l.path)]) {
      const page = await ctx.newPage(), errs = [];
      page.on('pageerror', e => errs.push(`script error: ${e.message.split('\n')[0]}`));
      page.on('console', m => { if (m.type() === 'error' && !/favicon|api\/status|^Failed to load resource/.test(m.text())) errs.push(`console error: ${m.text().slice(0, 160)}`); });
      page.on('response', r => { const u = new URL(r.url()); if (r.status() >= 400 && u.origin === new URL(BASE).origin && !/favicon|^\/api\//.test(u.pathname)) errs.push(`missing file ${u.pathname} (${r.status()})`); });
      try {
        await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(1800);
        if (p === 'index.html') {
          const got = await page.evaluate(() => ({ topics: document.querySelector('[data-sum="topics"]')?.textContent, lessons: document.querySelector('[data-sum="lessons"]')?.textContent }));
          if (+got.topics !== T.topics.length) errs.push(`home page shows ${got.topics} topics, lessons.js has ${T.topics.length}`);
          if (+got.lessons !== total) errs.push(`home page shows ${got.lessons} lessons, lessons.js has ${total}`);
        }
        if (p.startsWith('agentic-ai/') && /\d\d-/.test(p)) {
          const got = await page.evaluate(() => ({ tag: document.querySelector('.tag')?.innerText.trim(), h1: document.querySelector('h1')?.innerText.trim() }));
          if (!got.tag) errs.push('no lesson tag shows');
          if (!got.h1) errs.push('no title shows');
        }
        const txt = await page.evaluate(() => document.body.innerText);
        if (/\bundefined\b|\bNaN\b|\{\{/.test(txt)) errs.push('the page shows "undefined", "NaN" or "{{" somewhere');
      } catch (e) { errs.push(`did not load: ${e.message.split('\n')[0]}`); }
      [...new Set(errs)].slice(0, 4).forEach(e => bad(p, e));
      await page.close();
    }
    await browser.close();
  }

  const summary = issues.length
    ? `${issues.length} problem${issues.length > 1 ? 's' : ''} on the live site: ${issues.slice(0, 2).map(i => `${i.page} ${i.what}`).join('; ')}.`
    : `Live site looks right: ${pages.length} pages, ${links.size} links and files, ${lessons.length} lessons, counts match.`;
  writeFileSync(OUT, JSON.stringify({ base: BASE, issues, notes, summary }, null, 1));
  console.log(summary);
  for (const i of issues) console.log(`✗ ${i.page}: ${i.what}`);
  for (const n of notes) console.log(`· ${n}`);
  process.exit(issues.length ? 1 : 0);
} catch (e) {
  console.log(`::error::live check broke: ${e.stack || e.message}`);
  try { writeFileSync(OUT, JSON.stringify({ base: BASE, issues: [{ page: '-', what: 'the check itself broke: ' + e.message }], notes, summary: 'The live check could not finish.' })); } catch {}
  process.exit(2);
}
