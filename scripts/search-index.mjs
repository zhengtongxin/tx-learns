#!/usr/bin/env node
// Builds assets/related.json for the "Related lessons" card at the end of each lesson (assets/search.js).
// Local and free: term counts and nearest neighbours computed here, no model, no network. The card loads this small
// file only when the reader scrolls near the end of a lesson.
//   node scripts/search-index.mjs            write assets/related.json
//   node scripts/search-index.mjs --check    exit 1 and say what is missing if a published lesson is not in it
// A stale file only means a new lesson has no related card for a while; it never breaks a page. The writer agent
// rebuilds it with every lesson, so it normally stays current.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonDocs, related } from './lib-search.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'assets/related.json');
const docs = lessonDocs(ROOT), byId = Object.fromEntries(docs.map(d => [d.id, d]));
// lesson file -> [[file, title en, title zh, topic en, topic zh], ...] for its closest lessons
const rel = Object.fromEntries(Object.entries(related(docs, 3)).map(([id, ids]) => [id, ids.filter(x => byId[x]).map(x => [x, byId[x].title.en, byId[x].title.zh, byId[x].topic.en, byId[x].topic.zh])]));
if (process.argv.includes('--check')) {
  let have = [];
  try { have = Object.keys(JSON.parse(readFileSync(OUT, 'utf8'))); } catch {}
  const missing = docs.map(d => d.id).filter(id => !have.includes(id) && (related(docs, 3)[id] || []).length);
  if (missing.length) { console.log(`✗ assets/related.json is missing ${missing.length} lesson(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}. Run node scripts/search-index.mjs`); process.exit(1); }
  console.log(`✓ related lessons cover all ${docs.length} lessons`); process.exit(0);
}
writeFileSync(OUT, JSON.stringify(rel) + '\n');
console.log(`Wrote assets/related.json: ${Object.keys(rel).length} lessons, ${(JSON.stringify(rel).length / 1024).toFixed(0)} KB`);
