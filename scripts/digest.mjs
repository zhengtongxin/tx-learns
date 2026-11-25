#!/usr/bin/env node
// Daily digest (8 PM Malaysia time): one Telegram message about the last 24 hours. No AI here.
//   What went live (pull requests merged into main, mostly by auto-merge), anything the product engineer agent rolled
//   back, what is still open (pull requests into main, with the backend engineer agent's verdict), what every agent did, and the latest
//   problems. Instant messages (failures, rollbacks, a lesson ready to approve, the weekly recall) are sent by the
//   agents themselves; everything else waits for this.
// Usage: node scripts/digest.mjs
// Env: GITHUB_TOKEN (contents, pull-requests: read), GITHUB_REPOSITORY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
//      SITE (live URL), DRY_RUN=1 prints instead of sending, GITHUB_API points it at a test server.
import { appendFileSync } from 'node:fs';
import { gh, telegram, scrub } from './lib.mjs';
import { readRuns, summarize, weekly } from './trace.mjs';

const SITE = (process.env.SITE || 'https://tx-learns.vercel.app/').replace(/\/?$/, '/');
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<EOF\n${v}\nEOF\n`);
const today = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short' });
const AG = { writer: '✍️ Content creator', reader: '📖 Intern', reviewer: '🔧 Backend engineer', 'scope-guard': '🧭 Change control', 'ui-check': '🖱️ Frontend engineer',
  'copy-check': '🛡️ Cybersecurity engineer', 'live-check': '🌐 Product engineer', optimizer: '⚡ Efficiency engineer', improver: '🔁 Improvement engineer', news: '📰 Industry consultant',
  quality: '🔎 QA engineer', recall: '🧠 Learning coach' };

// The reviewer agent's latest verdict on a pull request, from its marked comment.
async function verdict(n) {
  try {
    const c = (await gh('GET', `/issues/${n}/comments?per_page=100`)).filter(c => c.body && c.body.includes('<!-- tx-review sha='));
    if (!c.length) return 'not reviewed yet';
    const first = c[c.length - 1].body.split('\n').map(s => s.trim()).find(Boolean) || '';
    return /⚠️/.test(first) ? 'backend ⚠️' : /✅|Ready to merge/.test(first) ? 'backend ✅' : 'reviewed';
  } catch { return ''; }
}

async function digest() {
  const since = Date.now() - 24 * 3600e3;
  let S = {};
  try { S = JSON.parse(await gh('GET', '/contents/status/all.json?ref=agent-status', null, { raw: true })).agents || {}; } catch {}
  const lines = [`📬 Daily digest · ${today()}`, ''];

  // What went live: pull requests merged into main in the last 24 hours. Rollbacks are pull requests too.
  const closed = await gh('GET', '/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50');
  const merged = closed.filter(p => p.merged_at && +new Date(p.merged_at) >= since).reverse();
  const back = merged.filter(p => /^Rollback:/.test(p.title)), live = merged.filter(p => !/^Rollback:/.test(p.title));
  if (live.length) lines.push(`🚀 Went live (${live.length}):`, ...live.map(p => `• #${p.number} ${scrub(p.title).slice(0, 90)}`));
  else lines.push('🚀 Nothing went live in the last 24 hours.');
  if (back.length) lines.push('', `↩️ Rolled back (${back.length}):`, ...back.map(p => `• ${scrub(p.title).slice(0, 100)}`));
  lines.push('');

  // Still open: pull requests into main. Green ones merge by themselves; a stuck one has a "needs you" comment.
  const open = await gh('GET', '/pulls?state=open&base=main&per_page=20');
  if (open.length) {
    lines.push(`⏳ Still open (${open.length}); green ones merge by themselves:`);
    for (const p of open.slice(0, 8)) { const v = await verdict(p.number); lines.push(`• #${p.number} ${scrub(p.title).slice(0, 80)}${v ? ` (${v})` : ''}`, `  ${p.html_url}`); }
    lines.push('');
  }

  // What every agent did
  const act = [], probs = [];
  for (const [id, a] of Object.entries(S)) {
    if (!AG[id]) continue;
    const h = (a.history || []).filter(x => +new Date(x.at) >= since);
    if (!h.length) continue;
    const bad = h.filter(x => x.state === 'flag' || x.state === 'fail');
    act.push(`${AG[id]}: ${h.length} run${h.length > 1 ? 's' : ''}${bad.length ? `, ${bad.length} flagged` : ''}`);
    if (bad.length) probs.push(`${AG[id]}: ${scrub(bad[0].summary).slice(0, 180)}`);
  }
  lines.push(act.length ? '🤖 Last 24 hours:' : '🤖 No agent runs in the last 24 hours.', ...act.map(a => `• ${a}`));
  if (probs.length) lines.push('', '⚠️ Latest problems:', ...probs.map(p => `• ${p}`));
  // What the agents used (from scripts/claude-run.mjs traces): estimated at API prices; TX's plan is not billed per call.
  try {
    const by = summarize((await readRuns()).runs, since), ids = Object.keys(by).filter(k => AG[k]);
    if (ids.length) {
      const total = ids.reduce((a, k) => a + by[k].usd, 0), calls = ids.reduce((a, k) => a + by[k].calls, 0);
      lines.push('', `💰 Agent use, last 24 hours: ${calls} Claude call${calls > 1 ? 's' : ''}, about $${total.toFixed(2)} at API prices`,
        ...ids.sort((x, y) => by[y].usd - by[x].usd).map(k => `• ${AG[k]}: ${by[k].calls} call${by[k].calls > 1 ? 's' : ''}, $${by[k].usd.toFixed(2)}${by[k].bad ? `, ${by[k].bad} not ok` : ''}`));
    }
  } catch { /* no trace yet */ }
  // Sundays: the weekly report by model and workflow step, so a change to the agents can be compared with the week before.
  if (new Date().getUTCDay() === 0 || process.env.WEEKLY === '1') {
    try { lines.push('', weekly((await readRuns()).runs)); } catch { /* no trace yet */ }
  }
  lines.push('', `Site: ${SITE}`);
  await telegram(lines.join('\n'));
  out('state', 'ok'); out('summary', `Sent the daily digest: ${live.length} went live, ${open.length} PRs still open.`);
}

try { await digest(); }
catch (e) {
  console.log(`::error::digest: ${e.message}`);
  await telegram(`⚠️ The daily digest could not be sent: ${e.message.slice(0, 300)}`);
  process.exit(1);
}
