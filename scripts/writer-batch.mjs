#!/usr/bin/env node
/* Lets the writer write many lessons in parallel and still open ONE pull request.
   Why: one pull request per lesson made every lesson clash with the others on the generated files (sitemap, track page list,
   related.json, ?v= hashes) and the shared lessons.js. Now each parallel job writes one lesson and packs only its own change;
   one publish job applies all the packs to main and rebuilds the generated files once.
   Usage:
     node scripts/writer-batch.mjs pack <outdir>      in a checkout where the writer just finished (nothing committed)
     node scripts/writer-batch.mjs apply <dir> [...]  in a clean checkout of main: applies each pack, never commits
   A pack holds changes.patch (edits to existing pages, with context) and base/ + edited/ copies of other changed tracked files
   such as <track>/lessons.js, merged three ways on apply so packs that touch different lines never clash, files/ (new files), summary.md. Generated files are never packed: hash/date lines of pages,
   sitemap.xml, vercel.json and assets/related.json are rebuilt by `check-pages.mjs --fix` and `search-index.mjs`.
   Exit codes: 0 ok, 1 a pack could not be applied (reason on stderr). */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const git = (...a) => execFileSync('git', ['-c', 'core.quotePath=false', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const lines = s => s.split('\n').filter(Boolean);
const generated = f => ['sitemap.xml', 'tracks-index.js', 'vercel.json', 'assets/related.json'].includes(f);
// Lines of a page that check-pages --fix rewrites; a changed page counts only for what else changed in it.
const GEN_LINE = '(\\?v=[0-9a-f]{6,}|name="updated"|rel="canonical"|application/ld\\+json|id="lesson-data")';
const scratch = f => /^inbox\//.test(f) || f === '.writer-summary.md';

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'pack') {
  const out = args[0];
  if (!out) { console.error('usage: writer-batch.mjs pack <outdir>'); process.exit(1); }
  mkdirSync(join(out, 'files'), { recursive: true });
  const changed = lines(git('diff', '--name-only')).filter(f => !generated(f) && !scratch(f));
  // Pages: a normal patch (with context, so it still applies when lines shifted), hunks of generated lines left out.
  const pages = changed.filter(f => f.endsWith('.html')), other = changed.filter(f => !f.endsWith('.html'));
  // Other tracked files (lessons.js ...): the whole file before and after, merged three ways on apply, so two lessons that
  // edit one file never land on shifted lines.
  for (const f of other) {
    mkdirSync(dirname(join(out, 'base', f)), { recursive: true }); mkdirSync(dirname(join(out, 'edited', f)), { recursive: true });
    writeFileSync(join(out, 'base', f), git('show', `HEAD:${f}`)); copyFileSync(f, join(out, 'edited', f));
  }
  writeFileSync(join(out, 'merge-files.txt'), other.join('\n') + (other.length ? '\n' : ''));
  let patch = pages.length ? git('diff', '-U3', '--no-color', `-I${GEN_LINE}`, '--', ...pages) : '';
  writeFileSync(join(out, 'changes.patch'), patch);
  // New files: everything untracked and not scratch (new lessons are .html, so only the generated rule does not apply to them).
  const fresh = lines(git('ls-files', '--others', '--exclude-standard')).filter(f => !scratch(f) && !['sitemap.xml', 'tracks-index.js', 'vercel.json', 'assets/related.json'].includes(f));
  for (const f of fresh) { mkdirSync(dirname(join(out, 'files', f)), { recursive: true }); copyFileSync(f, join(out, 'files', f)); }
  writeFileSync(join(out, 'new-files.txt'), fresh.join('\n') + (fresh.length ? '\n' : ''));
  if (existsSync('.writer-summary.md')) copyFileSync('.writer-summary.md', join(out, 'summary.md'));
  if (!patch.trim() && !other.length && !fresh.length) { console.error('The writer changed nothing.'); process.exit(1); }
  console.log(`packed ${changed.length} changed file(s) and ${fresh.length} new file(s) into ${out}`);
} else if (cmd === 'apply') {
  if (!args.length) { console.error('usage: writer-batch.mjs apply <dir> [...]'); process.exit(1); }
  for (const dir of args) {
    const names = existsSync(join(dir, 'new-files.txt')) ? lines(readFileSync(join(dir, 'new-files.txt'), 'utf8')) : [];
    for (const f of names) if (existsSync(f)) { console.error(`${dir}: ${f} already exists (two lessons picked the same file name)`); process.exit(1); }
    const patch = join(dir, 'changes.patch');
    if (existsSync(patch) && readFileSync(patch, 'utf8').trim()) {
      try { git('apply', '--whitespace=nowarn', patch); }
      catch (e) { console.error(`${dir}: could not apply changes.patch: ${String(e.stderr || e.message).slice(0, 400)}`); process.exit(1); }
    }
    const merges = existsSync(join(dir, 'merge-files.txt')) ? lines(readFileSync(join(dir, 'merge-files.txt'), 'utf8')) : [];
    for (const f of merges) {
      // Three-way merge: main's file now + this pack's edit relative to the file the writer started from.
      try { const r = execFileSync('git', ['merge-file', '-p', f, join(dir, 'base', f), join(dir, 'edited', f)], { encoding: 'utf8', maxBuffer: 1 << 28 }); writeFileSync(f, r); }
      catch (e) { console.error(`${dir}: ${f} clashes with another lesson's change (same lines edited)`); process.exit(1); }
    }
    for (const f of names) { mkdirSync(dirname(f), { recursive: true }); copyFileSync(join(dir, 'files', f), f); }
    console.log(`applied ${dir}: ${names.length} new file(s)`);
  }
} else { console.error('usage: writer-batch.mjs pack|apply ...'); process.exit(1); }
