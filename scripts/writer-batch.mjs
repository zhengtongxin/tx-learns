#!/usr/bin/env node
/* Lets the writer write many lessons in parallel and still open ONE pull request.
   Why: one pull request per lesson made every lesson clash with the others on the generated files (sitemap, track page list,
   related.json, ?v= hashes) and the shared lessons.js. Now each parallel job writes one lesson and packs only its own change;
   one publish job applies all the packs to main and rebuilds the generated files once.
   Usage:
     node scripts/writer-batch.mjs pack <outdir>      in a checkout where the writer just finished (nothing committed)
     node scripts/writer-batch.mjs apply <dir> [...]  in a clean checkout of main: applies each pack, never commits
   A pack holds changes.patch (hand-written changes to tracked files such as <track>/lessons.js, with no context lines so two
   packs that touch different lines never clash), files/ (new files), summary.md. Generated files are never packed: tracked
   pages, sitemap.xml, vercel.json and assets/related.json are rebuilt by `check-pages.mjs --fix` and `search-index.mjs`.
   Exit codes: 0 ok, 1 a pack could not be applied (reason on stderr). */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const git = (...a) => execFileSync('git', ['-c', 'core.quotePath=false', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const lines = s => s.split('\n').filter(Boolean);
const generated = f => ['sitemap.xml', 'vercel.json', 'assets/related.json'].includes(f) || f.endsWith('.html');
const scratch = f => /^inbox\//.test(f) || f === '.writer-summary.md';

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'pack') {
  const out = args[0];
  if (!out) { console.error('usage: writer-batch.mjs pack <outdir>'); process.exit(1); }
  mkdirSync(join(out, 'files'), { recursive: true });
  const changed = lines(git('diff', '--name-only')).filter(f => !generated(f) && !scratch(f));
  writeFileSync(join(out, 'changes.patch'), changed.length ? git('diff', '-U0', '--no-color', '--', ...changed) : '');
  // New files: everything untracked and not scratch (new lessons are .html, so only the generated rule does not apply to them).
  const fresh = lines(git('ls-files', '--others', '--exclude-standard')).filter(f => !scratch(f) && !['sitemap.xml', 'vercel.json', 'assets/related.json'].includes(f));
  for (const f of fresh) { mkdirSync(dirname(join(out, 'files', f)), { recursive: true }); copyFileSync(f, join(out, 'files', f)); }
  writeFileSync(join(out, 'new-files.txt'), fresh.join('\n') + (fresh.length ? '\n' : ''));
  if (existsSync('.writer-summary.md')) copyFileSync('.writer-summary.md', join(out, 'summary.md'));
  if (!changed.length && !fresh.length) { console.error('The writer changed nothing.'); process.exit(1); }
  console.log(`packed ${changed.length} changed file(s) and ${fresh.length} new file(s) into ${out}`);
} else if (cmd === 'apply') {
  if (!args.length) { console.error('usage: writer-batch.mjs apply <dir> [...]'); process.exit(1); }
  for (const dir of args) {
    const names = existsSync(join(dir, 'new-files.txt')) ? lines(readFileSync(join(dir, 'new-files.txt'), 'utf8')) : [];
    for (const f of names) if (existsSync(f)) { console.error(`${dir}: ${f} already exists (two lessons picked the same file name)`); process.exit(1); }
    const patch = join(dir, 'changes.patch');
    if (existsSync(patch) && readFileSync(patch, 'utf8').trim()) {
      try { git('apply', '--unidiff-zero', '--whitespace=nowarn', patch); }
      catch (e) { console.error(`${dir}: could not apply changes.patch: ${String(e.stderr || e.message).slice(0, 400)}`); process.exit(1); }
    }
    for (const f of names) { mkdirSync(dirname(f), { recursive: true }); copyFileSync(join(dir, 'files', f), f); }
    console.log(`applied ${dir}: ${names.length} new file(s)`);
  }
} else { console.error('usage: writer-batch.mjs pack|apply ...'); process.exit(1); }
