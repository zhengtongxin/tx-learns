#!/usr/bin/env node
// Signals for the improvement agent: what the other agents already found that nobody has acted on yet.
//   node scripts/signals.mjs record-reader <reader.json>   keep the intern's latest score and top confusing parts per lesson
//   node scripts/signals.mjs brief --out DIR               pick ONE thing worth fixing and write DIR/brief.md (no AI, no cost)
//   node scripts/signals.mjs attempt <key>                 remember that this item was tried, so it is not retried for 7 days
// Stored on the data-only `agent-status` branch (signals/*.json; never deployed, never merged), text scrubbed and cut short.
// `brief` prints and exports (GITHUB_OUTPUT): actionable=true|false, kind, key, files (space-separated allowed files).
// Order of priority: a broken page or link from the weekly quality check, then the lowest-scored lesson the intern flagged.
// Env: GITHUB_TOKEN (contents: write for record/attempt), GITHUB_REPOSITORY.
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { gh, scrub, REPO, arg } from './lib.mjs';

const BRANCH = 'agent-status', COOLDOWN_DAYS = 7, LOW = 8, MAX_TRIES = 3; // a lesson the intern re-read after a fix and still scores under 8 gets another fix at once (up to 3 tries within the 7-day window)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const short = (s, n) => scrub(String(s || '')).replace(/\s+/g, ' ').trim().slice(0, n);
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

export async function rawFile(path) {
  if (process.env.GITHUB_TOKEN) { // the contents API is fresh; raw.githubusercontent.com caches for minutes
    try { const r = await api('GET', `/contents/${path}?ref=${BRANCH}`); if (r.status === 200) return JSON.parse(Buffer.from(r.json.content || '', 'base64').toString() || '{}'); } catch {}
  }
  try { const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`); return r.ok ? await r.json() : {}; } catch { return {}; }
}

async function api(method, path, body) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, { method, headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'tx-learns-agents' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
// Read-modify-write one JSON file on the agent-status branch, retrying when another agent wrote at the same time.
export async function update(path, change) {
  if (!process.env.GITHUB_TOKEN) return console.log('::warning::signals: no GITHUB_TOKEN');
  if ((await api('GET', `/git/ref/heads/${BRANCH}`)).status !== 200) return console.log('::warning::signals: no agent-status branch yet');
  for (let attempt = 1; attempt <= 5; attempt++) {
    const cur = await api('GET', `/contents/${path}?ref=${BRANCH}`);
    let data = {}; try { data = JSON.parse(Buffer.from(cur.json.content || '', 'base64').toString() || '{}'); } catch {}
    const put = await api('PUT', `/contents/${path}`, { message: `signals: ${path}`, branch: BRANCH, ...(cur.json.sha ? { sha: cur.json.sha } : {}), content: Buffer.from(JSON.stringify(change(data), null, 1) + '\n').toString('base64') });
    if (put.status < 300) return console.log(`${path} updated.`);
    if (put.status !== 409 && put.status !== 422) return console.log(`::warning::signals: ${put.status} ${put.json.message}`);
    await new Promise(r => setTimeout(r, 1000 * attempt + Math.random() * 1000));
  }
  console.log('::warning::signals: gave up after 5 tries');
}

export function mergeReader(data, reader, at = new Date().toISOString()) {
  data.lessons ||= {};
  for (const l of reader.lessons || []) {
    const file = String(l.file || '').replace(/^\/+/, '');
    if (!/^[a-z0-9-]+\/\d\d-[a-z0-9-]+\.html$/.test(file)) continue;
    data.lessons[file] = { score: Math.max(0, Math.min(10, +l.score || 0)), at, confusing: (l.confusing || []).slice(0, 3).map(c => ({ where: short(c.where, 60), why: short(c.why, 200) })) };
  }
  return data;
}

// Ideas the role scouts left in the backlog (scripts/scout.mjs), best first.
export const pendingIdeas = (state = {}) => (state.ideas || []).filter(i => existsSync(join(ROOT, i.file))).sort((a, b) => a.priority - b.priority || Date.parse(a.at) - Date.parse(b.at));

// Pick the one thing to fix. Returns {kind, key, files, text} or null.
export async function pick({ ideas = true } = {}) {
  const tried = await rawFile('signals/improver.json'), attempts = tried.attempts || {}, tries = tried.tries || {};
  const fresh = k => process.env.IMPROVER_NOW === '1' || !attempts[k] || Date.now() - Date.parse(attempts[k]) > COOLDOWN_DAYS * 864e5;
  const issues = await gh('GET', '/issues?state=open&per_page=50').catch(() => []);
  const q = issues.find(i => !i.pull_request && i.title === 'Quality check');
  if (q) {
    const pages = [...new Set((q.body || '').match(/\b[a-z0-9-]+(?:\/[a-z0-9-]+)?\.html\b/gi) || [])].filter(p => existsSync(join(ROOT, p)));
    // One area per pull request: keep only pages in the same folder as the first one (top-level pages count as one group).
    const area = p => (p.includes('/') ? p.split('/')[0] : '.');
    pages.splice(0, pages.length, ...pages.filter(p => area(p) === area(pages[0])));
    const key = `quality:${pages.slice(0, 3).join(',')}`;
    if (pages.length && fresh(key)) return { kind: 'quality', key, files: pages.slice(0, 3), text: `The weekly quality check found these problems (open issue "Quality check"):\n\n${short((q.body || '').replace(/\n{3,}/g, '\n\n'), 3000)}\n\nFix only the problems on the listed pages. Do not touch anything else.` };
  }
  const reader = (await rawFile('signals/reader.json')).lessons || {};
  const low = Object.entries(reader).filter(([f, v]) => v.score < LOW && existsSync(join(ROOT, f)) && (fresh(`reader:${f}`) || (v.at && Date.parse(v.at) > Date.parse(attempts[`reader:${f}`]) && (tries[`reader:${f}`] || 0) < MAX_TRIES))).sort((a, b) => a[1].score - b[1].score)[0];
  if (low) {
    const [file, v] = low;
    const js = file.replace(/^([^/]+)\/(\d\d-[^.]+)\.html$/, '$1/js/$2.js');
    return { kind: 'reader', key: `reader:${file}`, files: [file, ...(existsSync(join(ROOT, js)) ? [js] : [])], text: `The intern agent (reads lessons as a newcomer to AI) scored ${file} ${v.score}/10 and found these confusing parts:\n${v.confusing.map(c => `- ${c.where}: ${c.why}`).join('\n')}\n\nFix only those parts: small wording changes, a missing step or an unexplained term, in both English and 中文. Keep the story, the structure and the lesson's own voice. Do not touch what was not flagged.` };
  }
  if (!ideas) return null;
  const idea = pendingIdeas(await rawFile('signals/ideas.json'))[0];
  if (idea) {
    const js = idea.file.replace(/^([^/]+)\/(\d\d-[^.]+)\.html$/, '$1/js/$2.js');
    return { kind: 'idea', key: `idea:${idea.id}`, files: [idea.file, ...(js !== idea.file && existsSync(join(ROOT, js)) ? [js] : [])], text: (idea.role === 'readers' ? `Real readers answered "Was this lesson clear?" on ${idea.file}. ${idea.why}\nThey did not say which part. Read the lesson as someone new to AI and find the one or two places most likely to lose them: a term used before it is explained, a step that jumps, an example that does not match the point.\n\nCheck it` : idea.role === 'news' ? `The news agent read an official AI source (${idea.source}) that may make ${idea.file} out of date: ${idea.title}\nWhy: ${idea.why}\n\nYou cannot browse, so use only what the idea states, never facts from memory; where a fact changed, say it plainly with the month, and keep the lesson's story. Check it` : `The ${idea.role.replace(/-/g, ' ')} agent looked at ${idea.file} and suggests: ${idea.title}\nWhy: ${idea.why}\n\nCheck it`) + ` on closer reading first. If it is not real, or not clearly better, change nothing. Otherwise make just that one focused change, in both English and 中文 where text is involved.` };
  }
  return null;
}

