#!/usr/bin/env node
// Frontend engineer agent (the UI check): opens pages in a headless browser and uses them the way a person does. It hovers, clicks
// and Tabs through every interactive element, on a desktop and a phone screen, and flags:
//   popup-overlap   two popups open at once and covering each other (one should close when the other opens)
//   popup-offscreen a popup that runs off the side of the screen
//   popup-covered   other content paints over an open popup (it opens "behind" the page)
//   popup-see-through a popup whose background lets the page show through, so its text is hard to read
//   overflow        the page is wider than the screen (sideways scrolling on a phone)
//   keyboard        something you can click (pointer cursor or click handler) that Tab never reaches, so keyboard users cannot use it
//   js-error        an uncaught error, console.error, or a request for a file that is missing
//   load            the page did not load
// No AI here: the same page always gets the same result.
//
// Usage: node scripts/ui-check.mjs [--base URL] [--pages a.html,b.html] [--out DIR] [--shots a.html,b.html]
//   --base   site to test. Without it, the repo folder is served locally (the site is plain static files).
//   --pages  pages to test (default: home, How it works, track index and every published lesson).
//   --shots  pages to also save one desktop and one phone screenshot of (top of the page, capped), for the visual pass (default: none).
//   --out    where ui-check.json, ui-check.md and the screenshots go (default: ui-check-out).
// Env: VERCEL_AUTOMATION_BYPASS_SECRET lets it open a protected Vercel preview.
//      PLAYWRIGHT_DIR is a folder where `playwright` is installed, if it is not resolvable from here.
// Exit code: 0 when nothing is flagged, 1 when something is, 2 when the check itself broke.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const list = s => (s || '').split(/[,\s]+/).map(x => x.trim().replace(/^\/+/, '')).filter(Boolean);
const OUT = resolve(arg('out', 'ui-check-out'));
const req = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url);
const { chromium } = req('playwright');

// --fit: the cheap merge-blocking mode. Phone only, no screenshots and no Tab walk, and only two kinds count:
// content wider than the screen and a popup running off the side. Everything else stays with the full check.
const FIT = process.argv.includes('--fit'), FIT_KINDS = new Set(['overflow', 'popup-offscreen']);
const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, hover: true },
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, hover: false },
];
const MAX_TARGETS = 60, MAX_TABS = 40;
// Site chrome (top bar, side menu) is the same on every page and changes language/theme; skip it.
const SKIP = '.top, .side, .prog, [data-uicheck-skip]';

function defaultPages() {
  const dirs = readdirSync(ROOT).filter(d => existsSync(join(ROOT, d, 'lessons.js')));
  const lessons = dirs.flatMap(d => readdirSync(join(ROOT, d)).filter(f => /^\d+.*\.html$/.test(f)).sort().map(f => d + '/' + f));
  return ['index.html', 'ecosystem.html', 'glossary.html', 'about.html', ...dirs.map(d => d + '/index.html'), ...lessons].filter(p => existsSync(join(ROOT, p)));
}

