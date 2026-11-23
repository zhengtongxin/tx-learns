#!/usr/bin/env node
// Release agent: moves test to main every hour, but only when everything is green. No AI here.
//   run      (every hour) opens or updates the release pull request test → main, asks the copy check (and, for
//            changes never reviewed, the reviewer agent) to look at it, and merges it when every gate below passes.
//            While checks are still running it waits quietly for the next hour. When something is wrong it holds
//            the release and tells TX why, once per new reason, not every hour.
//   digest   (8 PM, its own run) one Telegram message about the last 24 hours: what was released, what ran, what waits for TX.
// Gates: no "hold" label · the PR's head is the tip of test · that commit has been in the release PR for at least
// an hour (time to add "hold") · the copy check and every other check on that commit passed · the "UI check" status
// passed · no open pull request into test changes a page in the release · every change was reviewed once: each
// file in the release came only from pull requests that got a reviewer agent ✅ on their own. Anything else (a
// workflow or script change, or a lesson merged on ⚠️) makes the reviewer agent read the release, and then its
// verdict for exactly that commit must be ✅.
// The release PR body keeps a small hidden note (<!-- tx-release {...} -->) so hourly runs do not ask twice or
// repeat the same Telegram message.
// Usage: node scripts/release.mjs run | digest [--status]   (prepare and ship are old names for run;
//        --status makes the digest the run's recorded result)
// Env: GITHUB_TOKEN (contents, pull-requests, actions: write; checks, statuses: read), GITHUB_REPOSITORY,
//      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE (live URL), WAIT_MIN (minutes a commit waits, default 60),
//      DRY_RUN=1 reads everything but writes nothing (prints what it would do).
import { appendFileSync } from 'node:fs';
import { gh, telegram, loadTrack, scrub, REPO } from './lib.mjs';

const MODE = process.argv[2];
const DRY = !!process.env.DRY_RUN;
const WAIT_MIN = +(process.env.WAIT_MIN || 60);
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

const verdictOk = body => { const first = body.split('\n').map(s => s.trim()).find(Boolean) || ''; return /✅|Ready to merge/.test(first) && !/⚠️/.test(first); };

// Single review: which files in the release were already reviewed (reviewer agent ✅) on the pull request that
// brought them into test? A file touched by any pull request without that ✅, or by no pull request, is "uncovered".
async function coverage(cmp) {
  const prs = new Map();
  for (const c of cmp.commits || []) {
    let list = [];
    try { list = await gh('GET', `/commits/${c.sha}/pulls`); } catch {}
    for (const p of list || []) if (p.base && p.base.ref === 'test' && p.merged_at) prs.set(p.number, p);
  }
  const ok = new Set(), notOk = new Set(), reviewed = [], unreviewed = [];
  for (const p of prs.values()) {
    const comments = await gh('GET', `/issues/${p.number}/comments?per_page=100`);
    const good = comments.some(c => c.body && c.body.includes('<!-- tx-review sha=') && verdictOk(c.body));
    for (const f of (await gh('GET', `/pulls/${p.number}/files?per_page=100`)).map(f => f.filename)) (good ? ok : notOk).add(f);
    (good ? reviewed : unreviewed).push(p.number);
  }
  const uncovered = (cmp.files || []).map(f => f.filename).filter(f => notOk.has(f) || !ok.has(f));
  return { reviewed, unreviewed, uncovered };
}

