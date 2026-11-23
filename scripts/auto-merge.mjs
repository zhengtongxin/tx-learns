#!/usr/bin/env node
// Auto-merge: merges a pull request into main by itself once every required check is green on its newest commit.
// The required checks are the ones in .github/rulesets/main.json (copy-check, UI check, Reviewer). No AI here.
// Each run looks at every open pull request into main and:
//   - merges at most one that is ready (oldest first), then starts the live check on that merge, which can roll
//     it back. It never merges while a live check is still running, so each merge is checked on its own.
//   - tells TX once (a PR comment plus Telegram) when a pull request is stuck: a check failed, the agents could
//     not fix it, it has a merge conflict, it changes the agents' own workflows (GitHub only lets a person merge
//     those and no MERGE_TOKEN is set), or a check has not reported after 3 hours.
//   - A PR that changes .github/workflows/ is merged only with MERGE_TOKEN (a fine-grained token with the Workflows
//     permission; the workflow token cannot). It still needs every check green, the Reviewer included, and it is
//     left to TX if it touches the merge guardrails themselves (PROTECTED below).
// Skips drafts, pull requests from forks, the label "hold", and Rollback pull requests (the live check merges those).
// Usage: node scripts/auto-merge.mjs   Env: GITHUB_TOKEN (contents, pull-requests, statuses, actions: write),
//        GITHUB_REPOSITORY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID; DRY_RUN=1 changes nothing and only prints.
import { readFileSync, appendFileSync } from 'node:fs';
import { gh, telegram, scrub, REPO } from './lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DRY = !!process.env.DRY_RUN;
const STUCK_H = 3;
const MERGE_TOKEN = process.env.MERGE_TOKEN || '';
// The guardrails of the merge itself: a PR that changes these is always left for TX, even with MERGE_TOKEN.
const PROTECTED = ['.github/workflows/auto-merge.yml', 'scripts/auto-merge.mjs', '.github/rulesets/main.json'];
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<EOF\n${v}\nEOF\n`);
let REQUIRED = ['copy-check', 'UI check', 'Reviewer'];
try { REQUIRED = JSON.parse(readFileSync(ROOT + '.github/rulesets/main.json', 'utf8')).rules.find(r => r.type === 'required_status_checks').parameters.required_status_checks.map(c => c.context); } catch {}

// The state of each required check on one commit: success, pending, missing or failure.
async function checks(sha) {
  const st = (await gh('GET', `/commits/${sha}/status?per_page=100`)).statuses || [];
  const runs = (await gh('GET', `/commits/${sha}/check-runs?per_page=100`)).check_runs || [];
  const res = {};
  for (const ctx of REQUIRED) {
    const s = st.find(x => x.context === ctx);
    const r = runs.filter(x => x.name === ctx).sort((a, b) => b.id - a.id)[0];
    let v = 'missing';
    if (s) v = s.state === 'success' ? 'success' : s.state === 'pending' ? 'pending' : 'failure';
    if (r && (!s || v !== 'success')) v = r.status !== 'completed' ? 'pending' : ['success', 'neutral', 'skipped'].includes(r.conclusion) ? 'success' : 'failure';
    res[ctx] = { v, why: s?.description || r?.output?.title || '' };
  }
  return res;
}

// Tell TX once per commit: a hidden marker in the PR comment stops a second message for the same commit.
async function stuck(p, reason) {
  const mark = `<!-- tx-stuck sha=${p.head.sha} -->`;
  const comments = await gh('GET', `/issues/${p.number}/comments?per_page=100`);
  if (comments.some(c => c.body?.includes(mark))) return console.log(`#${p.number}: stuck (already told TX): ${reason}`);
  console.log(`#${p.number}: stuck: ${reason}`);
  if (DRY) return;
  await gh('POST', `/issues/${p.number}/comments`, { body: `⏸️ **This pull request needs you.** ${reason}\n\nWhen it is fixed it merges by itself. Add the label \`hold\` to keep it open.\n${mark}` });
  await telegram(`⏸️ PR #${p.number} needs you: ${scrub(p.title).slice(0, 90)}\n${reason}\n${p.html_url}`);
}

// A live check that is still running (or waiting to run). DONE_RUN is the live check that started this run from
// its own last step: it has finished its work, so it does not count.
async function liveCheckBusy() {
  for (const s of ['in_progress', 'queued', 'waiting', 'pending']) {
    const r = await gh('GET', `/actions/workflows/live-check.yml/runs?status=${s}&per_page=20`).catch(() => ({ workflow_runs: [] }));
    if ((r.workflow_runs || []).some(w => String(w.id) !== String(process.env.DONE_RUN || ''))) return true;
  }
  return false;
}

