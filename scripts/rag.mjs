#!/usr/bin/env node
// "What do our lessons already say?" for the writer and reviewer agents (and for TX). Local and free: no model, no network.
// Usage: node scripts/rag.mjs "retrieval chunks" [--k 5] [--chars 400] [--json]
//        node scripts/rag.mjs --related <track/file.html>      lessons most like this one
// Prints the best lessons with a short passage around the best match, so an agent can link back, avoid repeating a
// lesson and keep terms and characters consistent. Passages are scrubbed of banned terms.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonDocs, makeSearcher, terms, expand, related } from './lib-search.mjs';
import { scrub, arg } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const k = +arg('k', 5), chars = +arg('chars', 400), json = process.argv.includes('--json');
const rel = arg('related', '');
const q = process.argv.slice(2).filter((a, i, v) => !a.startsWith('--') && !['--k', '--chars', '--related'].includes(v[i - 1])).join(' ').trim();
if (!q && !rel) { console.error('Usage: node scripts/rag.mjs "<question>" [--k 5] [--chars 400] [--json]\n       node scripts/rag.mjs --related <track/file.html>'); process.exit(2); }

const docs = lessonDocs(ROOT);
let hits;
if (rel) {
  const ids = related(docs, k)[rel];
  if (!ids) { console.error(`No such lesson: ${rel}`); process.exit(1); }
  hits = ids.map(id => ({ d: docs.find(d => d.id === id), s: 1 }));
} else hits = makeSearcher(docs).search(q, k);

// A passage: the window of the lesson text with the most query terms.
function passage(d) {
  const qx = new Set(expand(terms(q || d.title.en)));
  const words = d.text.split(' '), size = Math.max(20, Math.round(chars / 6));
  let best = 0, at = 0;
  for (let i = 0; i < words.length; i += 10) {
    const w = words.slice(i, i + size).join(' ');
    const score = terms(w).filter(x => qx.has(x)).length;
    if (score > best) { best = score; at = i; }
  }
  return scrub(words.slice(at, at + size).join(' ').slice(0, chars));
}
const out = hits.map(({ d, s }) => ({ lesson: d.id, title: d.title.en, topic: d.topic.en, score: +s.toFixed(2), passage: passage(d) }));
if (json) console.log(JSON.stringify(out, null, 1));
else if (!out.length) console.log('No lesson matches.');
else for (const o of out) console.log(`• ${o.lesson}  (${o.topic}: ${o.title})\n  ${o.passage}\n`);
