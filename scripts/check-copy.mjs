#!/usr/bin/env node
// Copyright scrubber: fails when a served file mentions a source, a course, an instructor
// or a source's week/day structure. Patterns live in banned-words.txt.
// Usage: node scripts/check-copy.mjs [files...]   (no files = every .html/.js/.css the site serves)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { bannedSources } from './lib.mjs';

const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['.git', 'node_modules', 'scripts', '.github', 'inbox']);
const publicRules = new Set(readFileSync(join(root, 'banned-words.txt'), 'utf8').split('\n').map(l => l.trim()));
// A private rule (a source's name) is never printed: logs and PR comments are public.
const patterns = bannedSources(root).map(src => ({ src, priv: !publicRules.has(src), re: new RegExp(src, 'giu') }));
// The source names are not kept in the repo (it is public), so only the generic rules always run. The names are
// optional extras: the BANNED_WORDS_EXTRA environment variable (one regex per line) or an untracked
// banned-words.local.txt. Without them the copy check still passes; keep names out of notes before they are pushed.

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|js|css|json)$/.test(name)) out.push(p);
  }
  return out;
}

const files = process.argv.length > 2 ? process.argv.slice(2).map(f => join(process.cwd(), f)) : walk(root);
let hits = 0;
for (const f of files) {
  if (!/\.(html|js|css|json)$/.test(f)) continue;
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const { src, priv, re } of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        hits++;
        const s = Math.max(0, m.index - 40);
        if (priv) console.log(`${relative(root, f)}:${i + 1}: a source's name appears here (rule kept private)`);
        else console.log(`${relative(root, f)}:${i + 1}: "${m[0]}" (rule: ${src})\n    …${line.slice(s, m.index + m[0].length + 40).trim()}…`);
      }
    }
  });
}
// Stray build files (a full run only): compiled Python, OS clutter, installed packages.
if (process.argv.length <= 2) {
  let tracked = [];
  try { tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n'); } catch { /* not a git checkout */ }
  for (const f of tracked.filter(f => /(^|\/)(__pycache__|node_modules)\/|\.py[co]$|(^|\/)\.DS_Store$/.test(f))) {
    hits++;
    console.log(`${f}: stray build file. Delete it (git rm --cached) and keep it out with .gitignore.`);
  }
}
if (hits) { console.log(`\n${hits} problem(s). Rewrite them in your own words, or name the concept instead of the source.`); process.exit(1); }
console.log(`Copy check passed: ${files.length} files, ${patterns.length} rules.`);
