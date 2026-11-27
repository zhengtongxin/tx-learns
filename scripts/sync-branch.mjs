#!/usr/bin/env node
/* Brings one lesson pull request's branch up to date with main when the only clashes are generated files.
   Why: every lesson PR changes the same generated lists (sitemap.xml, the track page's no-JavaScript list, related.json) and
   its own `file:` line in lessons.js, so when one PR merges the others show a conflict even though nothing is wrong.
   Usage (in a clean checkout of main, so the scripts are trusted): node scripts/sync-branch.mjs <branch>
   It merges origin/main into a local copy of origin/<branch>, takes main's version of the generated files, keeps every
   lesson `file:` the branch added to lessons.js, then runs the page check --fix and the search index. If any other file clashes,
   or the branch touches scripts/ or .github/, it stops and changes nothing. It never pushes: the workflow does that.
   Exit codes: 0 = the local branch "sync-work" is ready to push (or already up to date), 2 = skipped (reason on stderr). */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const branch = process.argv[2];
if (!branch || !/^(writer|improver)\/[\w.-]+$/.test(branch)) { console.error('skip: only writer/ and improver/ branches'); process.exit(2); }
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (...a) => { try { return { ok: true, out: git(...a) }; } catch (e) { return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }; } };
const skip = why => { tryGit('merge', '--abort'); console.error('skip: ' + why); process.exit(2); };

git('fetch', '-q', 'origin', 'main', branch);
const touched = git('diff', '--name-only', 'origin/main...origin/' + branch).split('\n').filter(Boolean);
if (touched.some(f => /^(scripts|\.github)\//.test(f))) skip('the branch changes scripts/ or .github/');
git('checkout', '-q', '-B', 'sync-work', 'origin/' + branch);
git('config', 'user.name', 'TX Learns sync');
git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');

const m = tryGit('merge', '--no-edit', 'origin/main');
if (m.ok) { console.log(/Already up to date/.test(m.out) ? 'already up to date' : 'clean merge'); process.exit(0); }

const conflicted = git('diff', '--name-only', '--diff-filter=U').split('\n').filter(Boolean);
const generated = f => ['sitemap.xml', 'tracks-index.js', 'vercel.json', 'assets/related.json'].includes(f) || /^[\w-]+\/(index\.html|lessons\.js)$/.test(f);
/* A lesson page the branch did not add (it exists on main's side of the merge base) only clashes because both sides
   rewrote its ?v= hashes; --fix below rebuilds them, so main's copy is taken. */
const base = git('merge-base', 'origin/main', 'origin/' + branch);
const hashOnly = f => {
  const d = tryGit('diff', '-U0', base, 'origin/' + branch, '--', f);
  return d.ok && d.out.split('\n').filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).every(l => /\?v=/.test(l));
};
const notMine = f => branch.startsWith('writer/') && /\.html$/.test(f) && tryGit('cat-file', '-e', base + ':' + f).ok && hashOnly(f);
const other = conflicted.filter(f => !generated(f) && !notMine(f));
if (other.length) skip('other files clash: ' + other.join(', '));

for (const f of conflicted) {
  if (f.endsWith('/lessons.js')) {
    /* main's text, plus any lesson `file:` the branch added to an item (items are found by their English title) */
    const ours = git('show', ':2:' + f), theirs = git('show', ':3:' + f);
    const key = l => (l.match(/title:\{en:(["'])(.*?)\1/) || [])[2];
    const mine = new Map(ours.split('\n').filter(l => /file:'/.test(l)).map(l => [key(l), l]));
    writeFileSync(f, theirs.split('\n').map(l => (!/file:'/.test(l) && key(l) && mine.has(key(l))) ? mine.get(key(l)) : l).join('\n'));
  } else {
    git('checkout', '--theirs', '--', f);
  }
  git('add', f);
}
/* The generated files are rebuilt with main's trusted scripts. --fix also updates the ?v= hashes in the track's other pages
   when lessons.js changes; the page check needs that, so it is kept. */
git('checkout', 'origin/main', '--', 'scripts');
for (const cmd of [['scripts/check-pages.mjs', '--fix']]) {
  try { execFileSync('node', cmd, { stdio: 'inherit' }); } catch { skip(cmd[0] + ' failed after the merge'); }
}
git('add', '-A');
git('commit', '-q', '--no-edit');
console.log('merged main and rebuilt the generated files');
