#!/usr/bin/env node
// Durable authoring memory: what the reviews keep finding, so the writer and the reviewer stop repeating it.
//   node scripts/memory.mjs show                 print the memory as short advice (for a prompt); reads the public raw file
//   node scripts/memory.mjs learn <review.json>  add a review's findings (checked against schemas/review.schema.json) to the memory
//   node scripts/memory.mjs note "<text>"        add one decision or rule of thumb (TX's, or an agent's)
// Stored in memory/authoring.json on the data-only `agent-status` branch (never deployed, never merged), as counts per
// category, the latest few examples of each, and a short list of notes. Text is scrubbed of banned terms and cut short.
// Env for learn / note: GITHUB_TOKEN with contents: write, GITHUB_REPOSITORY. Never fails a workflow.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { validate } from './validate.mjs';
import { scrub } from './lib.mjs';

const BRANCH = 'agent-status', PATH = 'memory/authoring.json', EX = 3, NOTES = 30;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const short = (s, n) => scrub(String(s || '')).replace(/\s+/g, ' ').trim().slice(0, n);

export function merge(mem, review, at = new Date().toISOString()) {
  mem = { issues: {}, notes: [], ...mem };
  mem.issues ||= {};
  for (const f of review.findings) {
    if (f.severity !== 'blocker') continue; // only real errors are worth remembering; nits are taste
    const i = (mem.issues[f.category] ||= { count: 0, examples: [] });
    i.count++;
    i.examples = [{ at, text: short(f.text, 160), file: short(f.file, 80) }, ...i.examples].slice(0, EX);
  }
  return mem;
}

export function render(mem) {
  const rows = Object.entries(mem.issues || {}).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  const out = [];
  if (rows.length) {
    out.push('Mistakes the reviews keep finding (most often first). Check your lesson for each before you finish:');
    for (const [cat, v] of rows) out.push(`- ${cat} (${v.count}x). Latest: ${(v.examples[0] || {}).text || ''}`);
  }
  if ((mem.notes || []).length) { out.push('', 'Decisions and rules of thumb to keep:'); for (const n of mem.notes.slice(0, 10)) out.push(`- ${n.text}`); }
  return out.length ? out.join('\n') : 'Nothing remembered yet.';
}

const repo = process.env.GITHUB_REPOSITORY || 'zhengtongxin/tx-learns';
async function api(method, path, body) {
  const t = process.env.GITHUB_TOKEN;
  const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { method, headers: { ...(t ? { authorization: `Bearer ${t}` } : {}), accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'tx-learns-agents' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
async function update(change) {
  if (!process.env.GITHUB_TOKEN) { console.log('::warning::memory: no GITHUB_TOKEN'); return; }
  if ((await api('GET', `/git/ref/heads/${BRANCH}`)).status !== 200) { console.log('::warning::memory: no agent-status branch yet'); return; }
  for (let attempt = 1; attempt <= 5; attempt++) {
    const cur = await api('GET', `/contents/${PATH}?ref=${BRANCH}`);
    let mem = {}; try { mem = JSON.parse(Buffer.from(cur.json.content || '', 'base64').toString() || '{}'); } catch {}
    const next = change(mem);
    const put = await api('PUT', `/contents/${PATH}`, { message: 'authoring memory', branch: BRANCH, ...(cur.json.sha ? { sha: cur.json.sha } : {}), content: Buffer.from(JSON.stringify(next, null, 1) + '\n').toString('base64') });
    if (put.status < 300) { console.log('Authoring memory updated.'); return; }
    if (put.status !== 409 && put.status !== 422) { console.log(`::warning::memory: ${put.status} ${put.json.message}`); return; }
    await new Promise(r => setTimeout(r, 1000 * attempt + Math.random() * 1000));
  }
  console.log('::warning::memory: gave up after 5 tries');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'show') {
      const r = await fetch(`https://raw.githubusercontent.com/${repo}/${BRANCH}/${PATH}`);
      console.log(r.ok ? render(await r.json()) : 'Nothing remembered yet.');
    } else if (cmd === 'learn') {
      const review = JSON.parse(readFileSync(arg, 'utf8'));
      const problems = validate(JSON.parse(readFileSync(join(ROOT, 'schemas/review.schema.json'), 'utf8')), review);
      if (problems.length) console.log(`Not learning from this review: ${problems[0]}`);
      else await update(m => merge(m, review));
    } else if (cmd === 'note') {
      const text = short(arg, 300);
      if (!text) { console.error('Usage: node scripts/memory.mjs note "<text>"'); process.exit(2); }
      await update(m => ({ ...m, notes: [{ at: new Date().toISOString(), text }, ...(m.notes || [])].slice(0, NOTES) }));
    } else console.log('Usage: node scripts/memory.mjs show | learn <review.json> | note "<text>"');
  } catch (e) { console.log(`::warning::memory: ${e.message}`); }
}
