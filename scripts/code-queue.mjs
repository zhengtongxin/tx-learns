#!/usr/bin/env node
// The code review queue of the efficiency engineer agent (optimizer.yml): which of the site's own code files it has
// not read yet. The first pass covers every file, a batch per run; after that only files that changed since they were
// read come back. No AI, no cost.
//   node scripts/code-queue.mjs plan --out DIR                     pick this run's batch: DIR/code-brief.md and DIR/code-batch.json
//   node scripts/code-queue.mjs done --batch FILE [--failed]       remember the batch as read (run it in the repo after the agent's edits)
//   node scripts/code-queue.mjs list                               print every file in scope with its area and size
// The memory is signals/code-review.json on the data-only `agent-status` branch: { files: { <path>: { h: [hashes], at, tries } } }.
// A file is "read" while its current hash is one of `h`: the hash it had when the agent read it and the hash it had
// after the agent's own edit, so the agent's merged fix does not send the file straight back into the queue.
// A batch stays inside one area (scripts/areas.json), so the pull request passes the scope guard.
// `--failed` (the run could not finish) counts a try; after 2 tries the batch is remembered anyway, so one bad file
// cannot block the queue.
// `plan` prints and exports (GITHUB_OUTPUT): review=true|false, area, count, left (files still waiting after this batch).
// Env: GITHUB_TOKEN (contents: write for `done`), GITHUB_REPOSITORY. The repository is the current folder.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { rawFile, update } from './signals.mjs';
import { arg } from './lib.mjs';

const STATE = 'signals/code-review.json';
export const BUDGET = 120 * 1024; // bytes of code per run: what one run can read with care
export const MAX_TRIES = 2;
// Files the efficiency engineer may not change (optimizer.yml guards the same list), so reading them is no use.
const PROTECTED = /^scripts\/(auto-merge|claude-run|record-status|trace|code-queue)\.mjs$/;
// Data, not code: long lists that the page check and the count check already verify.
const DATA = /^assets\/build-concepts\.js$/;
// Pages whose own <script> holds real logic. Lessons and their widget scripts are lesson content: the reader and reviewer agents read those.
const PAGES = ['ecosystem.html', 'glossary.html', 'tracks.html', 'index.html', 'study/index.html', 'study/how.html'];
const DIRS = [['api', /\.js$/], ['assets', /\.(js|css)$/], ['coach', /\.js$/], ['scripts', /\.mjs$/]];

// Every code file in scope, as repo paths. Folders are read one level deep, so coach/vendor/ (copied libraries) stays out.
export function scope(root) {
  const out = [];
  for (const [dir, re] of DIRS) {
    if (!existsSync(join(root, dir))) continue;
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isFile() && re.test(e.name) && !PROTECTED.test(p) && !DATA.test(p)) out.push(p);
    }
  }
  for (const p of PAGES) if (existsSync(join(root, p))) out.push(p);
  return out.sort();
}

// The hash ignores the ?v=<hash> that check-pages --fix rewrites in every page, so a page does not look changed when only an asset did.
export const hashOf = text => createHash('sha256').update(String(text).replace(/\?v=[0-9a-f]{8}\b/g, '?v=')).digest('hex').slice(0, 16);

// First matching area of scripts/areas.json (the same rule as the scope guard); files outside every area share "other".
export function areaOf(path, areas) {
  for (const a of areas || []) if ((a.paths || []).some(p => (p.endsWith('/') ? path.startsWith(p) : path === p))) return a.id;
  return 'other';
}

// files [{path, bytes, hash, area}] + remembered state -> { batch, left, area }.
// Waiting = never read, or changed since it was read. The batch is the waiting files of ONE area (the area of the first
// waiting file, in path order), filled up to the budget; always at least one file.
export function pickBatch(files, state = {}, budget = BUDGET) {
  const seen = state.files || {};
  const waiting = files.filter(f => !(seen[f.path]?.h || []).includes(f.hash))
    .map(f => ({ ...f, why: seen[f.path]?.h?.length ? 'changed' : 'new' }));
  if (!waiting.length) return { batch: [], left: 0, area: '' };
  const area = waiting[0].area, batch = [];
  let used = 0;
  for (const f of waiting.filter(f => f.area === area)) {
    if (batch.length && used + f.bytes > budget) continue;
    batch.push(f); used += f.bytes;
  }
  return { batch, left: waiting.length - batch.length, area };
}

// Remember a batch. ok: the files are read (their hash at plan time and their hash now). failed: count a try, and give up
// on the batch (remember it as read) once it has failed MAX_TRIES times.
export function remember(state, batch, nowHash, { failed = false, at = new Date().toISOString() } = {}) {
  state.files ||= {};
  for (const f of batch) {
    const cur = state.files[f.path] || {}, tries = (cur.tries || 0) + 1;
    if (failed && tries < MAX_TRIES) { state.files[f.path] = { ...cur, h: cur.h || [], tries }; continue; }
    const now = nowHash(f.path);
    state.files[f.path] = { h: [...new Set([f.hash, now].filter(Boolean))], at, ...(failed ? { gaveUp: true } : {}) };
  }
  return state;
}

export function measure(root) {
  let areas = [];
  try { areas = JSON.parse(readFileSync(join(root, 'scripts/areas.json'), 'utf8')).areas; } catch {}
  return scope(root).map(path => ({ path, bytes: statSync(join(root, path)).size, hash: hashOf(readFileSync(join(root, path), 'utf8')), area: areaOf(path, areas) }));
}

const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
const kb = n => `${(n / 1024).toFixed(1)} KB`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve('.'), mode = process.argv[2];
  if (mode === 'list') {
    for (const f of measure(root)) console.log(`${f.area.padEnd(12)} ${kb(f.bytes).padStart(9)}  ${f.path}`);
  } else if (mode === 'plan') {
    const dir = arg('out', '/tmp'); mkdirSync(dir, { recursive: true });
    const files = measure(root), { batch, left, area } = pickBatch(files, await rawFile(STATE));
    if (!batch.length) { console.log(`Code review queue: nothing waiting (${files.length} files, all read since they last changed).`); out('review', 'false'); }
    else {
      writeFileSync(join(dir, 'code-batch.json'), JSON.stringify({ area, files: batch.map(f => ({ path: f.path, hash: f.hash })) }, null, 1) + '\n');
      writeFileSync(join(dir, 'code-brief.md'), `# Code review batch\n\nArea: ${area}. Read each of these files in full. "new" = never reviewed, "changed" = changed since its last review.\n\n${batch.map(f => `- \`${f.path}\` (${kb(f.bytes)}, ${f.why})`).join('\n')}\n\n${left} more file(s) wait for later runs.\n`);
      console.log(`Code review batch (${area}): ${batch.map(f => f.path).join(' ')}\n${left} more waiting.`);
      out('review', 'true'); out('area', area); out('count', batch.length); out('left', left);
    }
  } else if (mode === 'done') {
    const b = JSON.parse(readFileSync(arg('batch', '/tmp/code-batch.json'), 'utf8')), failed = process.argv.includes('--failed');
    const nowHash = p => (existsSync(join(root, p)) ? hashOf(readFileSync(join(root, p), 'utf8')) : '');
    await update(STATE, d => remember(d, b.files || [], nowHash, { failed }));
  } else { console.error('Usage: node scripts/code-queue.mjs plan --out DIR | done --batch FILE [--failed] | list'); process.exit(2); }
}
