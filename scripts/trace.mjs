#!/usr/bin/env node
// Agent tracing and cost log. Reads what scripts/claude-run.mjs wrote and keeps the last runs for the digest.
//   node scripts/trace.mjs push <agent> [dir]   add dir/trace-<agent>.jsonl (default /tmp/out) to trace/runs.json on the
//                                               data-only `agent-status` branch (never deployed, never merged). Never fails a workflow.
//   node scripts/trace.mjs report [--hours 24]  print the totals (needs GITHUB_REPOSITORY; the repo is public)
//   node scripts/trace.mjs weekly               the last 7 days by model and workflow step against the 7 days before (the digest adds it on Sundays)
// Env for push: GITHUB_TOKEN with contents: write, GITHUB_REPOSITORY. Only numbers and short known words are kept, so a
// forged trace file cannot put text on any page or message.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BRANCH = 'agent-status', PATH = 'trace/runs.json', KEEP = 1500; // about two weeks of calls, so the weekly report can set this week against the last
const AGENTS = ['writer', 'reader', 'reviewer', 'scope-guard', 'ui-check', 'optimizer', 'improver', 'recall'];
const n = v => (Number.isFinite(+v) ? +v : 0);

export function clean(line, agent) {
  let r; try { r = JSON.parse(line); } catch { return null; }
  if (!r || typeof r !== 'object') return null;
  return {
    at: /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(r.at) ? r.at : new Date().toISOString(), agent,
    model: /^[a-z0-9._-]{1,40}$/i.test(r.model) ? r.model : 'unknown',
    usd: +Math.min(50, Math.max(0, n(r.usd))).toFixed(4), turns: Math.min(500, n(r.turns)), ms: Math.min(36e5, n(r.ms)),
    in: n(r.in), out: n(r.out), cacheRead: n(r.cacheRead), cacheWrite: n(r.cacheWrite), ok: r.ok === true,
    end: /^[a-z_]{1,40}$/.test(r.end) ? r.end : 'unknown', run: /^\d{1,20}$/.test(String(r.run)) ? String(r.run) : '',
    step: typeof r.step === 'string' && /^[a-z0-9-]{1,24}$/.test(r.step) ? r.step : 'main',
  };
}

// Totals per agent for runs newer than `since` (ms). Used by the digest.
export function summarize(runs, since) {
  const by = {};
  for (const r of runs) {
    if (+new Date(r.at) < since) continue;
    const a = (by[r.agent] ||= { calls: 0, usd: 0, tokens: 0, bad: 0, turns: 0 });
    a.calls++; a.usd += r.usd; a.tokens += r.in + r.out + r.cacheRead + r.cacheWrite; a.turns += r.turns; if (!r.ok) a.bad++;
  }
  return by;
}

