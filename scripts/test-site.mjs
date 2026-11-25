#!/usr/bin/env node
// Behaviour tests for the shared site script (assets/site.js): what every page relies on and no page check can see.
// It opens a local copy of the site in a headless browser and uses it the way a reader does. No AI, about ten seconds.
//   language    EN/中文 switch changes the page language and the tab title, and is remembered
//   theme       the theme button switches and is remembered
//   progress    "Mark lesson as completed" is stored, shown, undone, and the home page then offers to continue
//   feedback    "Was this lesson clear?" sends one anonymous event (lesson and answer only), thanks the reader, asks once
//   pager       a lesson links to the next lesson of its track
//   quiet       no request leaves the site, and no analytics script loads while it is switched off
//   no script   with JavaScript off, the home page lists the tracks in tracks.js order and a track page lists its lessons
//   no storage  with storage blocked (private windows), pages still open without a script error
// Usage: node scripts/test-site.mjs      Env: PLAYWRIGHT_DIR = folder where `playwright` is installed (node_modules inside)
// Exit code: 0 all passed, 1 a test failed, 2 the tests themselves broke (for example no browser).
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { tracks, lessons, loadWindow, serve } from './lib-quality.mjs';

let chromium;
try { ({ chromium } = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url)('playwright')); }
catch { console.error('playwright is not installed. Set PLAYWRIGHT_DIR to a folder that has it.'); process.exit(2); }

const T = tracks(), first = T[0], L = lessons().filter(l => l.track === first.id), lesson = L[0].path, key = lesson;
const results = [];
const eq = (got, want, what) => { if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); };
const ok = (cond, what) => { if (!cond) throw new Error(what); };

const { srv, base } = await serve();
const browser = await chromium.launch();
async function test(name, fn, opts = {}) {
  const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 }, ...opts.context });
  const page = await ctx.newPage(), errors = [], outside = [];
  page.on('pageerror', e => errors.push(String(e.message).split('\n')[0]));
  page.on('request', r => { if (!r.url().startsWith(base) && !/^(data|blob|about):/.test(r.url())) outside.push(r.url()); });
  try { await fn(page, { errors, outside, ctx }); ok(!errors.length, 'script error: ' + errors[0]); results.push([name, true]); }
  catch (e) { results.push([name, false, String(e.message).split('\n')[0]]); }
  await ctx.close();
}
const store = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return localStorage.getItem(k); } }, k);
const events = page => page.evaluate(() => (window.vaq || []).map(a => a[1]));

try {
  await test('language', async page => {
    await page.goto(base + 'index.html');
    eq(await page.getAttribute('html', 'data-lang'), 'en', 'starting language');
    const title = await page.title();
    await page.click('.top [data-l="zh"]');
    eq(await page.getAttribute('html', 'data-lang'), 'zh', 'language after the switch');
    eq(await page.getAttribute('html', 'lang'), 'zh-Hans', 'html lang after the switch');
    ok((await page.title()) !== title, 'the tab title did not follow the language');
    await page.reload();
    eq(await page.getAttribute('html', 'data-lang'), 'zh', 'language after a reload');
    ok(await page.isVisible('h1 .zh') && !(await page.isVisible('h1 .en')), 'only the 中文 heading should show');
  });

  await test('theme', async page => {
    await page.goto(base + 'index.html');
    const before = await page.getAttribute('html', 'data-theme');
    await page.click('.top .th');
    const after = await page.getAttribute('html', 'data-theme');
    ok(after && after !== before, 'the theme did not change');
    await page.reload();
    eq(await page.getAttribute('html', 'data-theme'), after, 'theme after a reload');
  });

  await test('progress', async page => {
    await page.goto(base + lesson);
    await page.click('.mark-done');
    eq((await store(page, 'learn-done'))[key], 1, 'the lesson in the stored progress');
    ok((await page.textContent('.mark-done')).includes('✓'), 'the button should show the lesson as completed');
    eq((await events(page)).filter(e => e.name === 'Lesson done').map(e => e.data), [{ lesson: key }], 'the "Lesson done" event');
    await page.goto(base + 'index.html');
    const href = await page.getAttribute('a[data-start]', 'href');
    ok(L.length < 2 || href.endsWith(L[1].path), `the home button should continue at ${L[1] && L[1].path}, it points at ${href}`);
    await page.goto(base + lesson);
    await page.click('.mark-done');
    ok(!(await store(page, 'learn-done'))[key], 'a second click should undo it');
  });

  await test('feedback', async page => {
    await page.goto(base + lesson);
    eq(await page.locator('.fbk [data-v]').count(), 2, 'answer buttons');
    await page.click('.fbk [data-v="no"]');
    eq((await events(page)).filter(e => e.name === 'Lesson feedback'), [{ name: 'Lesson feedback', data: { lesson: key, answer: 'no' } }], 'the feedback event');
    eq(await page.locator('.fbk [data-v]').count(), 0, 'buttons after answering');
    ok(await page.isVisible('.fbk [role="status"]'), 'a thank-you line should show');
    await page.reload();
    eq(await page.locator('.fbk [data-v]').count(), 0, 'buttons after a reload (asked once)');
  });

  await test('pager', async page => {
    await page.goto(base + lesson);
    ok(L.length < 2 || (await page.getAttribute('.pager a.next', 'href')) === L[1].path.split('/').pop(), 'the next link should point at the second lesson');
  });

  await test('quiet', async (page, { outside }) => {
    for (const p of ['index.html', lesson, first.href]) { await page.goto(base + p, { waitUntil: 'networkidle' }); }
    eq(outside, [], 'requests that left the site');
    eq(await page.evaluate(() => [...document.scripts].map(s => s.src).filter(s => s && !/\/(assets|js)\/|tracks\.js|lessons\.js/.test(s))), [], 'unexpected scripts');
  });

  await test('no script', async page => {
    await page.goto(base + 'index.html');
    eq(await page.$$eval('.track-list a', a => a.map(x => x.getAttribute('href'))), T.map(t => t.href), 'track links, in tracks.js order');
    await page.goto(base + first.href);
    const Tk = loadWindow(`${first.id}/lessons.js`).TRACK;
    eq(await page.$$eval('main ol a', a => a.map(x => x.getAttribute('href'))), Tk.topics.flatMap(w => w.items).filter(x => x.file).map(x => x.file), 'lesson links, in lessons.js order');
  }, { context: { javaScriptEnabled: false } });

  await test('no storage', async page => {
    await page.addInitScript(() => { const deny = () => { throw new DOMException('denied', 'SecurityError'); }; Storage.prototype.getItem = deny; Storage.prototype.setItem = deny; Storage.prototype.removeItem = deny; });
    for (const p of ['index.html', first.href, lesson]) await page.goto(base + p);
    await page.click('.fbk [data-v="yes"]');
    ok(await page.isVisible('.fbk [role="status"]'), 'feedback should still work for this visit');
  });
} catch (e) { console.error(`test-site broke: ${e.stack || e.message}`); await browser.close(); srv.close(); process.exit(2); }

await browser.close(); srv.close();
for (const [name, pass, why] of results) console.log(`${pass ? '✓' : '✗'} ${name}${why ? ': ' + why : ''}`);
const failed = results.filter(r => !r[1]).length;
console.log(failed ? `✗ Site script tests failed (${failed} of ${results.length}).` : `✓ Site script tests passed (${results.length}).`);
process.exit(failed ? 1 : 0);
