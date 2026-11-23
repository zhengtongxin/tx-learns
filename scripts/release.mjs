#!/usr/bin/env node
// Release agent: moves test to main once a day, but only when everything is green. No AI here.
//   prepare  (8 PM Malaysia time) opens or updates the release pull request test → main, asks the reviewer
//            agent and the copy check to look at it, and says in the daily digest what will go live and when.
//   ship     (10 PM) merges that pull request when every gate below passes; otherwise it holds the release,
//            tells TX why, and tries again the next day.
//   digest   one Telegram message about the last 24 hours: what ran, what is waiting for TX, tonight's release.
// Gates for ship: no "hold" label · the PR's head is the tip of test · the copy check and every other check
// on that commit passed · the "UI check" status passed · the reviewer agent's verdict for exactly that commit
// is ✅ · no open pull request into test changes a page in the release.
// Usage: node scripts/release.mjs prepare|ship|digest
// Env: GITHUB_TOKEN (contents, pull-requests, actions: write; checks, statuses: read), GITHUB_REPOSITORY,
//      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SHIP_AT (shown to TX, e.g. "10 PM"), SITE (live URL),
//      DRY_RUN=1 reads everything but writes nothing (prints what it would do).
import { appendFileSync } from 'node:fs';
import { gh, telegram, loadTrack, scrub, REPO } from './lib.mjs';

const MODE = process.argv[2];
const DRY = !!process.env.DRY_RUN;
const SHIP_AT = process.env.SHIP_AT || '10 PM';
const SITE = (process.env.SITE || 'https://tx-learns.vercel.app/').replace(/\/?$/, '/');
const HOLD = 'hold';
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<EOF\n${v}\nEOF\n`);
const prUrl = n => `https://github.com/${REPO}/pull/${n}`;
const today = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short' });

async function write(desc, fn) { if (DRY) { console.log(`[dry run] would ${desc}`); return null; } return fn(); }

async function releasePR() {
  const [owner] = REPO.split('/');
  const list = await gh('GET', `/pulls?state=open&base=main&head=${owner}:test&per_page=5`);
  return list[0] || null;
}

// Lesson titles for the files a release changes, from test's lessons.js.
async function lessonsIn(files) {
  let T = null;
  try { T = loadTrack(await gh('GET', '/contents/agentic-ai/lessons.js?ref=test', null, { raw: true })); } catch {}
  const title = {};
  for (const w of (T && T.topics) || []) for (const it of w.items) if (it.file) title['agentic-ai/' + it.file] = it.title.en;
  return files.filter(f => /^agentic-ai\/\d\d-.+\.html$/.test(f)).map(f => title[f] || f.split('/').pop());
}

async function openFixes(files) {
  const rel = new Set(files), hits = [];
  const open = await gh('GET', '/pulls?state=open&base=test&per_page=50');
  for (const p of open) {
    const pf = (await gh('GET', `/pulls/${p.number}/files?per_page=100`)).map(f => f.filename);
    const same = pf.filter(f => rel.has(f));
    if (same.length) hits.push({ number: p.number, title: p.title, same });
  }
  return hits;
}

