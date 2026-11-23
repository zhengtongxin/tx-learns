#!/usr/bin/env node
// Code sample check (for the backend engineer agent). No AI, no network, nothing is run.
// It takes every code box (.codebox) in the given lessons and checks that the code would at least parse:
// Python with ast (top-level await allowed), JavaScript with node --check. Shell lines and program output
// are skipped. A code box may be a fragment that builds on an earlier step, so names it uses can be missing;
// only real syntax errors are listed. The result is a note for the reviewer, not a hard fail.
// Usage: node scripts/check-code.mjs <lesson.html>...   (no files = every lesson)
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
let files = process.argv.slice(2).filter(f => /\/\d\d-[\w-]+\.html$/.test(f));
if (!process.argv[2]) {
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
  for (const m of html.matchAll(/<div class="codebox[^"]*"[^>]*>([\s\S]*?)<\/div>/g)) {
    n++; boxes++;
    const code = decode(m[1]).replace(/\u00a0/g, ' ');
    const k = kind(code);
    let err = '';
    if (k === 'python') {
      const r = spawnSync('python3', ['-c', PY], { input: code, encoding: 'utf8' });
      if (r.error) { console.log('python3 is not installed: Python boxes were not checked.'); process.exit(0); }
      err = (r.stdout || '').trim();
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