function verdictFor(comments, sha) {
  const mine = comments.filter(c => c.body && c.body.includes(`<!-- tx-review sha=${sha}`));
  const last = mine[mine.length - 1];
  if (!last) return null;
  const first = last.body.split('\n').map(s => s.trim()).find(Boolean) || '';
  return { ok: /✅|Ready to merge/.test(first) && !/⚠️/.test(first), line: first.replace(/[*_#]/g, '').slice(0, 160), url: last.html_url };
}

// Every gate, as a list of reasons the release cannot go out (problems) and things still running (waiting).
async function gate(pr, cmp, rs = {}) {
  const problems = [], waiting = [];
  const sha = pr.head.sha;
  const tip = (await gh('GET', '/branches/test')).commit.sha;
  if (tip !== sha) waiting.push('test moved after the release PR was updated; the checks have to run on the new tip');
  if ((pr.labels || []).some(l => l.name === HOLD)) problems.push(`you added the "${HOLD}" label`);
  const age = rs.sha === sha && rs.since ? (Date.now() - new Date(rs.since)) / 60e3 : 0;
  if (age < WAIT_MIN - 5) waiting.push(`this commit has been in the release PR for ${Math.round(age)} of ${WAIT_MIN} minutes, the time you have to add "${HOLD}"`);

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

  cmp = cmp || await gh('GET', '/compare/main...test');
  const files = (cmp.files || []).map(f => f.filename);
  const cov = await coverage(cmp);
  let v = null, needReview = false;
  if (cov.uncovered.length) {
    const comments = await gh('GET', `/issues/${pr.number}/comments?per_page=100`);
    v = verdictFor(comments, sha);
    if (!v) { needReview = true; waiting.push(`the reviewer agent has not read the changes that were not reviewed on their own PR (${cov.uncovered.slice(0, 4).join(', ')}${cov.uncovered.length > 4 ? '…' : ''})`); }
    else if (!v.ok) problems.push(`the reviewer agent says: ${v.line}`);
  }
  for (const h of await openFixes(files)) problems.push(`#${h.number} "${h.title}" is still open and changes ${h.same.join(', ')}`);
  return { sha, problems, waiting, verdict: v, files, cov, needReview };
}

async function askReviewer(pr, cov) {
  const focus = cov.uncovered.join(' ').slice(0, 900);
  return write(`ask the reviewer agent to read #${pr.number} (${focus})`, () => gh('POST', '/actions/workflows/review.yml/dispatches', { ref: 'main', inputs: { pr: String(pr.number), focus } }));
}

const STATE_RE = /\n*<!-- tx-release (\{.*?\}) -->/;
const readState = pr => { try { return JSON.parse(((pr && pr.body) || '').match(STATE_RE)[1]); } catch { return {}; } };
const withState = (body, st) => `${body.replace(STATE_RE, '')}\n\n<!-- tx-release ${JSON.stringify(st)} -->`;
const key = list => list.join('|').slice(0, 300);

// One hourly run: open or update the release PR, start what has to look at it, then merge it if every gate passes.
async function run() {
  const cmp = await gh('GET', '/compare/main...test');
  const files = (cmp.files || []).map(f => f.filename);
  let pr = await releasePR();
  if (!cmp.ahead_by || !files.length) {
    console.log('test has nothing that main does not have. Nothing to release.');
    out('state', 'skip'); out('summary', 'Nothing new on test to release.');
    return;
  }
  const lessons = await lessonsIn(files);
  const what = lessons.length ? lessons.join(', ') : 'site updates';
  const cov = await coverage(cmp);
  const body = [
    `Release from \`test\` to \`main\`, opened by the release agent.`, '',
    lessons.length ? `**Lessons in this release:**\n${lessons.map(l => `- ${l}`).join('\n')}` : '**No lesson pages change.**',
    `${files.length} file${files.length > 1 ? 's' : ''} change in total, over ${cmp.ahead_by} commit${cmp.ahead_by > 1 ? 's' : ''}.`, '',
    cov.reviewed.length ? `**Already reviewed on their own PR (reviewer agent ✅):** ${cov.reviewed.map(n => `#${n}`).join(', ')}` : '',
    cov.uncovered.length ? `**Not reviewed yet, so the reviewer agent reads this release:** ${cov.uncovered.map(f => `\`${f}\``).join(', ')}` : '**Every change was reviewed on its own PR, so there is no second review.**', '',
    `The release agent checks it every hour and merges it once the copy check and the UI check are green, every change has a reviewer agent ✅, no fix for these pages is still open, and the newest change has waited ${WAIT_MIN} minutes.`,
    `To stop it, add the label \`${HOLD}\`. You never need to merge it yourself.`, '',
    '_Opened by the TX Learns release agent._',
  ].join('\n');
  const title = `Release: ${what}`.slice(0, 120);
  const before = pr ? pr.body || '' : '';
  const st = readState(pr);
  if (!pr) {
    pr = await write(`open a release PR "${title}"`, () => gh('POST', '/pulls', { title, head: 'test', base: 'main', body }));
    if (!pr) { out('state', 'skip'); out('summary', `Dry run: would open a release PR for ${what}.`); return; }
    await write('assign TX', () => gh('POST', `/issues/${pr.number}/assignees`, { assignees: [REPO.split('/')[0]] }).catch(() => null));
  }
  const sha = pr.head.sha;
  // A new commit on test starts its own wait, its own checks and its own Telegram note.
  if (st.sha !== sha) Object.assign(st, { sha, since: new Date().toISOString(), cc: '', review: '', told: '' });

  // The workflow token starts no workflows, so ask for the release copy check directly (once per commit).
  const runs = (await gh('GET', `/commits/${sha}/check-runs?per_page=100`)).check_runs || [];
  if (!runs.some(r => r.name === 'Release waits for open fixes') && st.cc !== sha) {
    await write(`run the copy check on test for #${pr.number}`, () => gh('POST', '/actions/workflows/copy-check.yml/dispatches', { ref: 'test', inputs: { pr: String(pr.number) } }));
    st.cc = sha;
  }
  const g = await gate(pr, cmp, st);
  // Second review only for what was not reviewed on its own PR, and only once per commit.
  if (g.needReview && !g.problems.length && st.review !== sha) { await askReviewer(pr, g.cov); st.review = sha; }
  out('link', pr.html_url || prUrl(pr.number));

  if (!g.problems.length && !g.waiting.length) {
    const merged = await write(`merge release #${pr.number}`, () => gh('PUT', `/pulls/${pr.number}/merge`, {
      sha: g.sha, merge_method: 'merge', commit_title: `${pr.title} (#${pr.number})`,
      commit_message: `Released by the release agent: every check green, every change reviewed once (${g.cov.uncovered.length ? 'release review ✅' : 'on its own PR'}), no open fixes.`,
    }));
    console.log(DRY ? 'Dry run: would release now.' : `Released #${pr.number}: ${merged && merged.message}`);
    out('state', 'ok'); out('summary', `Released #${pr.number}: ${what}. The live check agent looks at the site next.`);
    if (merged && merged.sha) { out('released', 'true'); out('sha', merged.sha); }
    return;
  }

  const why = [...g.problems, ...g.waiting];
  console.log(`Not releasing #${pr.number} yet:\n- ${why.join('\n- ')}`);
  const hours = (Date.now() - new Date(st.since)) / 3600e3;
  if (g.problems.length) {
    out('summary', `Held release #${pr.number} (${what}): ${g.problems[0]}.`);
    // Tell TX (and record a held run) once per set of reasons, not every hour.
    out('state', st.told === key(g.problems) ? 'wait' : 'flag');
    if (st.told !== key(g.problems)) {
      await telegram([`⏸️ Release held: ${what}`, pr.html_url, '', 'It is not going live because:', ...why.map(w => `• ${w}`), '',
        `Sort those out${(pr.labels || []).some(l => l.name === HOLD) ? ' (and remove the "hold" label)' : ''} and it goes out within the hour. I will not repeat this message unless the reasons change.`].join('\n'));
      st.told = key(g.problems);
    }
  } else {
    out('state', 'wait'); out('summary', `Release #${pr.number} (${what}) waits: ${g.waiting[0]}.`);
    // Checks normally finish within the hour. Only a wait of 6 hours on the same commit is worth a message.
    if (hours >= 6 && st.told !== 'wait') {
      await telegram([`⏳ Release still waiting after ${Math.floor(hours)} hours: ${what}`, pr.html_url, '', ...g.waiting.map(w => `• ${w}`)].join('\n'));
      st.told = 'wait';
    }
  }
  const next = withState(body, st);
  if (next !== before || pr.title !== title) await write(`update release PR #${pr.number}`, () => gh('PATCH', `/pulls/${pr.number}`, { title, body: next }));
}

// ---------- the daily digest ----------
const AG = { writer: '✍️ Writer', reader: '📖 Reader', reviewer: '🔎 Reviewer', 'ui-check': '🖱️ UI check', 'copy-check': '🚫 Copy check',
  release: '🚀 Release', 'live-check': '🌐 Live check', recall: '🧠 Recall' };

async function digest() {
  const since = Date.now() - 24 * 3600e3;
  let S = {};
  try { S = JSON.parse(await gh('GET', '/contents/status/all.json?ref=agent-status', null, { raw: true })).agents || {}; } catch {}
  const lines = [`📬 Daily digest · ${today()}`, ''];

  // What went live in the last 24 hours, and what is on its way
  const done = ((S.release && S.release.history) || []).filter(x => x.state === 'ok' && +new Date(x.at) >= since && /^Released/.test(x.summary || ''));
  if (done.length) lines.push(`🚀 Went live (${done.length}):`, ...done.map(x => `• ${scrub(x.summary).replace(/ The live check agent.*$/, '').slice(0, 160)}`));
  else lines.push('🚀 Nothing went live in the last 24 hours.');
  const pr = await releasePR();
  if (pr) {
    const g = await gate(pr, null, readState(pr));
    const lessons = await lessonsIn(g.files);
    lines.push(`Next: ${lessons.length ? lessons.join(', ') : 'site updates (no lesson pages)'}`, pr.html_url || prUrl(pr.number));
    if (g.problems.length) lines.push('Held until fixed:', ...g.problems.map(p => `• ${p}`));
    else lines.push('Goes live within the hour once its checks pass. Add the "hold" label to stop it.');
  }
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
  if (process.argv.includes('--status')) { out('state', 'ok'); out('summary', `Sent the daily digest: ${act.length} agents ran, ${open.length} PRs waiting for TX.`); }
  return text;
}

try {
  if (['run', 'prepare', 'ship'].includes(MODE)) await run();
  else if (MODE === 'digest') await digest();
  else { console.log('Usage: node scripts/release.mjs run | digest'); process.exit(2); }
} catch (e) {
  console.log(`::error::release agent: ${e.message}`);
  out('state', 'fail'); out('summary', `The release agent could not finish (${MODE}).`);
  await telegram(`⚠️ The release agent could not finish (${MODE}): ${e.message.slice(0, 300)}`);
  process.exit(1);
}
