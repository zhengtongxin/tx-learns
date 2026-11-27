#!/usr/bin/env node
// Behaviour tests for the shared site script (assets/site.js): what every page relies on and no page check can see.
// It opens a local copy of the site in a headless browser and uses it the way a reader does. No AI, about ten seconds.
//   language    EN/中文 switch changes the page language and the tab title, and is remembered
//   theme       the theme button switches and is remembered
//   progress    a lesson shows a thin reading line, counts as done once the reader reaches its end (one "Lesson done" event, once; a completion card appears, and the track page shows the topic's progress), and the home page then
//               offers to continue with the next lesson
//   feedback    "Was this lesson clear?" sends one anonymous event (lesson and answer only), thanks the reader, asks once
//   pager       a lesson links to the next lesson of its track
//   quiet       no request leaves the site, and a local or automated visit sends no reader signal
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
const events = page => page.evaluate(() => window.txq || []);

try {
  await test('language', async page => {
    await page.goto(base + 'tracks.html');
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
    await page.goto(base + 'tracks.html');
    const before = await page.getAttribute('html', 'data-theme');
    await page.click('.top .th');
    const after = await page.getAttribute('html', 'data-theme');
    ok(after && after !== before, 'the theme did not change');
    await page.reload();
    eq(await page.getAttribute('html', 'data-theme'), after, 'theme after a reload');
  });

  await test('progress', async page => {
    // Done = at the end of the lesson AND the page open for half a minute (a quick swipe to the pager does not count). The clock is ours, so the test does not wait.
    await page.clock.install();
    await page.addInitScript(() => { new MutationObserver(() => { if (document.querySelector('.donebar a')) window.__sawDone = true; }).observe(document, { childList: true, subtree: true }); });
    const bottom = async () => { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400); };
    const end = async () => { await bottom(); await page.clock.runFor(31000); await page.waitForFunction(k => { try { return !!JSON.parse(localStorage.getItem('learn-done') || '{}')[k]; } catch { return false; } }, key, { timeout: 5000 }); };
    await page.goto(base + lesson);
    ok(!(await store(page, 'learn-done') || {})[key], 'a lesson that was only opened must not count as done');
    await bottom(); await page.clock.runFor(5000);
    ok(!(await store(page, 'learn-done') || {})[key], 'a lesson swiped to its end within seconds must not count as done');
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400); await page.clock.runFor(40000);
    ok(!(await store(page, 'learn-done') || {})[key], 'a lesson left open at its top must not count as done');
    ok(await page.locator('.rdl').count() === 1, 'a lesson should show the thin reading line');
    await end();
    ok(await page.evaluate(() => !!window.__sawDone), 'finishing a lesson should show a completion card with a link');
    eq((await events(page)).filter(e => e.name === 'Lesson done').map(e => e.data), [{ lesson: key }], 'the "Lesson done" event');
    await page.reload(); await end();
    eq((await events(page)).filter(e => e.name === 'Lesson done').length, 0, '"Lesson done" events on a second read');
    await page.goto(base + first.id + '/index.html');
    await page.waitForSelector('.tpg');
    eq(await page.getAttribute('.tpg', 'aria-valuenow'), '1', 'the topic that holds the finished lesson should show 1 done');
    await page.goto(base + 'tracks.html');
    const href = await page.getAttribute('a[data-start]', 'href');
    ok(L.length < 2 || href.endsWith(L[1].path), `the home button should continue at ${L[1] && L[1].path}, it points at ${href}`);
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
    for (const p of ['tracks.html', lesson, first.href]) { await page.goto(base + p, { waitUntil: 'networkidle' }); }
    eq(outside, [], 'requests that left the site');
    eq(await page.evaluate(() => [...document.scripts].map(s => s.src).filter(s => s && !/\/(assets|js)\/|tracks(-index)?\.js|lessons\.js/.test(s))), [], 'unexpected scripts');
  });

  await test('subjects', async page => {
    // Two levels: the tracks page lists the subjects (AI, project management); a subject with several tracks opens its track list.
    await page.goto(base + 'tracks.html');
    const D = loadWindow('tracks.js').DOMAINS.filter(d => T.some(t => (t.domain || 'ai') === d.id));
    eq(await page.$$eval('.track-list .cc', a => a.length), D.length, 'one card per subject');
    await page.goto(base + 'tracks.html#ai');
    eq(await page.$$eval('.track-list .cc', a => a.map(x => x.getAttribute('href'))), T.filter(t => (t.domain || 'ai') === 'ai').map(t => t.href), 'the AI tracks, in tracks.js order');
    // Entry points (picked by who you are) carry their own label; only the tracks after them are numbered steps.
    const chips = await page.$$eval('.track-list .cc', a => a.map(x => x.querySelector('.chip').textContent));
    T.filter(t => (t.domain || 'ai') === 'ai').forEach((t, i) => ok(t.entry ? chips[i].includes(t.entry.en) && !/Step \d/.test(chips[i]) : t.bridge ? !/Step \d/.test(chips[i]) : /Step \d/.test(chips[i]), `chip of ${t.id}: ${chips[i]}`));
    ok(await page.isVisible('[data-back]'), 'a way back to the subjects');
    ok(await page.isVisible('#topics > p.meta'), 'the AI starting-point hint shows on the AI subject');
    // A subject whose tracks are all skills tracks (take any, in any order) has no numbered steps and none of the AI-only hint.
    if (T.filter(t => t.domain === 'skills').length > 1) {
      await page.goto(base + 'tracks.html#skills');
      const sk = await page.$$eval('.track-list .cc', a => a.map(x => (x.querySelector('.chip') || {}).textContent || ''));
      ok(sk.length > 1 && sk.every(c => !/Step \d/.test(c)), 'skills tracks are not numbered: ' + sk.join(' | '));
      ok(!(await page.isVisible('#topics > p.meta')), 'the AI starting-point hint is hidden on other subjects');
      await page.goto(base + 'tracks.html#ai');
    }
    await page.click('[data-back]');
    // The link loads the page again and the cards are drawn after the lesson lists arrive: wait for them, do not race the load.
    await page.waitForFunction(n => !location.hash && document.querySelectorAll('.track-list .cc').length === n, D.length, { timeout: 10000 }).catch(() => {});
    eq(await page.$$eval('.track-list .cc', a => a.length), D.length, 'back at the subjects');
  });

  await test('topics menu', async page => {
    // The menu lists subjects, not every track: a subject with several tracks opens to show them, a subject with one track is that track's row.
    const D = loadWindow('tracks.js').DOMAINS.map(d => T.filter(t => (t.domain || 'ai') === d.id)).filter(ts => ts.length), many = D.find(ts => ts.length > 1), one = D.find(ts => ts.length === 1);
    await page.goto(base + 'tracks.html'); await page.click('.menu-btn');
    eq(await page.$$eval('.side > .cg', a => a.length), D.length, 'one top-level row per subject');
    ok(!(await page.isVisible(`.side a[href="${many[0].href}"]`)), 'the tracks of a subject stay folded until it is opened');
    await page.click('.side .dg > .cg-h');
    eq(await page.$$eval('.side .dg.open > .cg-b a', a => a.map(x => x.getAttribute('href'))), many.map(t => t.href), 'an opened subject lists its tracks');
    if (one) ok(await page.isVisible(`.side > .cg > a.cg-h[href="${one[0].href}"]`), 'a subject with one track is a row at the same level');
    // Inside a lesson: the subject of this track is open, with one box per track; a one-track subject is its own box at the top level.
    await page.goto(base + lesson); await page.click('.menu-btn');
    eq(await page.$$eval('.side > .cg', a => a.length), D.length, 'top-level rows inside a lesson');
    eq(await page.$$eval('.side .dg.open > .cg-b > div > .cg', a => a.map(x => x.dataset.c)), many.map(t => t.id), 'the track boxes of the open subject');
    ok(await page.waitForSelector('.side a[aria-current="page"]', { state: 'visible', timeout: 3000 }).then(() => true, () => false), 'the current lesson is marked and shown');
    await page.click('.side .dg > .cg-h'); await page.reload(); await page.click('.menu-btn');
    ok(!(await page.$('.side .dg.open')), 'a folded subject stays folded after a reload');
  });

  await test('what next', async page => {
    // After a track's last lesson the card offers exactly the tracks it names in tracks.js (next), never the next one in the list, plus its go link.
    const X = loadWindow('tracks-index.js').TRACK_INDEX;
    for (const t of T) {
      await page.goto(base + t.id + '/' + X[t.id].files.at(-1));
      await page.waitForSelector('.whatnext', { timeout: 5000 });
      const want = (t.next || []).map(id => `../${id}/${X[id].files[0]}`).concat(t.go ? ['../' + t.go.href] : []);
      eq(await page.$$eval('.whatnext a.wn-go', a => a.map(x => x.getAttribute('href'))), want, `links after ${t.id}`);
      ok((await page.textContent('.whatnext')).includes(t.after.en), `the "after" line of ${t.id}`);
    }
  });

  await test('no script', async page => {
    await page.goto(base + 'tracks.html');
    eq(await page.$$eval('.track-list a', a => a.map(x => x.getAttribute('href'))), T.map(t => t.href), 'track links, in tracks.js order');
    await page.goto(base + first.href);
    const Tk = loadWindow(`${first.id}/lessons.js`).TRACK;
    eq(await page.$$eval('main ol a', a => a.map(x => x.getAttribute('href'))), Tk.topics.flatMap(w => w.items).filter(x => x.file).map(x => x.file), 'lesson links, in lessons.js order');
  }, { context: { javaScriptEnabled: false } });

  await test('no storage', async page => {
    await page.addInitScript(() => { const deny = () => { throw new DOMException('denied', 'SecurityError'); }; Storage.prototype.getItem = deny; Storage.prototype.setItem = deny; Storage.prototype.removeItem = deny; });
    for (const p of ['tracks.html', first.href, lesson]) await page.goto(base + p);
    await page.click('.fbk [data-v="yes"]');
    ok(await page.isVisible('.fbk [role="status"]'), 'feedback should still work for this visit');
  });
} catch (e) { console.error(`test-site broke: ${e.stack || e.message}`); await browser.close(); srv.close(); process.exit(2); }

await browser.close(); srv.close();
for (const [name, pass, why] of results) console.log(`${pass ? '✓' : '✗'} ${name}${why ? ': ' + why : ''}`);
const failed = results.filter(r => !r[1]).length;
console.log(failed ? `✗ Site script tests failed (${failed} of ${results.length}).` : `✓ Site script tests passed (${results.length}).`);
process.exit(failed ? 1 : 0);
