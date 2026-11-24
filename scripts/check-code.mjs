#!/usr/bin/env node
// Code sample check (for the backend engineer agent). No AI, no network, nothing is run.
// It takes every code box (.codebox) in the given lessons and checks that the code would at least parse:
// Left out on purpose: JSX/TypeScript files (data-file .tsx/.jsx/.ts), data-file "diagram"/"output", anything after a "# in <place>, replace ..." note, and `...` elisions (filled in before parsing).
// Python with ast (top-level await allowed), JavaScript with node --check. Shell lines and program output
// are skipped, as is any box whose data-lang is not python or js. A code box may be a fragment that builds on an earlier step, so names it uses can be missing;
// only real syntax errors are listed. The result is a note for the reviewer, not a hard fail.
// Usage: node scripts/check-code.mjs <lesson.html>...   (no files, or the word "lessons" = every lesson)
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
let files = process.argv.slice(2).filter(f => /\/\d\d-[\w-]+\.html$/.test(f));
if (!process.argv[2] || process.argv[2] === 'lessons') {
  try { files = execFileSync('git', ['ls-files', '*/[0-9][0-9]-*.html'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean); }
  catch { files = readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory()).flatMap(d => { try { return readdirSync(join(root, d.name)).filter(n => /^\d\d-.*\.html$/.test(n)).map(n => d.name + '/' + n); } catch { return []; } }); }
}
const ent = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = s => s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[a-zA-Z][^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ent[e] ?? m);
// Python with top-level await allowed; prints "line: message" on a syntax error.
const PY = 'import ast,sys\nsrc=sys.stdin.read()\ntry:\n compile(src,"box","exec",flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT|ast.PyCF_ONLY_AST)\nexcept SyntaxError as e:\n print(f"{e.lineno}: {e.msg}")';
const tmp = mkdtempSync(join(tmpdir(), 'code-'));
const kind = code => {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
  const first = lines[0] || '';
  if (!first) return 'text';
  if (/^(\$ |pip3? |uv |npm |npx |pnpm |brew |curl |wget |export |cd |ls |git |python3? |node |ollama |conda |crewai |docker |modal |huggingface-cli |mkdir |source )/.test(first)) return 'shell';
  if (/^(>>>|Output|Result)/.test(first)) return 'output';
  // Plain text, a sketch or output: no assignment, call, import, def or keyword anywhere.
  if (!lines.some(l => /^(import |from \w|def |class |async |await |for |if |with |return |print\(|@)|^[\w.\[\]"'\]]+\s*[+\-*/]?=[^=]|\w\(.*\)/.test(l))) return 'text';
  if (/\b(const|let|function)\s|=>|console\.|document\.|require\(|import .* from ['"]/.test(code) && !/^\s*(def |import \w+$|from \w+ import)/m.test(code)) return 'js';
  return 'python';
};
let boxes = 0, notes = [];
for (const f of files) {
  let html; try { html = readFileSync(join(root, f), 'utf8'); } catch { continue; }
  let n = 0;
  for (const m of html.matchAll(/<div class="codebox[^"]*"([^>]*)>([\s\S]*?)<\/div>/g)) {
    n++; boxes++;
    // A box that names its language as anything but python or js (bash, text, json, ...) is not syntax-checked.
    const lang = (m[1].match(/data-lang="([^"]*)"/) || [])[1];
    if (lang && !/^(python|py|js|javascript|mjs)$/i.test(lang)) continue;
    // Not plain Python or JavaScript: JSX/TypeScript files (node --check cannot read them), diagrams and program output.
    const file = (m[1].match(/data-file="([^"]*)"/) || [])[1] || '';
    if (/\.(tsx|jsx|ts)$/i.test(file) || /^(diagram|output|text|ascii)$/i.test(file)) continue;
    // A box that edits an earlier one says where ("# in run_dispatch, replace ...") and may then hold a different language or indented lines: only the part before that note is checked.
    let code = decode(m[2]).replace(/\u00a0/g, ' ').split(/^\s*(?:#|\/\/)\s*(?:in|inside|add|replace|change|right after|above|below)\b.*$/m)[0];
    const k = kind(code);
    let err = '';
    if (k === 'python') {
      const r = spawnSync('python3', ['-c', PY], { input: code, encoding: 'utf8' });
      if (r.error) { console.log('python3 is not installed: Python boxes were not checked.'); process.exit(0); }
      err = (r.stdout || '').trim();
      // `...` and `[...]` mean "the rest is left out": retry with the gap filled before calling it an error.
      if (err && /\.\.\./.test(code)) for (const filled of [code.replace(/(?<=[(,]\s*)\.\.\.(?=\s*[,)])/g, '**_gap').replace(/\.\.\./g, 'None'), code.replace(/\.\.\./g, 'None')]) {
        const r2 = spawnSync('python3', ['-c', PY], { input: filled, encoding: 'utf8' });
        if (!(r2.stdout || '').trim()) { err = ''; break; }
      }
    } else if (k === 'js') {
      const p = join(tmp, `box${boxes}.mjs`); writeFileSync(p, code);
      const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
      if (r.status) err = ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'syntax error').trim();
    }
    if (err) notes.push(`${f} code box ${n} (${k}): ${err}`);
  }
}
for (const x of notes) console.log(`✗ ${x}`);
console.log(notes.length ? `Code check: ${notes.length} of ${boxes} code boxes would not parse.` : `Code check passed: ${boxes} code boxes in ${files.length} lessons parse.`);
