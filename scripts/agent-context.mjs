#!/usr/bin/env node
// Deterministic prep for the reviewer and writer agents, run in a workflow step BEFORE Claude, so the model reads a short
// brief instead of discovering the same facts with tool calls. No AI, no network.
//   node scripts/agent-context.mjs review --diff /tmp/pr.diff --checks /tmp/copy-check.txt [--code /tmp/code-check.txt] --out /tmp/review-context.md
//   node scripts/agent-context.mjs writer --dirs "inbox/a inbox/b" --out /tmp/writer-context.md
// review: the changed files, the diff without generated noise (sitemap, hashes, related.json) and capped, only the failing
//   lines of the copy/counts/pages/security/code checks, the CLAUDE.md lines that mention a changed non-lesson file, and the
//   top 3 related passages for each changed lesson (scripts/rag.mjs).
// writer: the top 3 passages the site already has on the notes' concept, to link back to instead of repeating.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Self-contained on purpose: workflows download this one file from main and run it, so it imports nothing from the repo.
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

const ROOT = resolve(arg('root', resolve(dirname(fileURLToPath(import.meta.url)), '..')));
const [mode] = process.argv.slice(2);
const read = f => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };
const GENERATED = /^(sitemap\.xml|tracks-index\.js|vercel\.json|robots\.txt|assets\/related\.json|package-lock\.json)$/;
const DIFF_CAP = +arg('cap', 60000);

function rag(args) {
  try { return JSON.parse(execFileSync('node', [join(ROOT, 'scripts/rag.mjs'), ...args, '--k', '3', '--chars', '300', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 30000 })); } catch { return []; }
}
const passages = hits => hits.map(h => `- ${h.lesson} (${h.title}): ${h.passage}`).join('\n');

// Splits a unified diff into per-file chunks.
function files(diff) {
  const out = [];
  for (const part of diff.split(/^(?=diff --git )/m).filter(Boolean)) {
    const m = part.match(/^diff --git a\/(.+?) b\/(.+)$/m);
    if (!m) continue;
    const add = (part.match(/^\+(?!\+\+)/gm) || []).length, del = (part.match(/^-(?!--)/gm) || []).length;
    out.push({ path: m[2], text: part, add, del });
  }
  return out;
}

function review() {
  const fl = files(read(arg('diff', '/tmp/pr.diff')));
  const lessons = fl.filter(f => /^[\w-]+\/\d\d-[^/]+\.html$/.test(f.path)).map(f => f.path);
  const L = ['# Brief for this review (made by a script before you started; the full files are in the checkout)', ''];
  L.push('## Changed files', ...fl.slice(0, 40).map(f => `- ${f.path} (+${f.add} -${f.del})${GENERATED.test(f.path) ? ' [generated: skipped below]' : ''}`), ...(fl.length > 40 ? [`- ...and ${fl.length - 40} more files`] : []), '');

  // Only what failed. A clean run is one line.
  const bad = [];
  for (const [name, f] of [['copy, counts, pages, security checks', arg('checks', '/tmp/copy-check.txt')], ['code boxes', arg('code', '/tmp/code-check.txt')]]) {
    const lines = read(f).split('\n').filter(l => /✗|✘|\bfail|\berror\b|::error|SyntaxError|Traceback/i.test(l) && !/^\s*$/.test(l));
    if (lines.length) bad.push(`### ${name}: ${lines.length} problem line${lines.length > 1 ? 's' : ''}`, ...lines.slice(0, 25).map(l => '- ' + l.trim().slice(0, 300)));
  }
  L.push('## Check results', ...(bad.length ? bad : ['All of copy, counts, pages, security and code-box checks passed on this branch. Do not re-run them.']), '');

  // Diff: lessons first, then the rest; generated files and hash-only lines dropped; capped.
  const keep = fl.filter(f => !GENERATED.test(f.path)).sort((a, b) => (lessons.includes(b.path) ? 1 : 0) - (lessons.includes(a.path) ? 1 : 0));
  let used = 0, cut = 0; const parts = [];
  for (const f of keep) {
    const text = f.text.split('\n').filter(l => !/^[+-].*\?v=[0-9a-f]{6,}/.test(l) || /^[+-]{3}/.test(l)).join('\n');
    if (used + text.length > DIFF_CAP) { cut++; parts.push(`(diff of ${f.path} left out to keep this short: open it in the checkout)`); continue; }
    used += text.length; parts.push(text);
  }
  L.push('## Diff', '```diff', parts.join('\n').trimEnd(), '```', '');
  if (lessons.length) L.push('## Changed lessons (open each in full)', ...lessons.slice(0, 12).map(l => `- ${l}`), ...(lessons.length > 12 ? [`- ...and ${lessons.length - 12} more`] : []), '');

  // Policy lines that matter only when a script, workflow or page changed.
  const other = fl.filter(f => !lessons.includes(f.path) && !GENERATED.test(f.path)).map(f => f.path);
  if (other.length) {
    const needles = [...new Set(other.flatMap(p => [p, p.split('/').pop()]))].filter(n => n.length > 5);
    const rules = read(join(ROOT, 'CLAUDE.md')).split('\n').filter(l => needles.some(n => l.includes(n)));
    if (rules.length) L.push('## What CLAUDE.md says about the changed files (keep it true)', ...rules.slice(0, 8).map(l => '- ' + l.replace(/\s+/g, ' ').slice(0, 700)), '');
  }

  // What the site already teaches near each changed lesson (top 3 each, at most 3 lessons).
  const rel = lessons.slice(0, 3).map(l => `### Near ${l}\n${passages(rag(['--related', l]))}`).filter(s => s.split('\n').length > 1);
  if (rel.length) L.push('## Related lessons already on the site (for consistency, do not run rag.mjs again)', ...rel, '');
  writeFileSync(arg('out', '/tmp/review-context.md'), L.join('\n'));
  console.log(`review brief: ${fl.length} files, diff ${Math.round(used / 1000)} KB${cut ? `, ${cut} left out` : ''}, ${lessons.length} lessons, ${bad.length ? 'problems in checks' : 'checks clean'}`);
}

function writer() {
  const dirs = arg('dirs', '').split(/\s+/).filter(Boolean);
  const L = ['# What the site already says about these notes (made by a script; do not run rag.mjs again)', ''];
  for (const d of dirs) {
    const dir = join(ROOT, d), name = d.split('/').pop().replace(/-/g, ' ');
    let notes = '';
    try { for (const f of readdirSync(dir).filter(f => /\.(md|txt)$/.test(f)).sort()) notes += ' ' + read(join(dir, f)); } catch { /* folder missing */ }
    const heads = (notes.match(/^#+ .+$/gm) || []).slice(0, 4).join(' ').replace(/#+ /g, '');
    const q = `${name} ${heads}`.replace(/\s+/g, ' ').trim().slice(0, 200);
    const hits = rag([q]);
    L.push(`## ${d}`, `Searched: ${q}`, hits.length ? passages(hits) : 'Nothing on the site covers this yet.', '');
  }
  writeFileSync(arg('out', '/tmp/writer-context.md'), L.join('\n'));
  console.log(`writer brief: ${dirs.length} folder${dirs.length === 1 ? '' : 's'}`);
}

if (mode === 'review') review();
else if (mode === 'writer') writer();
else { console.error('Usage: node scripts/agent-context.mjs review|writer ...'); process.exit(2); }
