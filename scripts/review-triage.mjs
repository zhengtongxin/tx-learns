#!/usr/bin/env node
/* Deterministic triage before the AI review (no model, free). Exit 0 when a unified diff changes only generated files:
   sitemap.xml, vercel.json, assets/related.json, and the lines of a page that `check-pages.mjs --fix` writes (?v= hashes,
   the updated date, canonical link, JSON-LD, lesson-data; a page line must be one of those tags). Then the reviewer comments "no AI review needed" instead of
   running Sonnet. Exit 1 when anything else changed (the review runs as usual), 2 on bad input.
   Usage: node scripts/review-triage.mjs <diff-file> */
import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file) { console.error('usage: review-triage.mjs <diff-file>'); process.exit(2); }
const GEN_FILES = new Set(['sitemap.xml', 'tracks-index.js', 'vercel.json', 'assets/related.json']);
// Whole-line patterns only: a line of <meta>/<link> tags that holds the updated date or the canonical link, or a whole JSON script block.
const TAGS = /^\s*(<(meta|link)\b[^>]*>\s*)+$/;
const PAGE_GEN = { test: l => (TAGS.test(l) && /<meta name="updated"|<link rel="canonical"/.test(l)) || /^\s*<script type="application\/(ld\+json|json)"( id="lesson-data")?>.*<\/script>\s*$/.test(l) };
const HASH = /\?v=[0-9a-f]{6,}/g;
let path = null, seen = 0, minus = [], plus = [];
// A line with a ?v= hash counts as generated when its hash-free text is also on the other side of the diff (same line, new hash).
const flush = () => { const m = minus.map(l => l.replace(HASH, '')).sort().join('\n'), p = plus.map(l => l.replace(HASH, '')).sort().join('\n'); minus = []; plus = []; return m === p; };
const no = why => { console.log(`not generated-only: ${path} (${why})`); process.exit(1); };
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (line.startsWith('diff --git ')) {
    if (!flush()) no('a changed line is not just a new hash');
    const m = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (!m || m[1] !== m[2]) { path = line; no('a rename or odd header'); }
    path = m[2]; seen++; continue;
  }
  // Anything that is not a plain text edit (binary, mode change, rename, new or deleted file) needs a real review.
  if (/^(Binary files |GIT binary patch|old mode |new mode |rename |copy |new file mode|deleted file mode|similarity index)/.test(line) && !GEN_FILES.has(path)) no('binary, mode, rename or file added/removed');
  if (/^(index |--- a\/|--- \/dev\/null|\+\+\+ b\/|\+\+\+ \/dev\/null|@@ )/.test(line) || !/^[+-]/.test(line)) continue;
  if (GEN_FILES.has(path)) continue;
  const html = path && path.endsWith('.html');
  if (html && /\?v=[0-9a-f]{6,}/.test(line) && !PAGE_GEN.test(line.slice(1))) { (line[0] === '-' ? minus : plus).push(line.slice(1)); continue; }
  if (html && PAGE_GEN.test(line.slice(1))) continue;
  no('a changed line is not generated');
}
if (!flush()) no('a changed line is not just a new hash');
console.log(seen ? 'generated files only' : 'empty diff'); process.exit(seen ? 0 : 1);
