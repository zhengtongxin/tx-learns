#!/usr/bin/env node
// node scripts/test-status.mjs — public status/attention contract, isolated mock fetches; never contacts GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { createHandler } = createRequire(import.meta.url)('../api/status.js');
const repo = 'zhengtongxin/tx-learns', host = `https://github.com/${repo}`;
const NOW = Date.parse('2026-11-26T06:00:00.000Z');
const at = minutes => new Date(NOW - minutes * 60000).toISOString();
const report = (state = 'flag', ago = 10, link = `${host}/pull/12`, summary = 'The check found a broken link.') => ({ state, summary, at: at(ago), link });
const issuesPath = `/issues?state=open&creator=github-actions%5Bbot%5D&per_page=30`;
const response = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
function fixture(agents = {}, extra = {}, options = {}) {
  const urls = [], state = { time: NOW };
  const mock = async (url, init) => {
    assert.equal(init.headers.authorization, undefined, 'No secret is sent');
    assert.equal(init.redirect, 'error'); urls.push(url);
    const path = url.startsWith(`https://raw.githubusercontent.com/${repo}/agent-status/`) ? url.split('/agent-status/')[1] : url.startsWith(`https://api.github.com/repos/${repo}/`) ? url.slice(`https://api.github.com/repos/${repo}`.length) : null;
    assert.notEqual(path, null, `Unexpected host or repository: ${url}`);
    let value = Object.hasOwn(extra, path) ? extra[path] : path === 'status/all.json' ? { agents, updated: at(1) } : path === issuesPath ? [] : path === 'signals/reader.json' ? { lessons: {} } : new Response('', { status: 404 });
    if (typeof value === 'function') value = await value(url, init);
    if (value instanceof Error) throw value;
    return value instanceof Response ? value : response(value);
  };
  const handler = createHandler({ fetch: mock, now: () => state.time, timeoutMs: 15, ...options });
  const read = async () => {
    const headers = {}, res = { statusCode: 200, setHeader: (k, v) => { headers[k] = v; }, end: value => { res.body = JSON.parse(value); } };
    await handler({}, res); return { ...res.body, statusCode: res.statusCode, headers };
  };
  return { read, urls, state };
}
const quality = (body = '#### Problems\n- ecosystem.html: listitem: List items must have a parent list.\n#### Notes\n- about.html is heaviest.', overrides = {}) => ({ number: 274, title: 'Quality check', state: 'open', user: { login: 'github-actions[bot]' }, html_url: `${host}/issues/274`, updated_at: at(10), body, ...overrides });
const repair = (overrides = {}) => ({ number: 33, html_url: `${host}/pull/33`, state: 'open', draft: false, merged_at: null, created_at: at(5), head: { ref: 'improver/9-1', repo: { full_name: repo } }, base: { repo: { full_name: repo } }, body: `Problem: Quality check ${host}/issues/274 found list structure in ecosystem.html.\nChange: Fix list parents in ecosystem.html.\nCheck: Passed.`, ...overrides });
const improver = () => report('ok', 4, `${host}/pull/33`, 'Opened one small fix in pull request #33.');
function contract(data) {
  assert.equal(typeof data.attention.complete, 'boolean'); assert.equal(data.attention.checkedAt, at(0));
  for (const item of data.attention.items) {
    assert(['action', 'auto', 'resolved', 'unknown'].includes(item.kind));
    assert(['ok', 'flag', 'fail', 'run', 'skip'].includes(item.state));
    assert.equal(typeof item.id, 'string'); assert(Number.isFinite(Date.parse(item.at)));
    assert.equal(typeof item.historical, 'boolean'); assert.equal(typeof item.detailTruncated, 'boolean');
    for (const k of ['title', 'impact', 'next', 'owner']) { assert.equal(typeof item[k].en, 'string'); assert.equal(typeof item[k].zh, 'string'); }
    assert(!item.detail || item.detail.length <= 400);
    for (const link of item.links) { assert(link.url.startsWith(host + '/')); assert.equal(typeof link.label.zh, 'string'); }
  }
}
test('preserves known states, safe links and five feed entries; raw twelve remain evidence', async () => {
  const history = Array.from({ length: 12 }, (_, i) => report(i === 9 ? 'flag' : 'ok', i + 1));
  const a = { ...history[0], history, runs: 12, now: { at: at(0.5), link: `${host}/actions/runs/50`, run: '50' } };
  const data = await fixture({ reviewer: a, retired: a }).read(); contract(data);
  assert.equal(data.agents.reviewer.state, 'ok'); assert.equal(data.agents.reviewer.runs, 12); assert.equal(data.agents.reviewer.history.length, 5);
  assert.equal(data.agents.reviewer.link, `${host}/pull/12`); assert.equal(data.agents.reviewer.now.link, `${host}/actions/runs/50`);
  assert.equal(data.agents.retired, undefined); assert.equal(data.attention.items[0].kind, 'resolved');
});
test('unrelated later successful PR does not hide or resolve a failed scope', async () => {
  const old = report('fail', 20, `${host}/pull/11`, 'Could not finish the review.');
  const latest = report('ok', 5, `${host}/pull/12`, 'Ready to merge.');
  const data = await fixture({ reviewer: { ...latest, history: [latest, old] } }).read(); contract(data);
  assert.equal(data.attention.items.length, 1); assert.equal(data.attention.items[0].kind, 'unknown'); assert.equal(data.attention.items[0].state, 'fail');
});
test('later passing result on the same canonical PR confirms recovery across comment IDs', async () => {
  const bad = report('flag', 20, `${host}/pull/12#issuecomment-100`), good = report('ok', 5, `${host}/pull/12#issuecomment-101`, 'All checks passed.');
  const data = await fixture({ 'copy-check': { ...good, history: [good, bad] } }).read();
  assert.equal(data.attention.items[0].kind, 'resolved'); assert.equal(data.attention.items[0].at, good.at); contract(data);
});
test('opened repair PR is not a passing check or recovery of an improver failure', async () => {
  const old = report('fail', 20, `${host}/actions/runs/50`, 'Could not finish a safe fix.'), good = improver();
  const data = await fixture({ improver: { ...good, history: [good, old] } }, { '/pulls/33': repair() }).read();
  assert.equal(data.attention.items[0].kind, 'unknown');
});
test('fresh same-PR recheck is auto, unrelated fresh job is not', async () => {
  const old = report();
  for (const link of [`${host}/pull/12`, `${host}/pull/13`, `${host}/actions/runs/20`]) {
    const data = await fixture({ reviewer: { ...old, now: { at: at(2), link } } }).read();
    assert.equal(data.attention.items[0].kind, link.endsWith('/12') ? 'auto' : 'action');
  }
});
test('malformed, future and stale running marks never imply an automatic repair', async () => {
  for (const stamp of ['bad', at(-1), at(31)]) {
    const data = await fixture({ reader: { ...report('fail'), now: { at: stamp, link: `${host}/pull/12` } } }).read(); contract(data);
    assert.equal(data.agents.reader.now, undefined); assert.equal(data.agents.reader.uncertain, true); assert(!data.attention.items.some(i => i.kind === 'auto'));
    assert(data.attention.items.some(i => i.kind === 'unknown' && i.state === 'run')); assert.equal(data.attention.complete, false);
  }
});
test('unknown/future finished states never become a green current result', async () => {
  for (const bad of [{ ...report(), state: 'mystery' }, { ...report(), at: at(-2) }]) {
    const data = await fixture({ reviewer: { ...bad, history: [report('ok', 20)] } }).read();
    assert.equal(data.agents.reviewer.state, undefined); assert.equal(data.agents.reviewer.uncertain, true); assert.equal(data.attention.items[0].kind, 'unknown'); assert.equal(data.attention.complete, false);
  }
});
test('a same-run rerun must be verified before auto or recovery', async () => {
  const link = `${host}/actions/runs/50`, old = report('fail', 20, link), good = report('ok', 3, link, 'All checks passed.');
  const run = { html_url: link, run_attempt: 2, run_started_at: at(5), status: 'completed', conclusion: 'success' };
  const data = await fixture({ 'copy-check': { ...good, history: [good, old] } }, { '/actions/runs/50': run }).read();
  assert.equal(data.attention.items[0].kind, 'resolved');
  const unavailable = await fixture({ 'copy-check': { ...good, history: [good, old] } }).read();
  assert.equal(unavailable.attention.items[0].kind, 'unknown'); assert.equal(unavailable.attention.complete, false);
  const running = await fixture({ 'copy-check': { ...old, now: { at: at(2), link } } }, { '/actions/runs/50': { ...run, status: 'in_progress', conclusion: null } }).read();
  assert.equal(running.attention.items[0].kind, 'auto');
});
test('a current bot-owned weekly quality issue survives a daily okay, with actual Problems only', async () => {
  const data = await fixture({ quality: report('ok', 2, `${host}/actions/runs/51`, 'Daily scan: all passed.') }, { [issuesPath]: [quality()] }).read(); contract(data);
  assert.equal(data.agents.quality.state, 'ok'); assert.equal(data.attention.items[0].agent, 'quality'); assert.equal(data.attention.items[0].kind, 'action');
  assert.match(data.attention.items[0].detail, /listitem/); assert.doesNotMatch(data.attention.items[0].detail, /heaviest|about.html/);
  assert.equal(data.attention.items[0].title.zh, '列表结构需要修正');
});
test('an identically titled human issue is not trusted as the weekly report', async () => {
  const data = await fixture({ quality: report('ok') }, { [issuesPath]: [quality(undefined, { user: { login: 'visitor' } })] }).read();
  assert.equal(data.attention.items.length, 0);
});
test('quality check failure is separate from a quality finding', async () => {
  const q = quality('#### Problems\n- ecosystem.html: broken link.\nThe check itself could not finish, so some results may be missing.');
  const data = await fixture({}, { [issuesPath]: [q] }).read();
  assert.equal(data.attention.items[0].state, 'fail'); assert.match(data.attention.items[0].impact.en, /did not finish/);
});
test('verified same-repo non-draft matching improver PR means auto, not resolved', async () => {
  const data = await fixture({ improver: improver() }, { [issuesPath]: [quality()], '/pulls/33': repair() }).read(); contract(data);
  const item = data.attention.items.find(i => i.agent === 'quality'); assert.equal(item.kind, 'auto'); assert.equal(item.owner.en, 'Improvement engineer agent');
  assert(item.links.some(l => l.url === `${host}/pull/33`));
});
test('merged, closed, draft, foreign, unrelated and unavailable repair PRs never mean auto', async () => {
  const variants = [repair({ merged_at: at(2), state: 'closed' }), repair({ state: 'closed' }), repair({ draft: true }), repair({ head: { ref: 'improver/9', repo: { full_name: 'someone/else' } } }), repair({ body: 'Problem: reader clarity in ai-production/03-other.html.\nChange: ai-production/03-other.html.\n---\nFound by the quality check or the intern agent.' }), new Response('', { status: 403 })];
  for (const pr of variants) {
    const data = await fixture({ improver: improver() }, { [issuesPath]: [quality()], '/pulls/33': pr }).read();
    assert(!data.attention.items.some(i => i.kind === 'auto' || i.kind === 'resolved'));
  }
});
test('a merged older repair and unrelated improver run cannot claim ownership of reader trouble', async () => {
  const lesson = 'ai-fde/02-intro.html';
  const data = await fixture({ reader: report('flag', 10, `${host}/commit/${'a'.repeat(40)}#commitcomment-90`, `${lesson.split('/')[1]} 6/10. Unclear.`), improver: { ...improver(), now: { at: at(1), link: `${host}/actions/runs/101` } } }, {
    'signals/reader.json': { lessons: { [lesson]: { score: 6, at: at(11), confusing: [{ where: 'Step 2', why: 'The new term is not explained.' }] } } },
    '/pulls/33': repair({ state: 'closed', merged_at: at(3) }),
  }).read();
  const item = data.attention.items.find(i => i.agent === 'reader'); assert.equal(item.kind, 'action'); assert.match(item.detail, /Step 2.*new term/);
});
test('verified matching reader repair requires the named lesson and explicit problem, not footer', async () => {
  const lesson = 'ai-fde/02-intro.html', agents = { reader: report('flag', 10, `${host}/pull/12`, '02-intro.html 6/10.'), improver: improver() };
  const extra = { 'signals/reader.json': { lessons: { [lesson]: { score: 6, at: at(11), confusing: [{ where: 'Intro', why: 'Unclear acronym.' }] } } }, '/pulls/33': repair({ body: `Problem: Intern report ${host}/pull/12 found an unexplained term in ${lesson}.\nChange: Explain the term in ${lesson}.` }) };
  const data = await fixture(agents, extra).read(); assert.equal(data.attention.items.find(i => i.agent === 'reader').kind, 'auto');
  const unrelated = await fixture(agents, { ...extra, '/pulls/33': repair({ body: `Problem: Fix punctuation in ${lesson}.\nChange: ${lesson}.\n---\nFound by the quality check or the intern agent.` }) }).read();
  assert.equal(unrelated.attention.items.find(i => i.agent === 'reader').kind, 'action');
});
test('UI-check linked bot comment supplies the diagnostic rather than successful browser summary', async () => {
  const url = `${host}/pull/12#issuecomment-900`, item = report('flag', 10, url, 'All pages passed. Claude noted 3 visual things.');
  const comment = { html_url: url, user: { login: 'github-actions[bot]' }, body: '<!-- tx-ui-check -->\nAll pages passed.\n👀 **Visual pass (Claude)**\n\n- `ecosystem.html` (phone), header: Popup overlaps text.\n\nScreenshots and logs: this run.' };
  const data = await fixture({ 'ui-check': item }, { '/issues/comments/900': comment }).read();
  assert.match(data.attention.items[0].detail, /Popup overlaps/); assert.doesNotMatch(data.attention.items[0].detail, /All pages passed/);
});
test('link whitelist rejects injection, foreign scopes, normalization tricks and query strings', async () => {
  const bad = ['javascript:alert(1)', `https://github.com/${repo}/pull/12?x=1`, `https://github.com/${repo}/pull/%31%32`, `https://github.com:443/${repo}/pull/12`, `https://user@github.com/${repo}/pull/12`, `https://github.com/${repo}/issues/../pull/12`, `https://github.com/evil/repo/pull/12`, `https://github.com/${repo}/pull/12#issuecomment-9\n`, `https://github.com/${repo}/actions/workflows/quality.yml`, `https://github.com/${repo}/pull/12#foo`];
  for (const link of bad) {
    const fx = fixture({ reviewer: report('fail', 10, link, '<img src=x>Could not finish. token=private-value') }); const data = await fx.read();
    assert.equal(data.agents.reviewer.link, undefined); assert.deepEqual(data.attention.items[0].links, []);
    assert(!JSON.stringify(data).includes('private-value')); assert(!JSON.stringify(data).includes('<img'));
    assert.equal(fx.urls.filter(u => u.includes('api.github.com')).length, 1);
  }
});
test('malformed, timed-out, oversized and rate-limited optional data preserve base state and mark incomplete', async () => {
  const bad = [new Response('{bad'), new Response('', { status: 429 }), new Response('', { status: 403 }), response({ error: 'not an array' }), response('x'.repeat(270000)), async () => new Promise(() => {})];
  for (const issueSource of bad) {
    const data = await fixture({ reviewer: report('fail') }, { [issuesPath]: issueSource }).read();
    assert.equal(data.connected, true); assert.equal(data.agents.reviewer.state, 'fail'); assert.equal(data.attention.complete, false); assert(data.attention.items.length);
  }
});
test('paginated supplemental data is incomplete rather than an all-clear', async () => {
  const page = new Response('[]', { headers: { link: '<https://api.github.com/next>; rel="next"' } });
  const data = await fixture({ quality: report('ok') }, { [issuesPath]: page }).read(); assert.equal(data.attention.complete, false);
});
test('missing, empty and offline status never imply healthy attention', async () => {
  for (const raw of [new Response('', { status: 404 }), { agents: {} }, new Response('', { status: 502 }), { agents: [] }]) {
    const data = await fixture({}, { 'status/all.json': raw }).read(); assert.equal(data.attention.complete, false); assert.deepEqual(data.attention.items, []);
    if (data.connected === false) { assert.equal(data.statusCode, 502); assert.equal(data.headers['cache-control'], 'no-store'); }
  }
});
test('cache coalesces requests and bounds unauthenticated API usage', async () => {
  const fx = fixture({ reviewer: report('fail') });
  await Promise.all(Array.from({ length: 10 }, () => fx.read()));
  assert.equal(fx.urls.length, 2);
  fx.state.time += 2 * 60000; await fx.read(); assert.equal(fx.urls.length, 3, 'only status reloads after two minutes');
  fx.state.time += 9 * 60000; await fx.read(); assert.equal(fx.urls.length, 5, 'supplementary sources reload after ten minutes');
});
test('changed optional sources cannot exceed four GitHub calls inside ten minutes', async () => {
  const comments = id => ({ html_url: `${host}/pull/12#issuecomment-${id}`, user: { login: 'github-actions[bot]' }, body: '<!-- tx-ui-check -->\nVisual pass\n- ecosystem.html: text is too faint.' });
  const agents = { 'ui-check': report('flag', 10, `${host}/pull/12#issuecomment-900`), improver: { ...improver(), history: [report('ok', 6, `${host}/pull/34`, 'Opened one small fix.')] } };
  const fx = fixture(agents, { [issuesPath]: [quality()], '/issues/comments/900': comments(900), '/pulls/33': repair(), '/pulls/34': repair({ number: 34, html_url: `${host}/pull/34` }) });
  await fx.read(); assert.equal(fx.urls.filter(u => u.includes('api.github.com')).length, 4);
  agents['ui-check'].link = `${host}/pull/12#issuecomment-901`; fx.state.time += 61000;
  const next = await fx.read(); assert.equal(fx.urls.filter(u => u.includes('api.github.com')).length, 4); assert.equal(next.attention.complete, false);
});
test('malformed repair, reader and linked UI sources do not make base status offline', async () => {
  const link = `${host}/pull/12#issuecomment-900`;
  const fx = fixture({ reader: report('flag'), 'ui-check': report('flag', 10, link), improver: improver() }, {
    'signals/reader.json': { lessons: [] }, '/issues/comments/900': { user: { login: 'attacker' }, html_url: link, body: '<!-- tx-ui-check -->\n- All fixed.' }, '/pulls/33': {},
  });
  const data = await fx.read(); assert.equal(data.connected, true); assert.equal(data.attention.complete, false); assert(!data.attention.items.some(i => i.kind === 'auto'));
});
test('same-file repair with a different problem or a prefix-only source is not automatic', async () => {
  for (const body of [
    'Problem: Quality check found another list spacing problem in ecosystem.html.\nChange: ecosystem.html.',
    `Problem: Quality check ${host}/issues/2740 list structure in ecosystem.html.\nChange: ecosystem.html.`,
  ]) {
    const data = await fixture({ improver: improver() }, { [issuesPath]: [quality()], '/pulls/33': repair({ body }) }).read();
    assert.equal(data.attention.items.find(i => i.agent === 'quality').kind, 'action');
  }
});
test('exact diagnostic wording plus every affected file can match a repair without a source URL', async () => {
  const body = 'Problem: Quality check: ecosystem.html listitem: List items must have a parent list.\nChange: ecosystem.html.';
  const data = await fixture({ improver: improver() }, { [issuesPath]: [quality()], '/pulls/33': repair({ body }) }).read();
  assert.equal(data.attention.items.find(i => i.agent === 'quality').kind, 'auto');
});
test('plain diagnostics preserve code identifiers and tag names without HTML markup', async () => {
  const data = await fixture({}, { [issuesPath]: [quality('#### Problems\n- ecosystem.html: list structure: <ul> and <ol> must contain <li>. set_price is not safe.')] }).read();
  assert.match(data.attention.items[0].detail, /ul and ol must contain li/); assert.match(data.attention.items[0].detail, /set_price/); assert.doesNotMatch(data.attention.items[0].detail, /[<>]/);
});
test('negative successful UI summary is not falsely diagnosed as popup breakage', async () => {
  const data = await fixture({ 'ui-check': report('flag', 10, `${host}/pull/12`, 'All 5 pages tested passed: no overlapping popups. Claude noted 2 visual things.') }).read();
  assert.equal(data.attention.items[0].title.en, 'Visual notes need a look');
});
test('truncated findings and malformed history mark incomplete, not silently healthy', async () => {
  const data = await fixture({ reviewer: { ...report('ok'), history: [{ at: 'bad', state: 'ok' }] } }, { [issuesPath]: [quality('#### Problems\n- ecosystem.html: ' + 'A serious problem. '.repeat(40))] }).read();
  assert.equal(data.attention.complete, false); assert(data.attention.items[0].detail.length <= 400);
});
test('stale successful snapshots are unknown rather than a fresh all-clear', async () => {
  const data = await fixture({ quality: report('ok', 9 * 24 * 60, `${host}/actions/runs/50`, 'All pages passed.') }).read();
  assert.equal(data.agents.quality.state, 'ok'); assert.equal(data.agents.quality.uncertain, true); assert.equal(data.attention.complete, false); assert.equal(data.attention.items[0].kind, 'unknown');
});
test('same report recovery clears the obsolete impact and does not list duplicate links', async () => {
  const old = report('fail', 20), good = report('ok', 2, `${host}/pull/12`, 'Ready to merge.');
  const data = await fixture({ reviewer: { ...good, history: [good, old] } }).read();
  assert.equal(data.attention.items[0].kind, 'resolved'); assert.doesNotMatch(data.attention.items[0].impact.en, /waiting/);
  assert.equal(new Set(data.attention.items[0].links.map(l => l.url)).size, data.attention.items[0].links.length);
});
test('current and historical reports are separate without dropping evidence', async () => {
  const old = report('fail', 20, `${host}/pull/11`), current = report('flag', 5, `${host}/pull/12`);
  const data = await fixture({ reviewer: { ...current, history: [current, old] }, quality: report('ok') }, { [issuesPath]: [quality()] }).read();
  assert.equal(data.attention.items.find(i => i.id === 'reviewer:pull:12').historical, false);
  const earlier = data.attention.items.find(i => i.id === 'reviewer:pull:11');
  assert.equal(earlier.historical, true); assert.match(earlier.impact.en, /not confirmed/); assert.doesNotMatch(earlier.impact.en, /cannot merge|waiting for/);
  assert.equal(data.attention.items.find(i => i.agent === 'quality').historical, false);
});
test('recovered prior reports remain historical, not new current tasks', async () => {
  const old = report('flag', 20), good = report('ok', 2);
  const data = await fixture({ reviewer: { ...good, history: [good, old] } }).read();
  assert.equal(data.attention.items[0].kind, 'resolved'); assert.equal(data.attention.items[0].historical, true);
});
test('excerpt clipping is labelled without claiming source fetch failed', async () => {
  const data = await fixture({ quality: report('ok') }, { [issuesPath]: [quality('#### Problems\n- ecosystem.html: ' + 'A serious list structure problem. '.repeat(30))] }).read();
  assert.equal(data.attention.complete, true); assert.equal(data.attention.items[0].detailTruncated, true); assert(data.attention.items[0].detail.length <= 400);
});
test('old irrelevant repair IDs are not queried; a bounded search is separate from unavailable data', async () => {
  const agents = { reader: report('flag'), improver: { ...improver(), history: [report('ok', 6, `${host}/pull/34`), report('ok', 7, `${host}/pull/35`), report('ok', 40, `${host}/pull/30`)] } };
  const fx = fixture(agents, { '/pulls/33': repair(), '/pulls/34': repair({ number: 34, html_url: `${host}/pull/34` }) });
  const data = await fx.read(); assert.equal(data.attention.complete, true); assert.equal(data.attention.repairSearchLimited, true);
  assert(!fx.urls.some(url => /\/pulls\/(30|35)$/.test(url)));
  const clean = fixture({ improver: agents.improver }); await clean.read(); assert(!clean.urls.some(url => /\/pulls\//.test(url)));
});
test('cached weekly issue and repair cannot suppress a newer quality finding or claim an old repair is active', async () => {
  const agents = { quality: report('flag', 10, `${host}/actions/runs/50`, 'Weekly quality: ecosystem.html list structure.'), improver: improver() };
  let closed = false;
  const fx = fixture(agents, { [issuesPath]: [quality()], '/pulls/33': () => repair({ state: closed ? 'closed' : 'open', merged_at: closed ? at(-1) : null }) });
  const first = await fx.read(); assert.equal(first.attention.items.find(i => i.id === 'quality:issues:274').kind, 'auto');
  closed = true; fx.state.time += 61000;
  agents.quality = { ...report('flag', 0, `${host}/actions/runs/51`, 'Daily scan: ai-engineer/07-shop.html project package no longer installs.'), at: new Date(NOW + 60000).toISOString() };
  const second = await fx.read();
  const newest = second.attention.items.find(i => i.id === 'quality:actions/runs:51');
  assert(newest); assert.equal(newest.historical, false); assert.match(newest.detail, /no longer installs/);
  const cached = second.attention.items.find(i => i.id === 'quality:issues:274');
  assert.equal(cached.historical, true); assert.equal(cached.kind, 'unknown'); assert(!second.attention.items.some(i => i.kind === 'auto'));
  assert.equal(second.attention.complete, false); assert.equal(second.attention.checkedAt, at(0));
});
test('fresh weekly issue cannot erase an unrelated current daily scan problem', async () => {
  const data = await fixture({ quality: report('flag', 2, `${host}/actions/runs/52`, 'Daily scan: ai-fde/02-intro.html project package no longer installs.') }, { [issuesPath]: [quality()] }).read();
  const current = data.attention.items.filter(i => !i.historical);
  assert.equal(current.length, 2); assert(current.some(i => /no longer installs/.test(i.detail))); assert(current.some(i => /listitem/.test(i.detail)));
});
test('only a stored matching clean daily report can be deduplicated with the weekly issue', async () => {
  const summary = 'Daily scan: all passed. The wee';
  const daily = { at: at(2.5), state: 'ok', ...Object.fromEntries(['readers', 'smoke', 'drift', 'speed'].map(k => [k, { ok: true, skipped: false }])) };
  const data = await fixture({ quality: report('flag', 2, `${host}/actions/runs/52`, summary) }, { [issuesPath]: [quality()], 'signals/daily.json': daily }).read();
  assert.equal(data.attention.items.filter(i => !i.historical).length, 1); assert.equal(data.attention.items[0].id, 'quality:issues:274');
  const unrelated = await fixture({ quality: report('flag', 2, `${host}/actions/runs/52`, summary) }, { [issuesPath]: [quality()], 'signals/daily.json': { ...daily, at: at(9) } }).read();
  assert.equal(unrelated.attention.items.filter(i => !i.historical).length, 2);
});
test('reader partial same-PR pass does not resolve other low-scored lessons', async () => {
  const old = report('flag', 20, `${host}/pull/12`, '01-first.html 6/10, 02-second.html 7/10. Unclear.'), good = report('ok', 2, `${host}/pull/12`, '02-second.html 9/10. Clear.');
  const data = await fixture({ reader: { ...good, history: [good, old] } }).read(); assert.equal(data.attention.items[0].kind, 'unknown');
  const full = { ...good, summary: '01-first.html 8/10, 02-second.html 9/10. Clear.' };
  const checked = await fixture({ reader: { ...full, history: [full, old] } }).read(); assert.equal(checked.attention.items[0].kind, 'resolved');
});
test('UI same-PR green summary lacks page coverage and cannot resolve an older finding', async () => {
  const old = report('flag', 20, `${host}/pull/12`, '01-first.html popup overlap.'), good = report('ok', 2, `${host}/pull/12`, 'All 1 pages tested passed: no popup overlap.');
  const data = await fixture({ 'ui-check': { ...good, history: [good, old] } }).read(); assert.equal(data.attention.items[0].kind, 'unknown');
});
test('cached repair is not sufficient after a newer reader finding', async () => {
  const agents = { reader: report('flag', 10, `${host}/pull/12`, '01-first.html 6/10.'), improver: improver() };
  const pr = repair({ body: `Problem: Report ${host}/pull/12 shows 01-first.html unexplained term.\nChange: 01-first.html.` });
  const fx = fixture(agents, { '/pulls/33': pr }); const initial = await fx.read(); assert.equal(initial.attention.items[0].kind, 'auto');
  fx.state.time += 61000; agents.reader = { ...agents.reader, history: [{ ...agents.reader }], at: new Date(NOW + 60000).toISOString(), summary: '01-first.html 5/10. Still unexplained.' };
  const later = await fx.read(); assert.equal(later.attention.items[0].kind, 'unknown'); assert.equal(later.attention.complete, false);
});
test('next steps are specific to reported reader, list and floating pager findings', async () => {
  const url = `${host}/pull/12#issuecomment-900`;
  const comment = { html_url: url, user: { login: 'github-actions[bot]' }, body: '<!-- tx-ui-check -->\nVisual pass\n- ecosystem.html: floating lesson pager sits on top of the heading and is hard to read.' };
  const data = await fixture({ reader: report('flag', 10, `${host}/pull/11`, '01-first.html 6/10. Unclear.'), 'ui-check': report('flag', 10, url) }, { [issuesPath]: [quality()], '/issues/comments/900': comment }).read();
  assert.match(data.attention.items.find(i => i.agent === 'reader').next.en, /both languages.*intern review/);
  assert.match(data.attention.items.find(i => i.agent === 'quality').next.en, /li as direct list children/);
  const ui = data.attention.items.find(i => i.agent === 'ui-check'); assert.equal(ui.title.en, 'Floating navigation hides content'); assert.match(ui.next.en, /offset the floating pager/);
});
test('generic failed reports do not invent OAuth diagnosis or promised retries', async () => {
  const data = await fixture({ writer: report('fail', 10, `${host}/actions/runs/50`, 'Could not finish a draft.') }).read();
  assert.equal(data.attention.items[0].kind, 'action'); assert.doesNotMatch(JSON.stringify(data.attention), /oauth|credential|retrying|automatically fixing/i);
});
