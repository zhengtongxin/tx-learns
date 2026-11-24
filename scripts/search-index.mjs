#!/usr/bin/env node
// Builds assets/search-index.json for the learner search box and the "Related lessons" block (assets/search.js).
// Local and free: term counts and nearest neighbours computed here, no model, no network.
//   node scripts/search-index.mjs            write the index
//   node scripts/search-index.mjs --check    exit 1 and say what is missing if a published lesson is not in it
// A stale index only means a new lesson is missing from search for a while; it never breaks a page. The writer
// agent rebuilds it with every lesson, so it normally stays current.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonDocs, related, makeSearcher, SYN } from './lib-search.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'assets/search-index.json');
const docs = lessonDocs(ROOT);
const s = makeSearcher(docs);
const KEEP = 60; // strongest terms per lesson keep the file small (about 100 KB for the whole site)
const index = {
  syn: SYN,
  docs: docs.map(d => ({
    id: d.id, t: d.title, tp: d.topic,
    tf: Object.fromEntries(Object.entries(d.tf).sort((a, b) => b[1] * s.idf(b[0]) - a[1] * s.idf(a[0])).slice(0, KEEP)),
  })),
  related: related(docs, 3),
};
if (process.argv.includes('--check')) {
  let have = [];
  try { have = JSON.parse(readFileSync(OUT, 'utf8')).docs.map(d => d.id); } catch {}
  const missing = docs.map(d => d.id).filter(id => !have.includes(id));
  if (missing.length) { console.log(`✗ assets/search-index.json is missing ${missing.length} lesson(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}. Run node scripts/search-index.mjs`); process.exit(1); }
  console.log(`✓ search index lists all ${docs.length} lessons`); process.exit(0);
}
writeFileSync(OUT, JSON.stringify(index) + '\n');
console.log(`Wrote assets/search-index.json: ${index.docs.length} lessons, ${(JSON.stringify(index).length / 1024).toFixed(0)} KB`);