// A tiny static server for the repo folder, so the check works without reaching Vercel.
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
function serve() {
  return new Promise(ok => {
    const srv = createServer((q, r) => {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      if (p === '/api/status') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(fakeStatus()); }
      const f = join(ROOT, p);
      if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end('not found'); }
      r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
      r.end(readFileSync(f));
    });
    srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

// What /api/status returns on the live site, filled with long summaries, so the local copy shows full-size popups.
function fakeStatus() {
  let ids = [];
  try { ids = [...readFileSync(join(ROOT, 'ecosystem.html'), 'utf8').matchAll(/\{id:'([a-z0-9-]+)'/g)].map(m => m[1]); } catch {}
  const at = new Date(Date.now() - 5 * 60e3).toISOString(), agents = {};
  const summary = 'PR #99: Ready to merge. No lesson files changed. This run checked every page and every widget, and the copy check passed. One minor note about a long line that wraps on a narrow phone screen.';
  ids.forEach((id, i) => {
    const e = { state: 'ok', summary, link: 'https://github.com/', at };
    // Every other agent is mid-run, so the yellow "working" look is checked too.
    agents[id] = { ...e, runs: 12, history: [e, e, e], ...(i % 2 ? { now: { at: new Date().toISOString(), run: '1', link: e.link } } : {}) };
  });
  return JSON.stringify({ connected: true, agents, updated: at });
}

// Runs inside the page. Marks interactive elements, finds popups and checks them.
function pageHelpers(SKIP) {
  const vis = el => {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false;
    }
    return true;
  };
  const desc = el => {
    if (!el) return '?';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
    const host = el.closest('[id]');
    if (host && host !== el) s = '#' + host.id + ' ' + s;
    const txt = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return txt ? `${s} "${txt}"` : s;
  };
  const floating = el => { const p = getComputedStyle(el).position; return p === 'absolute' || p === 'fixed'; };
  // Popups = floating boxes big enough to hold text that were not on screen when the page loaded.
  const popups = () => {
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest(SKIP) || window.__uicBase.has(el) || !floating(el) || el instanceof SVGElement && !(el instanceof SVGSVGElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 60 || r.height < 30 || !vis(el)) continue;
      if (getComputedStyle(el).pointerEvents === 'none' && !(el.innerText || '').trim()) continue;
      out.push(el);
    }
    return out.filter(el => !out.some(o => o !== el && o.contains(el)));
  };
  window.__uic = {
    init() {
      window.__uicBase = new Set();
      for (const el of document.body.querySelectorAll('*')) if (floating(el) && vis(el)) window.__uicBase.add(el);
    },
    mark(MAX) {
      const sel = 'button, [role=button], [tabindex]:not([tabindex="-1"]), summary, [data-agent], .agent, [onclick], input[type=checkbox], input[type=radio]';
      const els = [...document.querySelectorAll(sel)].filter(el => !el.closest(SKIP) && vis(el));
      els.slice(0, MAX).forEach((el, i) => el.setAttribute('data-uic', i));
      return els.slice(0, MAX).map((el, i) => ({ i, desc: desc(el), link: !!el.closest('a[href]') && !el.closest('a[href^="#"]') }));
    },
    check(step) {
      const issues = [], W = document.documentElement.clientWidth;
      const ps = popups().map(el => ({ el, r: el.getBoundingClientRect() }));
      for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) {
        const A = ps[a].r, B = ps[b].r;
        const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
        if (w > 12 && h > 12) issues.push({ kind: 'popup-overlap', key: desc(ps[a].el) + '|' + desc(ps[b].el),
          msg: `Two popups are open at once and overlap: ${desc(ps[a].el)} and ${desc(ps[b].el)}. Opening one should close the other.`, step });
      }
      // Is anything painted over the popup? Probe a grid of points inside its visible part.
      if (!document.getElementById('__uic_probe')) {
        const st = document.createElement('style'); st.id = '__uic_probe';
        st.textContent = '[data-uic-probe],[data-uic-probe] *{pointer-events:auto!important}'; document.head.appendChild(st);
      }
      const H = innerHeight;
      for (const { el, r } of ps) {
        const L = Math.max(r.left, 0) + 4, R = Math.min(r.right, W) - 4, T = Math.max(r.top, 0) + 4, B = Math.min(r.bottom, H) - 4;
        if (R - L > 40 && B - T > 30) {
          el.setAttribute('data-uic-probe', '');
          let n = 0, hit = 0, by = null;
          for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
            const x = L + (R - L) * i / 5, y = T + (B - T) * j / 5, top = document.elementFromPoint(x, y);
            if (!top) continue; n++;
            if (!el.contains(top) && !top.closest(SKIP)) { hit++; by = by || top; }
          }
          el.removeAttribute('data-uic-probe');
          if (n && hit / n > 0.12) issues.push({ kind: 'popup-covered', key: desc(el), msg: `Other content is drawn on top of an open popup (${Math.round(100 * hit / n)}% of it is covered, by ${desc(by)}), so the popup looks like it is behind the page: ${desc(el)}.`, step });
        }
        // See-through: the popup's own background must be (nearly) solid.
        const bg = getComputedStyle(el).backgroundColor, m = bg.match(/rgba?\(([^)]+)\)/), parts = m ? m[1].split(/[ ,/]+/).filter(Boolean) : [];
        const alpha = bg === 'transparent' ? 0 : parts.length > 3 ? parseFloat(parts[3]) : 1;
        if (alpha < 0.9 && getComputedStyle(el).backgroundImage === 'none' && (el.innerText || '').trim())
          issues.push({ kind: 'popup-see-through', key: desc(el), msg: `A popup has a see-through background (opacity ${alpha.toFixed(2)}), so the page shows through its text: ${desc(el)}.`, step });
      }
      for (const { el, r } of ps) if (r.left < -2 || r.right > W + 2)
        issues.push({ kind: 'popup-offscreen', key: desc(el), msg: `A popup runs off the ${r.left < -2 ? 'left' : 'right'} edge of the screen by ${Math.round(r.left < -2 ? -r.left : r.right - W)}px: ${desc(el)}.`, step });
      return issues;
    },
    overflow() {
      const W = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
      if (sw <= W + 2) return null;
      const clips = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if (o !== 'visible') return true; } return false; };
      const bad = [...document.body.querySelectorAll('*')].filter(el => !(el instanceof SVGElement && !(el instanceof SVGSVGElement)))
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && !clips(el); })
        .filter((el, _, all) => !all.some(o => o !== el && el.contains(o)));
      return { by: sw - W, culprits: bad.slice(0, 3).map(desc) };
    },
  };
}

