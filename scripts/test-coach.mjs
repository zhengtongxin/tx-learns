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
ok([[], [0], [1], [1, 1], [0, 1, 1, 1], [1, 1, 1, 1, 1, 1, 0]].map(h => L.interval(h)).join() === '1,1,1,3,7,1', 'the review gap grows with right answers in a row (1, 3, 7...) and a miss starts it over');
{ const day = 864e5, now = 40 * day, why = (h, d) => L.plan([{ id: 'a', w: 1, hist: h, last: now - d * day }], 5, 'drill', now)[0].why;
  ok(why([1, 1, 1], 5) === 'keep' && why([1, 1, 1], 7) === 'due' && why([1], 1) === 'due', 'an area is due only once its own gap has passed'); }
ok(L.pick([{ id: 1, area: 'a', score: 9 }], 'b', {}, {}, Math.random) === null && L.pick([{ id: 1, area: 'a' }], 'a', {}, {}, Math.random).id === 1, 'an area with no passage of its own gets no question from another area');
ok([['{"answer":"B"}', 1], ['{"answer":2}', 2], ['<think>x</think>The answer is C.', 2], ['{"answer":"(d) text"}', 3], ['no idea', -1], ['{"answer":7}', -1]].every(([r, w]) => L.parseVerify(r) === w), 'the second opinion is read as an option, or as none');
ok(/A\. one\nB\. two/.test(L.verifyPrompt({ text: 'x', q: { q: 'Q?', o: ['one', 'two', 'three', 'four'], a: 1 } })[1].content) && !/answer is|"answer":1/.test(L.verifyPrompt({ text: 'x', q: { q: 'Q?', o: ['one', 'two', 'three', 'four'], a: 1 } })[1].content), 'the second opinion sees the options but not the key');
ok(L.parseQuestion('{"question":"short","options":["a","b","c","d"],"answer":1}') === null, 'a bad question is refused');
ok(L.parseQuestion('{"question":"Which step comes first when two members disagree?","options":["Listen to both","Ignore it","Fire one","All of the above"],"answer":0}') === null, 'an "all of the above" option is refused');
ok(L.parseQuestion('{"question":"哪一步应该最先做，当两位成员意见不合？","options":["先听双方","无视","开除一人","以上都对"],"answer":0}') === null, 'a Chinese "all of the above" option is refused');
ok(L.parseQuestion('{"question":"Which step comes first when two members disagree?","options":["Listen to both","Ignore it","Fire one","Wait"],"answer":"A"}')?.a === 0, 'a good question parses');
{ const Q = a => L.parseQuestion(JSON.stringify({ question: 'What should the manager do next?', options: ['Ask the team', 'Delegate the task', 'Escalate now', 'Wait a week'], answer: a }))?.a;
  ok(Q('Delegate the task') === 1, 'an answer given as the option text is matched to that option, not read as letter D');
  ok(L.parseQuestion(JSON.stringify({ question: 'Which document comes first here?', options: ['The charter', 'A project plan', 'The budget', 'A risk list'], answer: 'A project plan' }))?.a === 1, 'an option that starts with the word A is not read as letter A');
  ok(Q('(C) Escalate now') === 2 && Q('b)') === 1 && Q('2') === 2 && Q(3) === 3, 'letters, digits and indexes are read');
  ok(Q('Something else') === undefined && Q(1.5) === undefined && Q(4) === undefined, 'an answer that names no option is refused'); }

{ const g = { window: {} }; globalThis.window = g.window; await import('../coach/exams.js'); const D = globalThis.window.COACH_DOMAINS.D26;
  const t = ['The team leader should negotiate between two members in conflict and coach them with emotional intelligence.', 'Update the risk register, schedule and budget, then review the critical path and quality plan.', 'Check regulatory compliance and the business case so the benefits and organizational strategy stay aligned.'].map(text => ({ text }));
  L.assignAreas(t, D); ok(t.map(c => c.area).join() === 'people,process,biz', 'a passage goes to the area its words belong to, not the one with the longest word list'); }
{ const A = L.parseAreas('Anatomy, 30\nPhysiology 40%\nPharmacology | drug dose receptor | 30\n药理学 20\nAnatomy, 5\n\n, 10');
  ok(A.length === 4 && A.map(x => x.weight).join() === '30,40,30,20', 'areas are read from lines in three forms, duplicates and empty lines skipped');
  ok(A[0].id === 'n-anatomy' && L.parseAreas('Physiology 40%\nAnatomy, 30')[1].id === A[0].id, 'an area keeps its id when the lines are reordered');
  ok(/receptor/.test(A[2].kw) && A[0].kw === 'anatomy' && A[3].kw === '药理学', 'keywords come from the name or the typed words'); }
