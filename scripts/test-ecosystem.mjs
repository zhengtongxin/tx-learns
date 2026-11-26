#!/usr/bin/env node
// Ecosystem attention UI regression: mock public status, no GitHub requests or account access.
// Usage: PLAYWRIGHT_DIR=<folder containing node_modules/playwright> node scripts/test-ecosystem.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, extname, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url);
const { chromium } = require('playwright');
const pair = (en, zh) => ({ en, zh });
const stamp = new Date().toISOString();
const host = 'https://github.com/zhengtongxin/tx-learns';
const report = 'ecosystem.html: the popup hides the heading on a phone. Confirm the affected page before changing the layout. '.repeat(3);
const ids = [...readFileSync(join(ROOT, 'ecosystem.html'), 'utf8').matchAll(/\{id:'([a-z0-9-]+)',hue:/g)].map(m => m[1]);
function item(id, agent, kind, historical = false) {
  return { id, agent, kind, historical, state: kind === 'resolved' ? 'ok' : 'flag', at: stamp,
    title: pair('A layout problem needs attention', '布局问题需要关注'), detail: report, detailTruncated: true,
    impact: pair('The heading is obscured.', '标题被遮挡。'), owner: pair(kind === 'auto' ? 'Improvement engineer agent' : 'You (TX)', kind === 'auto' ? '持续改进工程师 agent' : '你（TX）'),
    next: pair(kind === 'auto' ? 'A matching repair PR is open; wait for checks.' : 'Open the report and check the named page.', kind === 'auto' ? '已有对应修复 PR，等待检查。' : '打开报告，检查指定页面。'),
    links: [{ url: host + '/pull/12#issuecomment-900', label: pair('Open report', '打开报告') }] };
}
function fixture() {
  return { connected: true, updated: stamp,
    agents: Object.fromEntries(ids.map(id => [id, { state: 'ok', at: stamp, summary: 'The latest check passed.', history: [], runs: 2 }])),
    attention: { checkedAt: stamp, complete: true, items: [item('current-one', 'reader', 'action'), item('current-two', 'quality', 'auto'), item('earlier-one', 'reviewer', 'resolved', true), item('earlier-two', 'improver', 'unknown', true)] } };
}
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = resolve(ROOT, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(readFileSync(file));
});
let browser;
const results = [];
try {
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  for (const width of [1280, 390, 320]) for (const lang of ['en', 'zh']) for (const theme of ['dark', 'light']) {
    const mobile = width < 761;
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
    await context.addInitScript(({ lang, theme }) => {
      localStorage.setItem('learn-lang', lang); localStorage.setItem('learn-theme', theme);
      const original = window.setInterval;
      window.setInterval = function (fn, delay, ...args) { if (delay === 60000) window.__statusPoll = fn; return original.call(this, fn, delay, ...args); };
    }, { lang, theme });
    const page = await context.newPage(), errors = [], outside = [];
    let data = fixture();
    await page.route('**/api/status', route => route.fulfill({ json: data }));
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (!r.url().startsWith(base)) outside.push(r.url()); });
    // Avoid a response-listener race: attach before invoking the site's actual interval callback.
    const refresh = async next => { data = next; await Promise.all([page.waitForResponse(r => r.url().endsWith('/api/status')), page.evaluate(() => window.__statusPoll())]); await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)))); };
    await page.goto(base + '/ecosystem.html', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#attention-list > li').count(), 2);
    assert.equal(await page.locator('#attention-history-list > li').count(), 2);
    assert.equal(await page.locator('#attention-history').evaluate(e => e.open), false);
    assert.equal(await page.locator('#ov [data-agent]').count(), 12);
    assert.equal(await page.locator('#attention-list .attention-excerpt').count(), 2);
    assert((await page.locator('#attention-list').innerText()).includes(lang === 'zh' ? '下一步' : 'Next step'));
    assert(await page.locator('#attention-list li[data-kind=auto]').isVisible());
    // Disclosure state and keyboard focus must survive real polling, including a card moving into history.
    const first = page.locator('#attention-list > li').first();
    await first.locator('summary').click();
    const action = first.locator('a').first(); await action.focus();
    await refresh(structuredClone(data));
    assert(await first.locator('details').evaluate(e => e.open));
    assert(await action.evaluate(e => e === document.activeElement));
    const moved = structuredClone(data); moved.attention.items[0].historical = true;
    await refresh(moved);
    assert(await page.locator('#attention-history').evaluate(e => e.open));
    assert.equal(await page.locator('#attention-list > li').count(), 1);
    assert(await page.locator('#attention-history-list a').evaluateAll(list => list.some(e => e === document.activeElement)));
    await refresh(fixture());
    // An ordinary running agent is not enough to imply that it is fixing a problem.
    const uncertain = fixture(); uncertain.agents.reader.uncertain = true;
    await refresh(uncertain);
    const node = page.locator(mobile ? '#ov-list [data-agent="reader"] .ob' : '#ov [data-agent="reader"]');
    await node.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await node.click();
    const details = page.locator(mobile ? '#ov-list [data-agent="reader"] .more' : '#tip');
    assert(await details.isVisible());
    assert.equal(await details.locator('.spec dt').count(), 2);
    await details.locator('[data-attention-jump]').click();
    assert(await page.locator('#attention-list > li').first().evaluate(e => e === document.activeElement));
    assert((await page.locator(mobile ? '#ov-list [data-agent="reader"]' : '#ov [data-agent="reader"]').textContent()).toLowerCase().includes(lang === 'zh' ? '待确认' : 'awaiting update'));
    // Escape remains functional on every compact desktop popup; phone keeps one open at a time.
    for (const id of ids) {
      const target = page.locator(mobile ? `#ov-list [data-agent="${id}"] .ob` : `#ov [data-agent="${id}"]`);
      await target.evaluate(e => e.scrollIntoView({ block: 'center' }));
      if (mobile) { if (await target.getAttribute('aria-expanded') !== 'true') await target.click(); assert.equal(await page.locator('#ov-list .it.open').count(), 1); }
      else { await target.focus(); assert(await page.locator('#tip').isVisible()); await page.keyboard.press('Enter'); await page.keyboard.press('Escape'); assert(!await page.locator('#tip').isVisible()); await target.evaluate(e => e.blur()); }
    }
    // Unsafe text and URLs never become executable markup or clickable cross-repository links.
    const injection = fixture();
    injection.attention.items[0].title = pair('<img src=x onerror=alert(1)>', '<img src=x onerror=alert(1)>');
    injection.attention.items[0].detail = '<script>alert(1)</script>';
    injection.attention.items[0].links.push(...['javascript:alert(1)', 'https://github.com/evil/other/pull/1', host + '/pull/1?x=1', 'https://github.com:443/zhengtongxin/tx-learns/pull/1', host + '/issues/../pull/1'].map(url => ({ url, label: pair('Bad', '不安全') })));
    await refresh(injection); assert.equal(await page.locator('#attention img,#attention script').count(), 0);
    assert.equal(await page.locator('#attention-list li').first().locator('a').count(), 1);
    await refresh({ connected: false });
    assert.equal(await page.locator('#attention [data-kind=auto],#attention [data-kind=resolved]').count(), 0);
    assert((await page.locator('#attention-status').innerText()).includes(lang === 'zh' ? '不代表' : 'does not mean'));
    const stale = fixture(); stale.attention.checkedAt = new Date(Date.now() - 3600000).toISOString();
    await refresh(stale); assert.equal(await page.locator('#attention [data-kind=auto],#attention [data-kind=resolved]').count(), 0);
    const empty = fixture(); empty.attention.items = []; await refresh(empty);
    assert.equal(await page.locator('#attention .attention-card').count(), 0);
    assert((await page.locator('#attention-status').innerText()).includes(lang === 'zh' ? '暂无当前问题' : 'No current issues'));
    const ordinary = fixture(); ordinary.attention.items = []; ordinary.agents.writer.now = { at: stamp };
    await refresh(ordinary); assert.equal(await page.locator('#attention [data-kind=auto]').count(), 0, 'Running alone must not mean automatic repair');
    const partial = fixture(); partial.attention.complete = false; await refresh(partial);
    assert((await page.locator('#attention-status').innerText()).includes(lang === 'zh' ? '可能不完整' : 'may be incomplete'));
    const malformed = fixture(); malformed.attention.items[0].kind = 'invented'; malformed.attention.items.push({ ...item('unknown-agent', 'retired', 'auto') });
    await refresh(malformed); assert.equal(await page.locator('#attention-list > li').count(), 2);
    assert.equal(await page.locator('#attention-list [data-kind=unknown]').count(), 1);
    const earlierOnly = fixture(); earlierOnly.attention.items.forEach(x => { x.historical = true; }); await refresh(earlierOnly);
    assert.equal(await page.locator('#attention-list > li').count(), 0);
    assert((await page.locator('#attention-status').innerText()).includes(lang === 'zh' ? '可能仍需确认' : 'may still need confirmation'));
    await refresh(fixture());
    assert((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 2, 'Horizontal overflow');
    assert.deepEqual(errors, []); assert.deepEqual(outside, []);
    await context.close(); results.push(`${width}px ${lang} ${theme}`); console.log(`PASS ${results.at(-1)}`);
  }
  console.log(`Ecosystem interaction tests passed: ${results.length} screen/language/theme combinations, all agent popups and adverse-data states.`);
} finally { await browser?.close(); await new Promise(ok => server.close(ok)); }