const p95 = a => { const t = [...a].sort((x, y) => x - y); return t.length ? t[Math.min(t.length - 1, Math.ceil(0.95 * t.length) - 1)] : 0; };
// One row per group: calls, average and p95 turns, average input and output tokens, average seconds, cost.
function table(runs, key) {
  const g = {};
  for (const r of runs) (g[key(r)] ||= []).push(r);
  return Object.entries(g).sort((a, b) => b[1].reduce((x, r) => x + r.usd, 0) - a[1].reduce((x, r) => x + r.usd, 0)).map(([k, v]) => {
    const sum = f => v.reduce((x, r) => x + f(r), 0);
    return { k, calls: v.length, turns: sum(r => r.turns) / v.length, p95: p95(v.map(r => r.turns)), tin: sum(r => r.in + r.cacheRead + r.cacheWrite) / v.length, tout: sum(r => r.out) / v.length, secs: sum(r => r.ms) / v.length / 1000, usd: sum(r => r.usd), bad: v.filter(r => !r.ok).length };
  });
}
// The weekly report: the last 7 days grouped by model and by workflow step, set against the 7 days before.
export function weekly(runs, now = Date.now()) {
  const wk = 7 * 864e5, at = r => +new Date(r.at);
  const cur = runs.filter(r => at(r) >= now - wk), prev = runs.filter(r => at(r) < now - wk && at(r) >= now - 2 * wk);
  if (!cur.length) return 'No Claude calls were traced in the last 7 days.';
  const k = n => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n)));
  const usd = a => a.reduce((x, r) => x + r.usd, 0), pu = usd(prev);
  const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${Math.round((a / b - 1) * 100)}%` : 'new');
  const row = (t, pt) => `• ${t.k}: ${t.calls} call${t.calls > 1 ? 's' : ''}, ${t.turns.toFixed(0)} turns (p95 ${t.p95}), ${k(t.tin)} in / ${k(t.tout)} out per call (${pt ? pct(t.tin, pt.tin) + ' input' : 'new'}), ${t.secs.toFixed(0)}s, $${t.usd.toFixed(2)}${t.bad ? `, ${t.bad} not ok` : ''}`;
  const L = [`💰 Agent use, last 7 days: ${cur.length} calls, about $${usd(cur).toFixed(2)} at API prices${pu ? ` (${pct(usd(cur), pu)} vs the week before)` : ''}`, '', 'By model:'];
  const pm = table(prev, r => r.model);
  for (const t of table(cur, r => r.model)) L.push(row(t, pm.find(x => x.k === t.k)));
  L.push('', 'By workflow step:');
  const step = r => `${r.agent}/${r.step || 'main'}`, ps = table(prev, step);
  for (const t of table(cur, step).slice(0, 14)) L.push(row(t, ps.find(x => x.k === t.k)));
  return L.join('\n');
}

async function api(method, path, body) {
  const { GITHUB_TOKEN: t, GITHUB_REPOSITORY: repo } = process.env;
  const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { method, headers: { ...(t ? { authorization: `Bearer ${t}` } : {}), accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'tx-learns-agents' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

export async function readRuns() {
  const cur = await api('GET', `/contents/${PATH}?ref=${BRANCH}`);
  try { return { sha: cur.json.sha, runs: JSON.parse(Buffer.from(cur.json.content || '', 'base64').toString() || '{}').runs || [] }; } catch { return { sha: cur.json.sha, runs: [] }; }
}

async function push(agent, dir) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY) { console.log('::warning::trace: missing GITHUB_TOKEN or GITHUB_REPOSITORY'); return; }
  if (!AGENTS.includes(agent)) { console.log(`::warning::trace: unknown agent ${agent}`); return; }
  const file = join(dir, `trace-${agent}.jsonl`);
  if (!existsSync(file)) { console.log(`No trace file for ${agent}.`); return; }
  const add = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => clean(l, agent)).filter(Boolean).slice(0, 20);
  if (!add.length) return;
  // The branch is made by record-status.mjs (an orphan with a vercel.json that turns off deployments); never create it here.
  if ((await api('GET', `/git/ref/heads/${BRANCH}`)).status !== 200) { console.log('::warning::trace: no agent-status branch yet'); return; }
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { sha, runs } = await readRuns();
    const next = [...add, ...runs].slice(0, KEEP);
    const put = await api('PUT', `/contents/${PATH}`, { message: `trace: ${agent} (${add.length} call${add.length > 1 ? 's' : ''})`, branch: BRANCH, ...(sha ? { sha } : {}), content: Buffer.from(JSON.stringify({ runs: next }) + '\n').toString('base64') });
    if (put.status < 300) { console.log(`Traced ${add.length} ${agent} call(s), about $${add.reduce((a, r) => a + r.usd, 0).toFixed(3)}.`); return; }
    if (put.status !== 409 && put.status !== 422) { console.log(`::warning::trace: ${put.status} ${put.json.message}`); return; }
    await new Promise(r => setTimeout(r, 1000 * attempt + Math.random() * 1000));
  }
  console.log('::warning::trace: gave up after 5 tries');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    if (cmd === 'push') await push(a, b || '/tmp/out');
    else if (cmd === 'report') {
      const hours = +(process.argv[process.argv.indexOf('--hours') + 1] || 24);
      const by = summarize((await readRuns()).runs, Date.now() - hours * 36e5);
      for (const [k, v] of Object.entries(by)) console.log(`${k}: ${v.calls} calls, ${v.turns} turns, ${v.tokens} tokens, ~$${v.usd.toFixed(3)}${v.bad ? `, ${v.bad} not ok` : ''}`);
    } else if (cmd === 'weekly') console.log(weekly((await readRuns()).runs));
    else console.log('Usage: node scripts/trace.mjs push <agent> [dir] | report [--hours 24] | weekly');
  } catch (e) { console.log(`::warning::trace: ${e.message}`); }
}