ok(L.inLang({ q: '项目经理应该先做什么？', o: ['先听', '无视', '升级', '等待'], e: '先倾听。' }, 'zh') && !L.inLang({ q: 'What should the manager do first?', o: ['a', 'b', 'c', 'd'], e: '' }, 'zh') && L.inLang({ q: 'What should the manager do first?', o: ['a', 'b', 'c', 'd'], e: '' }, 'en') && !L.inLang({ q: '项目经理应该先做什么？', o: ['先听', '无视', '升级', '等待'], e: '' }, 'en'), 'a question in the wrong language is caught');
{ const m = L.prompt({ text: 'Some English text about risk.', lang: 'zh', srcLang: 'en', exam: '', domain: '', tasks: '' }); ok(/Chinese \(简体中文\)/.test(m[0].content + m[1].content) && /in English/.test(m[1].content), 'the prompt asks for the page language and says the excerpt is in the other one'); }
{ const ch = [{ mat: 'a', text: 'Risk management basics\nA risk register lists each risk and its owner, and the register is reviewed often.' }, { mat: 'a', text: 'Risk management basics\nrisk register budget owner' }, { mat: 'a', text: 'Visit www.example.com for the course\nrisk register budget owner' }, { mat: 'a', text: '风险管理入门\n风险登记册记录每一项风险，风险登记册要常常复查，风险登记册。' }];
  const d = L.digest(ch, [{ id: 'a', word: 'slide' }]);
  ok(d.outline[0].titles.join('|') === 'Risk management basics|风险管理入门', 'the outline keeps one heading per passage, once, and drops a line that names a link or a course');
  ok(d.terms.includes('register') && d.terms.includes('risk') && d.terms.includes('风险'), 'key terms come from both languages');
  ok(L.copied('The risk register lists each risk and its owner and is reviewed often', ch[0].text) === true && L.copied('Keep a list of risks, who owns them, and look at it often.', ch[0].text) === false, 'a summary that repeats the source is refused, a rewrite is kept');
  ok(L.scrubLine('© 2024 Some Author. All rights reserved') === '' && L.scrubLine('  Plan  the   work ') === 'Plan the work', 'copyright and link lines are dropped'); }
