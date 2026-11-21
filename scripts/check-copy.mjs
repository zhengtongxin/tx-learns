#!/usr/bin/env node
// Copyright scrubber: fails when a served file mentions a source, a course, an instructor
// or a source's week/day structure. Patterns live in banned-words.txt.
// Usage: node scripts/check-copy.mjs [files...]   (no files = every .html/.js/.css the site serves)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['.git', 'node_modules', 'scripts', '.github', 'inbox']);
const patterns = readFileSync(join(root, 'banned-words.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(src => ({ src, re: new RegExp(src, 'giu') }));

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
    for (const { src, re } of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        hits++;
        const s = Math.max(0, m.index - 40);
        console.log(`${relative(root, f)}:${i + 1}: "${m[0]}" (rule: ${src})\n    …${line.slice(s, m.index + m[0].length + 40).trim()}…`);
      }
    }
  });
}
if (hits) { console.log(`\n${hits} problem(s). Rewrite them in your own words, or name the concept instead of the source.`); process.exit(1); }
console.log(`Copy check passed: ${files.length} files, ${patterns.length} rules.`);