async function main() {
  const pages = list(arg('pages')).length ? list(arg('pages')) : defaultPages();
  const shots = new Set(list(arg('shots')));
  mkdirSync(join(OUT, 'shots'), { recursive: true });
  let base = arg('base'), local = null;
  if (!base) { local = await serve(); base = local.base; }
  if (!base.endsWith('/')) base += '/';
  const origin = new URL(base).origin, bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  console.log(`UI check: ${pages.length} pages on ${local ? 'a local copy of this commit' : base}`);

  const deadline = Date.now() + (+process.env.UI_CHECK_BUDGET || 15) * 60000;
  const browser = await chromium.launch();
  const results = [];
  // Desktop and phone run side by side to keep the job short.
  await Promise.all(VIEWPORTS.filter(v => !FIT || v.name === 'phone').map(async vp => {
    const { name, hover, ...opts } = vp;
    const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
    // The bypass header goes only to the preview itself, never to font or CDN hosts.
    if (bypass) await ctx.route('**/*', r => new URL(r.request().url()).origin === origin
      ? r.continue({ headers: { ...r.request().headers(), 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } })
      : r.continue());
    await ctx.addInitScript(`(${pageHelpers})(${JSON.stringify(SKIP)})`);
    const testPage = async path => {
      const res = { page: path, viewport: name, issues: [], shots: [] }, seen = new Set();
      const add = i => { if (FIT && !FIT_KINDS.has(i.kind)) return; const k = i.kind + '|' + (i.key || i.msg); if (!seen.has(k)) { seen.add(k); res.issues.push(i); } };
      const page = await ctx.newPage();
      // A page that hangs is closed after 2 minutes (it then shows up as "could not open or test the page"), so one stuck page cannot hold the whole run.
      const hang = setTimeout(() => page.close().catch(() => {}), 120000);
      page.on('dialog', d => d.dismiss().catch(() => {}));
      page.on('pageerror', e => add({ kind: 'js-error', msg: `Script error: ${String(e.message || e).split('\n')[0].slice(0, 200)}` }));
      page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) add({ kind: 'js-error', msg: `Console error: ${m.text().slice(0, 200)}` }); });
      page.on('response', r => {
        const u = new URL(r.url());
        if (r.status() >= 400 && u.origin === origin && !(local && u.pathname.startsWith('/api/')) && !/favicon/.test(u.pathname))
          add({ kind: 'js-error', msg: `Missing file: ${u.pathname} (${r.status()})` });
      });
      const url = base + path;
      const open = async () => {
        const r = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        if (!r || r.status() >= 400) throw new Error(`HTTP ${r ? r.status() : 'no response'}`);
        // Scroll to the bottom and back so sections that fade in on scroll are on screen, like for a reader.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
          scrollTo(0, 0);
        });
        // Page-ready signal instead of a fixed wait: fonts loaded, two frames drawn, and the page has stopped changing for 150 ms (at most 1.5 s).
        await page.evaluate(() => new Promise(done => {
          let last = performance.now(), end = last + 1500;
          const mo = new MutationObserver(() => { last = performance.now(); });
          mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
          const tick = () => { const n = performance.now(); if (n - last > 150 || n > end) { mo.disconnect(); done(); } else setTimeout(tick, 30); };
          (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(() => requestAnimationFrame(tick)));
        }));
        await page.evaluate(() => window.__uic.init());
        return page.evaluate(n => window.__uic.mark(n), MAX_TARGETS);
      };
      try {
        let targets = await open();
        const ov = await page.evaluate(() => window.__uic.overflow());
        if (ov) add({ kind: 'overflow', msg: `Content is ${ov.by}px wider than the screen, so it is cut off or the page scrolls sideways. Sticking out: ${ov.culprits.join('; ') || 'unknown'}.` });
        // Keyboard: everything a mouse can click must also be reachable with Tab.
        if (!FIT)
        (await page.evaluate(() => {
          const ok = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
          const out = [];
          for (const el of document.querySelectorAll('body *')) {
            if (el.closest(ok) || el.querySelector(ok) || el.closest('[aria-hidden="true"],[inert]')) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;
            const clicky = typeof el.onclick === 'function' || (getComputedStyle(el).cursor === 'pointer' && getComputedStyle(el.parentElement || el).cursor !== 'pointer');
            if (!clicky) continue;
            const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
            out.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} "${label}"`);
          }
          return [...new Set(out)].slice(0, 8);
        })).forEach(d => add({ kind: 'keyboard', key: d, msg: `Clickable but not reachable with Tab: ${d}. Use a <button> or <a>, or add tabindex="0", a role and Enter/Space handling.` }));
        if (!FIT) { if (shots.has(path)) res.shots = await tiles(page, path, name); await page.screenshot({ path: join(OUT, 'shots', `${slug(path)}-${name}.png`) }); }

        // Hover, then click, each element in turn. A popup left open by the last one shows up as an overlap.
        for (const t of targets) {
          const loc = page.locator(`[data-uic="${t.i}"]`).first();
          const step = `${hover ? 'hovered' : 'tapped'} ${t.desc}`;
          if (hover) { if (await loc.hover({ timeout: 1500 }).then(() => 1, () => 0)) { await page.waitForTimeout(100); (await page.evaluate(s => window.__uic.check(s), 'hovered ' + t.desc)).forEach(add); } }
          if (t.link) continue;
          const before = page.url().split('#')[0];
          if (!(await loc.click({ timeout: 1500 }).then(() => 1, () => 0))) continue;
          await page.waitForTimeout(150);
          if (page.url().split('#')[0] !== before) { targets = (await open(), targets); continue; }
          (await page.evaluate(s => window.__uic.check(s), hover ? 'clicked ' + t.desc : step)).forEach(add);
        }
        // Keyboard: Tab through the page from the top.
        if (!FIT) await open();
        for (let n = 1; !FIT && n <= MAX_TABS; n++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(60);
          const where = await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? (a.innerText || a.getAttribute('aria-label') || a.tagName).replace(/\s+/g, ' ').trim().slice(0, 40) : ''; });
          (await page.evaluate(s => window.__uic.check(s), `pressed Tab ${n}× (on "${where}")`)).forEach(add);
        }
      } catch (e) {
        add({ kind: 'load', msg: `Could not open or test the page: ${String(e.message).split('\n')[0].slice(0, 200)}` });
      }
      clearTimeout(hang);
      await page.close().catch(() => {});
      results.push(res);
      console.log(`${res.issues.length ? '✗' : '✓'} ${path} (${name})${res.issues.map(i => '\n    ' + i.kind + ': ' + i.msg + (i.step ? ` [after: ${i.step}]` : '')).join('')}`);
    };
    // Several pages at once per screen size (UI_CHECK_JOBS, default 4) keeps a full run short.
    const queue = [...pages];
    // Time budget (UI_CHECK_BUDGET minutes, default 15): when it runs out no new page is started, and the report says how many were tested.
    await Promise.all(Array.from({ length: Math.min(+process.env.UI_CHECK_JOBS || 4, pages.length) }, async () => { while (queue.length && Date.now() < deadline) await testPage(queue.shift()); }));
    await ctx.close();
  }));
  await browser.close();
  results.sort((a, b) => pages.indexOf(a.page) - pages.indexOf(b.page) || a.viewport.localeCompare(b.viewport));
  local?.srv.close();

  const issues = results.reduce((n, r) => n + r.issues.length, 0);
  const bad = results.filter(r => r.issues.length);
  const tested = new Set(results.map(r => r.page)).size, cut = tested < pages.length ? ` Time ran out after ${tested} of ${pages.length} pages; the rest were not tested.` : '';
  const summary = issues
    ? `${issues} UI problem${issues > 1 ? 's' : ''} on ${new Set(bad.map(r => r.page)).size} of ${tested} pages tested: ${[...new Set(bad.flatMap(r => r.issues.map(i => i.kind)))].join(', ')}.${cut}`
    : `All ${tested} pages tested passed on desktop and phone: no overlapping, covered or see-through popups, content wider than the screen or script errors.${cut}`;
  writeFileSync(join(OUT, 'ui-check.json'), JSON.stringify({ base: local ? 'local' : base, pages, issues, summary, results }, null, 1));
  writeFileSync(join(OUT, 'ui-check.md'), report(results, summary, issues));
  console.log('\n' + summary);
  process.exit(issues ? 1 : 0);
}

const slug = p => p.replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-');
// One screenshot per screen size for the visual pass: the top of the page, capped in height (desktop 2000 px, phone 2400 px), so
// Claude reads one desktop and one phone image per changed page instead of a column of tiles. Layout bugs a script can see
// (overflow, overlap, popups, Tab) are tested on the whole page anyway.
async function tiles(page, path, name) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight), cap = name === 'phone' ? 2400 : 2000;
  const f = join(OUT, 'shots', `${slug(path)}-${name}-1.png`);
  await page.screenshot({ path: f, fullPage: true, clip: { x: 0, y: 0, width: page.viewportSize().width, height: Math.min(cap, total) } });
  return [f];
}

const LABEL = { 'popup-overlap': 'Overlapping popups', 'popup-offscreen': 'Popup off screen', 'popup-covered': 'Popup behind other content', 'popup-see-through': 'See-through popup', overflow: 'Wider than the screen', 'js-error': 'Script or file error', load: 'Page did not load' };
function report(results, summary, issues) {
  let md = `${issues ? '🖱️❌' : '🖱️✅'} **UI check**: ${summary}\n\n`;
  const bad = results.filter(r => r.issues.length);
  if (bad.length) {
    md += '| Page | Screen | Problem |\n| --- | --- | --- |\n';
    for (const r of bad) for (const i of r.issues.slice(0, 8))
      md += `| \`${r.page}\` | ${r.viewport} | **${LABEL[i.kind] || i.kind}.** ${i.msg.replace(/\|/g, '\\|')}${i.step ? ` _(after: ${i.step.replace(/\|/g, '\\|')})_` : ''} |\n`;
    md += '\n';
  }
  md += `<sub>Hovered, clicked and Tabbed through ${results.length / VIEWPORTS.length} pages on a 1280px desktop and a 390px phone.</sub>\n`;
  return md;
}

main().catch(e => { console.error(e); process.exit(2); });