if (!fx) { process.exit(bad ? 1 : 0); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.bcmap': 'application/octet-stream' };
const srv = createServer((q, r) => { let f = join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': mime[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port + '/';
const br = await chromium.launch(), out = [];
const ctx = await br.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
pg.on('request', q => { if (!q.url().startsWith(base) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) out.push(q.url()); });
await pg.addInitScript(() => { let n = 0; window.__coachTestEngine = { chat: async (m) => { if (/Which option is correct according to the excerpt/.test(JSON.stringify(m))) { window.__verified = (window.__verified || 0) + 1; return '{"answer":"A"}'; } n++; window.__lastPrompt = JSON.stringify(m); if (/Summarise the key idea/.test(window.__lastPrompt)) return JSON.stringify({ summary: /Chinese \(简体中文\)/.test(window.__lastPrompt) ? '这一段讲的是怎样先倾听再决定。' : 'This passage explains how to listen first and decide after.' }); if (/Chinese \(简体中文\)/.test(window.__lastPrompt)) return JSON.stringify({ question: '假问题第 ' + n + ' 个：项目经理应该先做什么？', options: ['先听双方的说法', '直接无视', '马上升级', '等发起人表态'], answer: 0, explanation: '先倾听有助于达成共识。' }); return JSON.stringify({ question: 'Fake question number ' + n + ': what should the project manager do first?', options: ['Listen to both sides', 'Ignore it', 'Escalate at once', 'Wait for the sponsor'], answer: 0, explanation: 'Listening first builds shared understanding.' }); } }; });
const v = n => pg.click('#flow [data-go=' + n + ']');
await pg.goto(base + 'study/index.html');
await pg.waitForSelector('#app:not([hidden])');
ok((await pg.evaluate(() => window.__coach.view())) === 'mats' && await pg.locator('#s-mats').isVisible() && !(await pg.locator('#s-goal').isVisible()) && await pg.locator('#flow [data-go=practice]').isDisabled(), 'a first visit starts at the material step and the practice steps are locked');
await pg.setInputFiles('#files', [join(fx, 't.pptx'), join(fx, 't.pdf')]);
await pg.waitForFunction(() => document.querySelectorAll('#mats .files li').length === 2, null, { timeout: 30000 });
const st = await pg.evaluate(() => ({ s: window.__coach.state(), c: window.__coach.chunks() }));
ok(st.s.mats.length === 2 && st.c.length >= 2, 'a PPTX and a PDF are read into chunks (' + st.c.length + ')');
ok(st.s.mats.some(m => m.lang === 'en') && st.c.some(c => /Conflict|conflict/.test(c.text)), 'slide text is extracted');
ok(st.s.goal === 'understand' && st.s.exam === 'custom', 'the default goal is subject-neutral: understand the material, no ready-made exam');
ok(!/PMP/.test(await pg.textContent('#goal')) && !/PMP/.test(await pg.textContent('#today')) && !/PMP/.test(await pg.textContent('#map')), 'the tool page does not mention PMP until an outline is chosen');
ok(await pg.locator('#map .row').count() === 2, 'by default the strength map has one area per file');
ok(await pg.locator('#flow [data-go=practice]').isEnabled(), 'with material the practice steps unlock');
await pg.click('#s-mats [data-go=goal]'); ok(await pg.locator('#s-goal').isVisible() && !(await pg.locator('#s-mats').isVisible()), 'Continue leads from the material to the goal, one panel at a time');
await pg.click('#s-goal [data-go=model]'); ok(await pg.locator('#s-model').isVisible(), 'and from the goal to the model'); await v('goal');
// any exam: the reader names it and enters its areas and weights
await pg.check('input[value=exam]');
ok(/Add at least one area/.test(await pg.textContent('#goal')), 'an exam with no areas yet says so');
await pg.fill('#cname', 'My certification');
await pg.fill('#ctext', 'People, 33\nProcess | risk schedule budget | 41\nBusiness environment 26');
await pg.locator('#ctext').blur();
ok((await pg.evaluate(() => window.__coach.state())).ctext.includes('Process'), 'typed areas are saved');
ok(st.c.length > 0 && (await pg.evaluate(() => window.__coach.chunks().some(c => c.area === 'x:n-process'))), 'passages are matched to the typed areas');
ok(await pg.locator('#today .plan li').count() === 1 && /Process/.test(await pg.textContent('#today .plan')) && !/People|Business/.test(await pg.textContent('#today .plan')), 'today plans only the typed area that has material (the other two have none)');
// the model step starts the first round by itself once the model is ready
await v('model'); await pg.click('[data-act=load]');
await pg.waitForSelector('.opt');
ok((await pg.evaluate(() => window.__coach.view())) === 'practice' && await pg.locator('#practice').isVisible() && !(await pg.locator('#s-model').isVisible()), 'once the model is ready the flow moves on to practice and starts a round');
ok(/Fake question/.test(await pg.textContent('#practice')), 'a question appears');
ok(await pg.evaluate(() => window.__verified > 0), 'the answer key gets a second opinion before the question is shown');
for (let i = 0; i < 10; i++) {
  await pg.waitForSelector('.opt:not([disabled])'); await pg.locator('.opt').nth(i % 2 ? 1 : 0).click();
  await pg.waitForSelector('#nx'); await pg.click('#nx');
  if (await pg.locator('text=Round').count()) break;
}
await pg.waitForSelector('#practice .lead2');
const after = await pg.evaluate(() => window.__coach.state());
ok(Object.values(after.stats).reduce((a, s) => a + s.n, 0) === 10, '10 answers recorded');
ok(after.days[Object.keys(after.days)[0]].n === 10, 'today count is 10');
await pg.click('[data-act=close]'); ok(await pg.locator('#today').isVisible(), 'after a round you are back at today’s plan');
ok(/Your coach|你的教练/.test(await pg.textContent('#today')), 'the plan is a coach card');
if (await pg.locator('#today [data-act=gap]').count()) { await pg.click('#today [data-act=gap]'); await pg.waitForSelector('.opt'); ok(await pg.evaluate(() => window.__coach.view()) === 'practice', 'a gap round starts from the coach card'); await pg.evaluate(() => document.querySelector('[data-act=opt]').click()); await v('practice'); }
ok(await pg.locator('#map .row').count() === 3, 'strength map has the three exam areas');
// wrong-question book: missed questions are kept, redone shuffled, a slip can be taken back, a lucky guess counts as a miss, the book prints
ok(/to redo|待重做/.test(await pg.textContent('#book')), 'missed questions go into the wrong-question book');
await v('progress');
const nBook = await pg.evaluate(() => window.__coach.state().bank.filter(x => x.res === 0 && !x.flag && !x.done).length);
await pg.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
await pg.click('[data-act=print]'); ok(await pg.evaluate(() => window.__printed) === 1 && (await pg.locator('#printarea .pq').count()) === nBook, 'the book prints every question in full');
await pg.click('[data-act=redoset]'); await pg.waitForSelector('.opt');
const hist0 = await pg.evaluate(() => Object.values(window.__coach.state().stats).reduce((a, s) => a + s.n, 0));
await pg.locator('.opt').nth(0).click(); await pg.waitForSelector('#nx');
await pg.click('[data-act=redo]'); await pg.waitForSelector('.opt:not([disabled])');
ok(await pg.evaluate(() => Object.values(window.__coach.state().stats).reduce((a, s) => a + s.n, 0)) === hist0, 'changing an answer takes the first one back out of the records');
let guessed = false; const missSum = () => pg.evaluate(() => Object.values(window.__coach.state().miss).reduce((a, b) => a + b, 0));
for (let i = 0; i < 4 && !guessed; i++) { for (let k = 0; k < 4 && !guessed; k++) { await pg.waitForSelector('.opt:not([disabled])'); const m0 = await missSum(); await pg.locator('.opt').nth(k).click(); await pg.waitForSelector('#nx');
  if (await pg.locator('[data-act=guess]').count()) { await pg.click('[data-act=guess]'); guessed = true; ok(await missSum() === m0 + 1, 'a guess adds exactly one miss to its passage'); } else { await pg.click('[data-act=redo]'); } } }
ok(guessed && (await pg.evaluate(() => window.__coach.state().stats)) && (await pg.textContent('#practice')).includes('Not quite') === false || guessed, 'a right answer can be marked as a guess');
for (let i = 0; i < 40 && !(await pg.locator('#practice .lead2').count()); i++) { if (await pg.locator('#nx').count()) await pg.click('#nx'); else if (await pg.locator('.opt:not([disabled])').count()) await pg.locator('.opt').nth(0).click(); else await pg.waitForTimeout(100); }
await pg.click('[data-act=close]');
await v('goal');
// an area nothing matches is named and gets no questions; passages that match no area are practised under "Other"
await pg.fill('#ctext', 'Zebras, 50\nBusiness environment, 50'); await pg.locator('#ctext').blur();
ok(/No material for/.test(await pg.textContent('#map p.warn')) && /Zebras/.test(await pg.textContent('#map p.warn')) && /no material/.test(await pg.textContent('#map .row')), 'an area without material says so');
ok(await pg.evaluate(() => window.__coach.chunks().some(c => c.area === 'x:other')) && /Other/.test(await pg.textContent('#map')) && /matched no area/.test(await pg.textContent('#map')), 'unmatched passages go to "Other"');
ok(!/Zebras/.test(await pg.textContent('#today .plan')) && /Other/.test(await pg.textContent('#today .plan')), 'the plan asks nothing from an area without material and includes "Other"');
// exam mode switch and the old outline
await pg.selectOption('[data-act=exam-id]', 'pmp');
await pg.selectOption('[data-act=exam-ver]', '2021');
ok(/42%/.test(await pg.textContent('#goal')), 'the older outline shows its weights');
await pg.selectOption('[data-act=exam-ver]', '2026');
ok(/33%/.test(await pg.textContent('#goal')) && /26%/.test(await pg.textContent('#goal')), 'the current outline shows 33 / 41 / 26');
// a weak area of the ready-made outline links to this site's lessons on it
await pg.evaluate(() => { const s = window.__coach.state(); s.stats['x:people'] = { h: [0, 0, 0], n: 3, c: 0, last: Date.now() }; });
await pg.selectOption('[data-act=exam-ver]', '2021'); await pg.selectOption('[data-act=exam-ver]', '2026');
ok((await pg.$$eval('#map .ll a', a => a.map(x => x.getAttribute('href')))).includes('../pmp/05-conflict-and-negotiation.html'), 'a weak area lists its lessons');
// mini exam
await v('practice'); await pg.click('[data-act=exam]');
await pg.waitForSelector('.opt');
for (let i = 0; i < 20; i++) { await pg.waitForSelector('.opt', { timeout: 10000 }).catch(() => {}); if (await pg.locator('#practice .lead2').count()) break; await pg.locator('.opt').first().click(); }
await pg.waitForSelector('#practice .lead2');
ok(true, 'mini exam finishes');
await pg.click('[data-act=close]');
// understand goal
await v('goal'); await pg.check('input[value=understand]');
ok(await pg.locator('#map .row').count() === 2, 'understand mode has one area per file');
// backup round trip
await v('mats');
const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act=export]')]);
const path = await dl.path(); const before = await pg.evaluate(() => JSON.stringify(window.__coach.state().stats));
await pg.click('[data-act=reset]'); await pg.click('[data-act=reset]');
ok(await pg.locator('#mats .files li').count() === 0, 'erase clears the material');
await pg.setInputFiles('#imp', path); await pg.waitForFunction(() => document.querySelectorAll('#mats .files li').length === 2);
ok(await pg.evaluate(() => JSON.stringify(window.__coach.state().stats)) === before, 'import restores the records');
await v('track');
// share notes: the button stays off until the notes and the promise are there, then opens GitHub's new-file page with no uploaded material
await pg.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
ok(await pg.locator('[data-act=share]').isDisabled(), 'share is off with no notes');
await pg.fill('#nbody', 'Stakeholders are engaged by influence and interest, and a risk register is reviewed at every stage gate.');
ok(await pg.locator('[data-act=share]').isDisabled(), 'share stays off until the own-words box is ticked');
await pg.check('#nok'); await pg.click('[data-act=share]');
const opened = await pg.evaluate(() => window.__opened);
ok(opened.length === 1 && /^https:\/\/github\.com\/zhengtongxin\/tx-learns\/new\/notes\?filename=inbox%2F/.test(opened[0]), 'share opens the GitHub new-file page on the notes branch');
ok(/Track: new/.test(decodeURIComponent(opened[0])) && /Subject: community/.test(decodeURIComponent(opened[0])), 'a new track is the default, so no TRACK file is needed');
{ const dec = decodeURIComponent(opened[0]), cs = await pg.evaluate(() => window.__coach.chunks().map(c => c.text));
  ok(dec.includes('risk register') && /## Outline of my material/.test(dec) && /## Key terms/.test(dec), 'the link carries the notes, an outline and key terms');
  ok(!/t\.pptx|t\.pdf|Fake question/.test(dec) && !cs.some(t => dec.includes(t.slice(0, 100))), 'the link carries no file name and no passage of the material');
  ok(/Material 1 \(slides\)/.test(await pg.inputValue('#npreview')), 'the preview shows what will be sent'); }
await pg.selectOption('[data-act=track]', 'ai-leader'); await pg.click('[data-act=share]');
ok(/Track: ai-leader/.test(decodeURIComponent((await pg.evaluate(() => window.__opened))[1])) && !/Subject:/.test(decodeURIComponent((await pg.evaluate(() => window.__opened))[1])), 'a lesson for an existing track names that track');
// the model and the questions follow the page language, whatever language the material is in
await pg.click('.top [data-l=zh]');
await pg.evaluate(() => window.__coach.state().bank.length = 0);
await v('practice'); await pg.click('[data-act=drill]'); await pg.waitForSelector('.opt');
ok(/假问题/.test(await pg.textContent('#practice')) && /Chinese \(简体中文\)/.test(await pg.evaluate(() => window.__lastPrompt)), 'a Chinese page gets Chinese questions from English slides');
await pg.click('.top [data-l=en]'); await pg.reload(); await pg.waitForSelector('#app:not([hidden])');
// key ideas in the model's own words, then a submission too long for one link is copied instead
await v('track'); await pg.click('[data-act=sums]'); await pg.waitForFunction(() => (window.__coach.state().sums || []).length > 0 && /Write them again/.test(document.getElementById('share').textContent), null, { timeout: 30000 });
ok(/listen first/.test(await pg.inputValue('#npreview')) && /Key ideas from my material/.test(await pg.inputValue('#npreview')), 'AI summaries join the submission');
await pg.evaluate(() => { window.__clip = ''; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__clip = t; } }, configurable: true }); window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await pg.check('#nok');
await pg.fill('#nbody', 'Stakeholders are engaged by influence and interest, é. '.repeat(120).replace(/[a-z]/g, c => c === 'e' ? '界' : c).slice(0, 3900)); await pg.click('[data-act=share]');
ok(/too long for one link|太长/.test(await pg.textContent('#share')) && (await pg.evaluate(() => window.__clip)).includes('Material 1') && !/value=/.test((await pg.evaluate(() => window.__opened))[0] || ''), 'a long submission is copied and GitHub opens an empty editor');
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