function verdictFor(comments, sha) {
  const mine = comments.filter(c => c.body && c.body.includes(`<!-- tx-review sha=${sha}`));
  const last = mine[mine.length - 1];
  if (!last) return null;
  const first = last.body.split('\n').map(s => s.trim()).find(Boolean) || '';
  return { ok: /✅|Ready to merge/.test(first) && !/⚠️/.test(first), line: first.replace(/[*_#]/g, '').slice(0, 160), url: last.html_url };
}

// Every gate, as a list of reasons the release cannot go out (problems) and things still running (waiting).
async function gate(pr) {
  const problems = [], waiting = [];
  const sha = pr.head.sha;
  const tip = (await gh('GET', '/branches/test')).commit.sha;
  if (tip !== sha) waiting.push('test moved after the release PR was updated; the checks have to run on the new tip');
  if ((pr.labels || []).some(l => l.name === HOLD)) problems.push(`you added the "${HOLD}" label`);

  const runs = (await gh('GET', `/commits/${sha}/check-runs?per_page=100`)).check_runs || [];
  const latest = {};
  for (const r of runs.sort((a, b) => new Date(a.started_at || 0) - new Date(b.started_at || 0))) latest[r.name] = r;
  if (!latest['copy-check']) waiting.push('the copy check has not run on this commit yet');
  for (const r of Object.values(latest)) {
    if (r.status !== 'completed') waiting.push(`"${r.name}" is still running`);
    else if (!['success', 'neutral', 'skipped'].includes(r.conclusion)) problems.push(`"${r.name}" ${r.conclusion === 'failure' ? 'failed' : r.conclusion}`);
  }
  const st = (await gh('GET', `/commits/${sha}/status`)).statuses || [];
  const ui = st.find(s => s.context === 'UI check');
  if (!ui) waiting.push('the UI check has not run on this commit yet');
  for (const s of st) {
    if (s.state === 'pending') waiting.push(`"${s.context}" is still running`);
    else if (s.state !== 'success') problems.push(`"${s.context}" ${s.state === 'failure' ? 'failed' : s.state}: ${s.description || ''}`.trim());
  }

  const comments = await gh('GET', `/issues/${pr.number}/comments?per_page=100`);
  const v = verdictFor(comments, sha);
  if (!v) waiting.push('the reviewer agent has not read this exact version yet');
  else if (!v.ok) problems.push(`the reviewer agent says: ${v.line}`);

  const cmp = await gh('GET', '/compare/main...test');
  const files = (cmp.files || []).map(f => f.filename);
  for (const h of await openFixes(files)) problems.push(`#${h.number} "${h.title}" is still open and changes ${h.same.join(', ')}`);
  return { sha, problems, waiting, verdict: v, files };
}

async function prepare() {
  const cmp = await gh('GET', '/compare/main...test');
  const files = (cmp.files || []).map(f => f.filename);
  let pr = await releasePR();
  if (!cmp.ahead_by || !files.length) {
    console.log('test has nothing that main does not have. No release today.');
    out('state', 'skip'); out('summary', 'Nothing new on test to release.');
    return { pr: null };
  }
  const lessons = await lessonsIn(files);
  const body = [
    `Daily release from \`test\` to \`main\`, opened by the release agent.`, '',
    lessons.length ? `**Lessons in this release:**\n${lessons.map(l => `- ${l}`).join('\n')}` : '**No lesson pages change.**',
    `${files.length} file${files.length > 1 ? 's' : ''} change in total, over ${cmp.ahead_by} commit${cmp.ahead_by > 1 ? 's' : ''}.`, '',
    `It goes live by itself at ${SHIP_AT} Malaysia time if the copy check, the UI check and the reviewer agent are all green and no fix for these pages is still open.`,
    `To stop it, add the label \`${HOLD}\`. To release earlier, merge it yourself once it is green.`, '',
    '_Opened by the TX Learns release agent._',
  ].join('\n');
  const title = `Release: ${lessons.length ? lessons.slice(0, 3).join(', ') : 'site updates'}`.slice(0, 120);
  if (!pr) {
    pr = await write(`open a release PR "${title}"`, () => gh('POST', '/pulls', { title, head: 'test', base: 'main', body }));
    if (pr) await write('assign TX', () => gh('POST', `/issues/${pr.number}/assignees`, { assignees: [REPO.split('/')[0]] }).catch(() => null));
  } else {
    await write(`update release PR #${pr.number}`, () => gh('PATCH', `/pulls/${pr.number}`, { title, body }));
  }
  if (!pr) return { pr: null, lessons, files };
  // A PR opened with the workflow token does not start other workflows, so ask for the checks directly.
  const comments = await gh('GET', `/issues/${pr.number}/comments?per_page=100`);
  if (!verdictFor(comments, pr.head.sha))
    await write(`ask the reviewer agent to read #${pr.number}`, () => gh('POST', '/actions/workflows/review.yml/dispatches', { ref: 'main', inputs: { pr: String(pr.number) } }));
  const runs = (await gh('GET', `/commits/${pr.head.sha}/check-runs?per_page=100`)).check_runs || [];
  if (!runs.some(r => r.name === 'Release waits for open fixes'))
    await write(`run the copy check on test for #${pr.number}`, () => gh('POST', '/actions/workflows/copy-check.yml/dispatches', { ref: 'test', inputs: { pr: String(pr.number) } }));
  out('state', 'ok'); out('summary', `Release PR #${pr.number} ready: ${lessons.join(', ') || 'site updates'}. Goes live at ${SHIP_AT} if green.`);
  out('link', pr.html_url || prUrl(pr.number));
  return { pr, lessons, files };
}

async function ship() {
  const pr = await releasePR();
  if (!pr) { console.log('No release PR open. Nothing to ship.'); out('state', 'skip'); out('summary', 'Nothing to release today.'); return; }
  const g = await gate(pr);
  const lessons = await lessonsIn(g.files);
  const what = lessons.length ? lessons.join(', ') : 'site updates';
  if (g.problems.length || g.waiting.length) {
    const why = [...g.problems, ...g.waiting];
    console.log(`Holding release #${pr.number}:\n- ${why.join('\n- ')}`);
    out('state', 'flag'); out('summary', `Held release #${pr.number} (${what}): ${why[0]}.`); out('link', pr.html_url);
    await telegram([`⏸️ Release held: ${what}`, pr.html_url, '', 'It did not go live because:', ...why.map(w => `• ${w}`), '',
      g.problems.length ? `Sort those out and it goes out tomorrow at ${SHIP_AT}${(pr.labels || []).some(l => l.name === HOLD) ? ' (remove the "hold" label first)' : ''}, or merge it yourself once it is green.`
        : `It tries again tomorrow at ${SHIP_AT}, or merge it yourself once it is green.`].join('\n'));
    return;
  }
  const merged = await write(`merge release #${pr.number}`, () => gh('PUT', `/pulls/${pr.number}/merge`, {
    sha: g.sha, merge_method: 'merge', commit_title: `${pr.title} (#${pr.number})`,
    commit_message: 'Released by the release agent: every check green, reviewer agent ✅, no open fixes.',
  }));
  console.log(DRY ? 'Dry run: would release now.' : `Released #${pr.number}: ${merged && merged.message}`);
  out('state', 'ok'); out('summary', `Released #${pr.number}: ${what}. The live check agent looks at the site next.`); out('link', pr.html_url);
}

// ---------- the daily digest ----------
const AG = { writer: '✍️ Writer', reader: '📖 Reader', reviewer: '🔎 Reviewer', 'ui-check': '🖱️ UI check', 'copy-check': '🚫 Copy check',
  release: '🚀 Release', 'live-check': '🌐 Live check', recall: '🧠 Recall' };

async function digest(prep) {
  const since = Date.now() - 24 * 3600e3;
  let S = {};
  try { S = JSON.parse(await gh('GET', '/contents/status/all.json?ref=agent-status', null, { raw: true })).agents || {}; } catch {}
  const lines = [`📬 Daily digest · ${today()}`, ''];

  // Tonight's release
  const pr = prep && prep.pr !== undefined ? prep.pr : await releasePR();
  if (pr) {
    const g = await gate(pr);
    const lessons = await lessonsIn(g.files);
    lines.push(`🚀 Tonight at ${SHIP_AT}: ${lessons.length ? lessons.join(', ') : 'site updates (no lesson pages)'}`, pr.html_url || prUrl(pr.number));
    if (g.problems.length) lines.push('Will be held unless fixed:', ...g.problems.map(p => `• ${p}`));
    else if (g.waiting.length) lines.push(`Still running: ${g.waiting.length} check${g.waiting.length > 1 ? 's' : ''}. It goes out if they pass.`);
    else lines.push('All green. Add the "hold" label to stop it.');
  } else lines.push('🚀 Nothing new to release tonight.');
  lines.push('');

  // Waiting for TX: open pull requests into test
  const open = await gh('GET', '/pulls?state=open&base=test&per_page=20');
  if (open.length) {
    lines.push(`👀 Waiting for you (${open.length}):`);
    for (const p of open.slice(0, 8)) lines.push(`• #${p.number} ${p.title}`, `  ${p.html_url}`);
    lines.push('');
  }

  // What every agent did
  const act = [], probs = [];
  for (const [id, a] of Object.entries(S)) {
    const h = (a.history || []).filter(x => +new Date(x.at) >= since);
    if (!h.length) continue;
    const bad = h.filter(x => x.state === 'flag' || x.state === 'fail');
    act.push(`${AG[id] || id}: ${h.length} run${h.length > 1 ? 's' : ''}${bad.length ? `, ${bad.length} flagged` : ''}`);
    if (bad.length) probs.push(`${AG[id] || id}: ${scrub(bad[0].summary).slice(0, 180)}`);
  }
  lines.push(act.length ? '🤖 Last 24 hours:' : '🤖 No agent runs in the last 24 hours.', ...act.map(a => `• ${a}`));
  if (probs.length) lines.push('', '⚠️ Latest problems:', ...probs.map(p => `• ${p}`));
  lines.push('', `Site: ${SITE}`);
  const text = lines.join('\n');
  await telegram(text);
  if (MODE === 'digest') { out('state', 'ok'); out('summary', `Sent the daily digest: ${act.length} agents ran, ${open.length} PRs waiting for TX.`); }
  return text;
}

try {
  if (MODE === 'prepare') { const p = await prepare(); if (process.argv.includes('--digest')) await digest(p); }
  else if (MODE === 'ship') await ship();
  else if (MODE === 'digest') await digest(null);
  else { console.log('Usage: node scripts/release.mjs prepare [--digest] | ship | digest'); process.exit(2); }
} catch (e) {
  console.log(`::error::release agent: ${e.message}`);
  out('state', 'fail'); out('summary', `The release agent could not finish (${MODE}).`);
  await telegram(`⚠️ The release agent could not finish (${MODE}): ${e.message.slice(0, 300)}`);
  process.exit(1);
}
