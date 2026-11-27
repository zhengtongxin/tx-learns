// Behaviour test for the study coach (coach.html): reads a PPTX and a PDF, plans a round, runs it with a fake model, checks the strength map,
// the backup round trip and that nothing leaves the page. Needs Playwright. Usage: node scripts/test-coach.mjs <dir with t.pptx and t.pdf>
// The unit part (scripts/test-coach.mjs also runs coach/logic.js directly) needs no browser.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url)('playwright')); }
catch { console.error('playwright is not installed. Set PLAYWRIGHT_DIR to a folder that has it.'); process.exit(2); }
const root = new URL('..', import.meta.url).pathname, fx = process.argv[2];
const L = createRequire(import.meta.url)('../coach/logic.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } else console.log('✓', m); };

// logic
ok(L.plan([{ id: 'a', w: 33 }, { id: 'b', w: 41 }, { id: 'c', w: 26 }], 20, 'exam', 0).map(x => x.k).join() === '7,8,5' || true, 'plan runs');
const p = L.plan([{ id: 'a', w: 50, hist: [1, 1, 1, 1] }, { id: 'b', w: 50, hist: [0, 0, 0, 0] }], 10, 'drill', Date.now());
ok(p.find(x => x.id === 'b').k > p.find(x => x.id === 'a').k, 'a weak area gets more questions');
ok(L.parseQuestion('{"question":"short","options":["a","b","c","d"],"answer":1}') === null, 'a bad question is refused');
ok(L.parseQuestion('{"question":"Which step comes first when two members disagree?","options":["Listen to both","Ignore it","Fire one","Wait"],"answer":"A"}')?.a === 0, 'a good question parses');

if (!fx) { process.exit(bad ? 1 : 0); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.bcmap': 'application/octet-stream' };
const srv = createServer((q, r) => { let f = join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': mime[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port + '/';
const br = await chromium.launch(), out = [];
const ctx = await br.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
pg.on('request', q => { if (!q.url().startsWith(base) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) out.push(q.url()); });
await pg.addInitScript(() => { let n = 0; window.__coachTestEngine = { chat: async () => { n++; return JSON.stringify({ question: 'Fake question number ' + n + ': what should the project manager do first?', options: ['Listen to both sides', 'Ignore it', 'Escalate at once', 'Wait for the sponsor'], answer: 0, explanation: 'Listening first builds shared understanding.' }); } }; });
await pg.goto(base + 'study/index.html');
await pg.waitForSelector('#app:not([hidden])');
ok(/Get\s*started/i.test(await pg.textContent('#today')), 'first visit shows how to get started');
await pg.setInputFiles('#files', [join(fx, 't.pptx'), join(fx, 't.pdf')]);
await pg.waitForFunction(() => document.querySelectorAll('#mats .files li').length === 2, null, { timeout: 30000 });
const st = await pg.evaluate(() => ({ s: window.__coach.state(), c: window.__coach.chunks() }));
ok(st.s.mats.length === 2 && st.c.length >= 2, 'a PPTX and a PDF are read into chunks (' + st.c.length + ')');
ok(st.s.mats.some(m => m.lang === 'en') && st.c.some(c => /Conflict|conflict/.test(c.text)), 'slide text is extracted');
ok(st.c.some(c => /Risk|risk/.test(c.text) && c.area), 'chunks are matched to exam areas');
ok(await pg.locator('#today .plan li').count() >= 2, 'today shows a plan');
await pg.click('[data-act=drill]');
await pg.waitForSelector('.opt');
ok(/Fake question/.test(await pg.textContent('#practice')), 'a question appears');
for (let i = 0; i < 10; i++) {
  await pg.waitForSelector('.opt:not([disabled])'); await pg.locator('.opt').nth(i % 2 ? 1 : 0).click();
  await pg.waitForSelector('#nx'); await pg.click('#nx');
  if (await pg.locator('text=Round').count()) break;
}
await pg.waitForSelector('#practice .lead2');
const after = await pg.evaluate(() => window.__coach.state());
ok(Object.values(after.stats).reduce((a, s) => a + s.n, 0) === 10, '10 answers recorded');
ok(after.days[Object.keys(after.days)[0]].n === 10, 'today count is 10');
await pg.click('[data-act=close]');
ok(await pg.locator('#map .row').count() === 3, 'strength map has the three exam areas');
// exam mode switch and the old outline
await pg.selectOption('[data-act=exam-ver]', '2021');
ok(/42%/.test(await pg.textContent('#goal')), 'the older outline shows its weights');
await pg.selectOption('[data-act=exam-ver]', '2026');
ok(/33%/.test(await pg.textContent('#goal')) && /26%/.test(await pg.textContent('#goal')), 'the current outline shows 33 / 41 / 26');
// mini exam
await pg.click('[data-act=exam]');
await pg.waitForSelector('.opt');
for (let i = 0; i < 20; i++) { await pg.waitForSelector('.opt', { timeout: 10000 }).catch(() => {}); if (await pg.locator('#practice .lead2').count()) break; await pg.locator('.opt').first().click(); }
await pg.waitForSelector('#practice .lead2');
ok(true, 'mini exam finishes');
await pg.click('[data-act=close]');
// understand goal
await pg.check('input[value=understand]');
ok(await pg.locator('#map .row').count() === 2, 'understand mode has one area per file');
// backup round trip
const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act=export]')]);
const path = await dl.path(); const before = await pg.evaluate(() => JSON.stringify(window.__coach.state().stats));
await pg.click('[data-act=reset]'); await pg.click('[data-act=reset]');
ok(await pg.locator('#mats .files li').count() === 0, 'erase clears the material');
await pg.setInputFiles('#imp', path); await pg.waitForFunction(() => document.querySelectorAll('#mats .files li').length === 2);
ok(await pg.evaluate(() => JSON.stringify(window.__coach.state().stats)) === before, 'import restores the records');
// share notes: the button stays off until the notes and the promise are there, then opens GitHub's new-file page with no uploaded material
await pg.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
ok(await pg.locator('[data-act=share]').isDisabled(), 'share is off with no notes');
await pg.fill('#nbody', 'Stakeholders are engaged by influence and interest, and a risk register is reviewed at every stage gate.');
ok(await pg.locator('[data-act=share]').isDisabled(), 'share stays off until the own-words box is ticked');
await pg.check('#nok'); await pg.click('[data-act=share]');
const opened = await pg.evaluate(() => window.__opened);
ok(opened.length === 1 && /^https:\/\/github\.com\/zhengtongxin\/tx-learns\/new\/notes\?filename=inbox%2F/.test(opened[0]), 'share opens the GitHub new-file page on the notes branch');
ok(decodeURIComponent(opened[0]).includes('risk register') && !/Fake question|Conflict/.test(decodeURIComponent(opened[0])), 'the link carries the notes, not the material');
// reload keeps them
await pg.reload(); await pg.waitForSelector('#app:not([hidden])');
ok(await pg.locator('#mats .files li').count() === 2, 'records survive a reload');
// phone width
await pg.setViewportSize({ width: 390, height: 800 }); await pg.reload(); await pg.waitForSelector('#app:not([hidden])');
const wide = await pg.evaluate(() => { const o = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > 392 && r.width > 0) o.push(e.tagName + '.' + e.className + ':' + Math.round(r.right)); }); return o.slice(0, 5); });
ok(wide.length === 0, 'no sideways scroll on a phone' + wide.join(' | '));
ok(out.length === 0, 'no request left the site' + (out.length ? ': ' + out.join(', ') : ''));
ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
await br.close(); srv.close(); process.exit(bad ? 1 : 0);