const mode = process.argv[2];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (mode === 'record-reader') {
    const reader = JSON.parse(readFileSync(process.argv[3], 'utf8'));
    await update('signals/reader.json', d => mergeReader(d, reader));
  } else if (mode === 'attempt') {
    const key = process.argv[3];
    await update('signals/improver.json', d => { d.attempts ||= {}; d.tries ||= {}; d.tries[key] = (d.attempts[key] && Date.now() - Date.parse(d.attempts[key]) <= COOLDOWN_DAYS * 864e5 ? d.tries[key] || 1 : 0) + 1; d.attempts[key] = new Date().toISOString(); for (const k of Object.keys(d.attempts)) if (Date.now() - Date.parse(d.attempts[k]) > 30 * 864e5) { delete d.attempts[k]; delete d.tries[k]; } return d; });
    if (key.startsWith('idea:')) await update('signals/ideas.json', d => { const i = (d.ideas || []).find(x => 'idea:' + x.id === key); if (i) (d.done ||= []).push({ file: i.file, title: i.title, at: new Date().toISOString() }); d.ideas = (d.ideas || []).filter(x => 'idea:' + x.id !== key); d.done = (d.done || []).slice(-60); return d; });
  } else if (mode === 'brief') {
    const dir = arg('out', '/tmp/improver'); mkdirSync(dir, { recursive: true });
    const p = await pick();
    if (!p) { console.log('Nothing to fix: no open quality problem, no lesson the intern scored under 8 and no idea waiting.'); out('actionable', 'false'); }
    else {
      writeFileSync(join(dir, 'brief.md'), `${p.text}\n\nFiles you may change: ${p.files.join(', ')}\n`);
      console.log(`Target (${p.kind}): ${p.key}\nFiles: ${p.files.join(' ')}`);
      out('actionable', 'true'); out('kind', p.kind); out('key', p.key); out('files', p.files.join(' '));
    }
  } else { console.error('Usage: node scripts/signals.mjs record-reader <file> | brief --out DIR | attempt <key>'); process.exit(2); }
}
