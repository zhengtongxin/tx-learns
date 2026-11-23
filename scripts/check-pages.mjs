#!/usr/bin/env node
// Page check: every page a reader can open has what it needs to be found, shared and read in both languages.
// Fails (exit 1) on: no <html lang>, no title, no description or link-preview tags, an image without alt text,
// headings that skip a level, or English text without its 中文 twin (and the other way round).
// Usage: node scripts/check-pages.mjs [page.html ...]   (no args = every page)
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const all = ['index.html', 'ecosystem.html', ...readdirSync(new URL('agentic-ai/', root)).filter(f => f.endsWith('.html')).map(f => 'agentic-ai/' + f)];
const pages = process.argv.slice(2).length ? process.argv.slice(2) : all;
const problems = [];
const bad = (p, m) => problems.push(`${p}: ${m}`);
const count = (s, re) => (s.match(re) || []).length;

for (const p of pages) {
  let html;
  try { html = readFileSync(new URL(p, root), 'utf8'); } catch { bad(p, 'file not found'); continue; }
  const markup = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const scripts = (html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []).join('\n');

  if (!/<html[^>]*\blang="[a-z-]+"/i.test(html)) bad(p, '<html> has no lang');
  if (!/<title>\s*[^<\s][^<]*<\/title>/i.test(html)) bad(p, 'no <title>');
  for (const [tag, re] of [['meta description', /<meta name="description" content="[^"]{20,}"/],
    ['og:title', /<meta property="og:title" content="[^"]+"/], ['og:description', /<meta property="og:description" content="[^"]+"/],
    ['og:image', /<meta property="og:image" content="https:\/\/[^"]+"/]]) if (!re.test(html)) bad(p, `no ${tag}`);

  for (const img of markup.match(/<img\b[^>]*>/gi) || []) if (!/\balt="/i.test(img)) bad(p, `image without alt text: ${img.slice(0, 80)}`);

  // Headings in order: a page may go down one level at a time (h1 → h2 → h3), never skip one (h2 → h4).
  let last = 0;
  for (const m of markup.replace(/<svg\b[\s\S]*?<\/svg>/gi, '').matchAll(/<h([1-6])\b/gi)) {
    const n = +m[1];
    if (last && n > last + 1) bad(p, `heading jumps from h${last} to h${n}`);
    last = n;
  }

  // EN/中文 twins: markup marked class="en" needs as many class="zh", and so do {en:..., zh:...} strings in scripts.
  const en = count(markup, /class="en"/g), zh = count(markup, /class="zh"/g);
  if (en !== zh) bad(p, `${en} English blocks but ${zh} 中文 blocks; every .en needs a matching .zh`);
  const sen = count(scripts, /\ben\s*:/g), szh = count(scripts, /\bzh\s*:/g);
  if (sen !== szh) bad(p, `scripts have ${sen} English strings but ${szh} 中文 strings`);
}

if (problems.length) { console.log(`✗ Page check failed (${problems.length}):\n` + problems.map(x => '  - ' + x).join('\n')); process.exit(1); }
console.log(`✓ Page check passed: ${pages.length} pages have lang, title, description, link previews, alt text, heading order and EN/中文 twins.`);