try {
  const open = (await gh('GET', '/pulls?state=open&base=main&sort=created&direction=asc&per_page=50'));
  let busy = await liveCheckBusy(), merged = '';
  const log = [];
  for (const p of open) {
    const n = `#${p.number}`;
    if (p.draft) { console.log(`${n}: draft, skipped`); continue; }
    if (p.head.repo?.full_name !== REPO) { console.log(`${n}: from a fork, never merged by itself`); continue; }
    if (/^rollback\//.test(p.head.ref)) { console.log(`${n}: a rollback, the live check merges it`); continue; }
    if ((p.labels || []).some(l => l.name === 'hold')) { console.log(`${n}: label hold, skipped`); continue; }
    const c = await checks(p.head.sha);
    const failed = Object.entries(c).filter(([, x]) => x.v === 'failure');
    const waiting = Object.entries(c).filter(([, x]) => x.v === 'pending' || x.v === 'missing');
    if (failed.length) {
      await stuck(p, `${failed.map(([k, x]) => `${k} is red${x.why ? ` (${x.why})` : ''}`).join('; ')}. The agents fixed what they could; see the comments on the pull request.`);
      continue;
    }
    if (waiting.length) {
      const commit = await gh('GET', `/commits/${p.head.sha}`);
      const age = (Date.now() - new Date(commit.commit.committer.date)) / 3600e3;
      if (age >= STUCK_H) await stuck(p, `${waiting.map(([k]) => k).join(' and ')} still not green after ${Math.floor(age)} hours.`);
      else console.log(`${n}: waiting for ${waiting.map(([k, x]) => `${k} (${x.v})`).join(', ')}`);
      continue;
    }
    const files = await gh('GET', `/pulls/${p.number}/files?per_page=100`);
    const touchesWorkflows = files.some(f => f.filename.startsWith('.github/workflows/'));
    if (files.some(f => PROTECTED.includes(f.filename))) {
      await stuck(p, 'Every check is green, but it changes the auto-merge rules themselves (auto-merge.yml, auto-merge.mjs or the ruleset), so a person merges it.');
      continue;
    }
    if (touchesWorkflows && !MERGE_TOKEN) {
      await stuck(p, 'Every check is green, but it changes the agents\' own workflows, and GitHub only lets a person (or the MERGE_TOKEN secret) merge those. Merge it when you are happy.');
      continue;
    }
    const full = await gh('GET', `/pulls/${p.number}`);
    if (full.mergeable === false) { await stuck(p, 'Every check is green, but it has a merge conflict with main.'); continue; }
    if (full.mergeable == null) { console.log(`${n}: GitHub is still working out if it can merge; next run`); continue; }
    if (merged || busy) { console.log(`${n}: ready, waits for the live check of the last merge`); continue; }
    if (DRY) { console.log(`${n}: ready, would merge now (dry run)`); merged = n; continue; }
    const before = (await gh('GET', '/git/ref/heads/main')).object.sha;
    const r = await gh('PUT', `/pulls/${p.number}/merge`, { merge_method: 'merge', sha: p.head.sha }, { token: touchesWorkflows ? MERGE_TOKEN : '' }).catch(e => ({ err: e.message }));
    if (!r.merged) { console.log(`${n}: merge refused: ${r.err || r.message}`); await stuck(p, 'Every check is green, but GitHub refused the merge.'); continue; }
    merged = n; log.push(`${n} ${scrub(p.title).slice(0, 80)}`);
    console.log(`${n}: merged as ${r.sha}`);
    await gh('POST', `/issues/${p.number}/comments`, { body: `🚀 Merged by itself: ${REQUIRED.join(', ')} were all green on ${p.head.sha.slice(0, 7)}. The product engineer agent now checks the live site and rolls this back if it broke it.` }).catch(() => {});
    // A merge made with the workflow token starts no workflow, and one made with MERGE_TOKEN starts a plain push run
    // that cannot roll back (it queues behind this one: live-check has a concurrency group). Either way, start the
    // live check by hand with merge/before so that this merge can be rolled back.
    if (touchesWorkflows) console.log(`${n}: changes workflows, merged with MERGE_TOKEN`);
    await gh('POST', '/actions/workflows/live-check.yml/dispatches', { ref: 'main', inputs: { merge: r.sha, before } })
      .catch(e => console.log(`::warning::could not start the live check: ${e.message}`));
  }
  out('merged', merged);
  out('summary', merged ? `Merged ${log.join(', ')}.` : 'Nothing ready to merge.');
} catch (e) {
  console.log(`::error::auto-merge: ${e.message}`);
  process.exit(1);
}
