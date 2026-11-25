#!/usr/bin/env node
/* Deterministic triage before the AI review (no model, free). Exit 0 when a unified diff changes only generated files:
   sitemap.xml, vercel.json, assets/related.json, and the lines of a page that `check-pages.mjs --fix` writes (?v= hashes,
   the updated date, canonical link, JSON-LD, lesson-data). Then the reviewer comments "no AI review needed" instead of
   running Sonnet. Exit 1 when anything else changed (the review runs as usual), 2 on bad input.
   Usage: node scripts/review-triage.mjs <diff-file> */
import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file) { console.error('usage: review-triage.mjs <diff-file>'); process.exit(2); }
const GEN_FILES = new Set(['sitemap.xml', 'vercel.json', 'assets/related.json']);
const GEN_LINE = /\?v=[0-9a-f]{6,}|name="updated"|rel="canonical"|application\/ld\+json|id="lesson-data"|\bdateModified\b/;
let path = null, seen = 0;
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (line.startsWith('diff --git ')) { path = line.split(' b/')[1]; seen++; continue; }
  if (/^(index |--- |\+\+\+ |@@ |new file|deleted file|similarity|rename|old mode|new mode)/.test(line) || !/^[+-]/.test(line)) continue;
  if (GEN_FILES.has(path)) continue;
  if (path && path.endsWith('.html') && GEN_LINE.test(line)) continue;
  console.log(`not generated-only: ${path}`); process.exit(1);
}
console.log(seen ? 'generated files only' : 'empty diff'); process.exit(seen ? 0 : 1);
