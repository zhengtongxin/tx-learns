#!/usr/bin/env node
// Evaluation datasets for the agents. Golden cases with known right answers, so a change to a check or a prompt is
// measured instead of guessed.
//   node scripts/run-evals.mjs            the checks (copy, pages, security, counts): free, deterministic, ~10 seconds.
//                                         Each case edits a copy of a real file and says what the check must do. A check
//                                         that stops catching something, or starts failing clean files, fails here.
//   node scripts/run-evals.mjs --llm      also the backend engineer's judgement (evals/review-cases.json): one Haiku call
//                                         per case through `claude -p`. Needs Claude auth; costs a few cents; run it by hand.
// Cases live in evals/*.json. Writes a Markdown report to $GITHUB_STEP_SUMMARY when set. Exit 1 on any miss.
import { readFileSync, writeFileSync, appendFileSync, mkdtempSync, cpSync, existsSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LLM = process.argv.includes('--llm');
// Banned words and key shapes are only assembled here, so the dataset files stay clean for the copy and security checks.
const FILL = { '@@PAID1@@': 'cour' + 'se', '@@PAID2@@': '课' + '程', '@@PAID3@@': 'week ' + '3', '@@PAID4@@': 'instruc' + 'tor', '@@ANTHROPIC_KEY@@': 'sk-ant-' + 'api03-' + 'a'.repeat(32) };
const fill = s => Object.entries(FILL).reduce((a, [k, v]) => a.split(k).join(v), s);
const rows = [];
const report = (name, ok, note = '') => { rows.push({ name, ok, note }); console.log(`${ok ? '✓' : '✗'} ${name}${note ? `  (${note})` : ''}`); };

// ── 1. The checks, run in a throw-away copy of the repo (in the OS temp folder) ──
const ds = JSON.parse(readFileSync(join(ROOT, 'evals/checks.json'), 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'evals-'));
const git = (...a) => execFileSync('git', a, { cwd: tmp, stdio: 'pipe' });
for (const f of execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && existsSync(join(ROOT, f)))) cpSync(join(ROOT, f), join(tmp, f), { recursive: true });
git('init', '-q'); git('add', '-A'); git('-c', 'user.name=evals', '-c', 'user.email=evals@example.com', 'commit', '-q', '-m', 'base');
const SCRIPT = { copy: 'check-copy.mjs', pages: 'check-pages.mjs', security: 'check-security.mjs', counts: 'check-counts.mjs' };
for (const c of ds.cases) {
  const file = c.file || ds.base;
  const orig = readFileSync(join(tmp, file), 'utf8');
  let text = orig;
  if (c.regex) text = text.replace(new RegExp(c.regex[0]), c.regex[1]);
  if (c.append) text += '\n' + fill(c.append);
  writeFileSync(join(tmp, file), text);
  const args = ['scripts/' + SCRIPT[c.check], ...(['copy', 'pages'].includes(c.check) ? [file] : [])];
  const r = spawnSync('node', args, { cwd: tmp, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const passed = r.status === 0;
  let ok = (c.expect === 'pass') === passed, note = '';
  if (ok && c.match && !passed && !new RegExp(c.match).test(out)) { ok = false; note = `failed, but not for "${c.match}"`; }
  if (ok && c.mustNotPrint && out.includes(fill(c.mustNotPrint))) { ok = false; note = 'printed a secret in full'; }
  if (!ok && !note) note = c.expect === 'pass' ? 'a clean file was rejected: ' + out.trim().split('\n')[0].slice(0, 120) : 'the check let it through';
  report(c.name, ok, note);
  writeFileSync(join(tmp, file), orig);
}

// ── 1b. The scope guard's path rules (scripts/areas.json): which area a file is in, and what a branch may change ──
{
  const { classify, rules } = await import('./scope-guard.mjs');
  const sc = JSON.parse(readFileSync(join(ROOT, 'evals/scope-cases.json'), 'utf8'));
  for (const c of sc.cases) {
    const got = c.kind === 'area' ? classify(c.path, sc.tracks) : rules(c.branch, c.areas, sc.tracks).length ? 'block' : 'ok';
    report(`scope: ${c.name}`, got === c.expect, got === c.expect ? '' : `expected ${c.expect}, got ${got}`);
  }
}

// ── 1c. The review triage (scripts/review-triage.mjs): which diffs may skip the AI review ──
for (const c of JSON.parse(readFileSync(join(ROOT, 'evals/triage-cases.json'), 'utf8')).cases) {
  const f = join(tmp, '.triage-case.diff'); writeFileSync(f, c.diff);
  const r = spawnSync('node', [join(ROOT, 'scripts/review-triage.mjs'), f], { encoding: 'utf8' });
  report(c.name, r.status === c.exit, r.status === c.exit ? '' : `exit ${r.status}, wanted ${c.exit}`);
}

// ── 1d. The daily scan (scripts/daily-scan.mjs): the docs check, the rework count, the reader signal and the summary ──
{
  const { drift, reworkFrom, readerSignal, combine } = await import('./daily-scan.mjs');
  const clean = drift(tmp);
  report('daily: the docs of a clean repo match it', clean.ok, clean.ok ? '' : clean.problems[0]);
  writeFileSync(join(tmp, '.github/workflows/zz-undocumented.yml'), 'name: x\n');
  const d1 = drift(tmp); rmSync(join(tmp, '.github/workflows/zz-undocumented.yml'));
  report('daily: a workflow the docs do not mention is caught', d1.problems.some(p => p.includes('zz-undocumented.yml')));
  const md = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');
  writeFileSync(join(tmp, 'CLAUDE.md'), md + '\nSee `scripts/no-such-script.mjs` and `gone.yml`.\n');
  const d2 = drift(tmp); writeFileSync(join(tmp, 'CLAUDE.md'), md);
  report('daily: a script and a workflow the docs name but that do not exist are caught', d2.problems.some(p => p.includes('no-such-script.mjs')) && d2.problems.some(p => p.includes('gone.yml')));
  const api = readFileSync(join(tmp, 'api/status.js'), 'utf8');
  writeFileSync(join(tmp, 'api/status.js'), api.replace("'recall']", "'recall', 'ghost']"));
  const d3 = drift(tmp); writeFileSync(join(tmp, 'api/status.js'), api);
  report('daily: an agent id the How it works page has no card for is caught', d3.problems.some(p => p.includes('ghost')));
  const rw = reworkFrom('@one\n\n10\t2\ta.html\n1\t1\tb.html\n@two\n\n9\t0\ta.html\n1\t1\tb.html\n@three\n\n5\t5\ta.html\n1\t1\tb.html\n30\t3\tsitemap.xml\n');
  report('daily: a file changed by three merges is rework; hash-only and generated changes are not', rw.prs === 3 && rw.hot.length === 1 && rw.hot[0].file === 'a.html');
  const known = ['t/01-a.html', 't/02-b.html'];
  const rs = readerSignal({ 't/01-a.html': { yes: 1, no: 2, done: 9 }, 't/02-b.html': { yes: 5, no: 1, done: 3 }, 'x/99-not-a-lesson.html': { yes: 0, no: 50, done: 0 } }, known);
  report('daily: a lesson half of at least 3 readers marked unclear is picked; a clear one and an unknown path are not', rs.unclear.length === 1 && rs.unclear[0].file === 't/01-a.html' && rs.votes === 9 && rs.done === 12);
  const few = readerSignal({ 't/01-a.html': { yes: 0, no: 2, done: 0 } }, known);
  report('daily: two answers are too few to call a lesson unclear', few.unclear.length === 0);
  const junk = readerSignal({ 't/01-a.html': { yes: 'many', no: -4, done: 1.5 } }, known);
  report('daily: counts that are not plain positive whole numbers are ignored', junk.votes === 0 && junk.done === 0);
  report('daily: rework alone never flags the run, a broken package does, no results is a failure',
    combine({ rework: { ok: false, summary: '' }, drift: { ok: true, summary: '' } }).state === 'ok' && combine({ smoke: { ok: false, summary: '' } }).state === 'flag' && combine({}).state === 'fail');
}

// ── 2. The reviewer's judgement (optional, uses Claude) ──
if (LLM) {
  const rv = JSON.parse(readFileSync(join(ROOT, 'evals/review-cases.json'), 'utf8'));
  let cost = 0;
  for (const c of rv.cases) {
    const prompt = `You are the backend engineer reviewing one excerpt of a bilingual (EN/中文) AI lesson. Check: would the code run as shown once earlier steps are in place (no use before it is built, await only in async code), do EN and 中文 say the same thing (same numbers), and does it avoid naming a paid course, week numbering or an instructor? Answer with exactly one word: OK if it passes, FIX if there is a real error.\n\n${fill(c.excerpt)}`;
    const env = { ...process.env };
    if (env.CLAUDE_CODE_OAUTH_TOKEN) delete env.ANTHROPIC_API_KEY; // the subscription wins over an API key
    const r = spawnSync('claude', ['--model', 'haiku', '--exclude-dynamic-system-prompt-sections', '-p', prompt, '--max-turns', '1', '--output-format', 'json'], { encoding: 'utf8', env });
    let said = '', usd = 0;
    try { const j = JSON.parse(r.stdout); said = String(j.result || '').trim(); usd = j.total_cost_usd || 0; } catch { said = 'no answer'; }
    cost += usd;
    const got = /\bFIX\b/i.test(said) ? 'fix' : /\bOK\b/i.test(said) ? 'ok' : '?';
    report(`reviewer: ${c.name}`, got === c.expect, got === c.expect ? '' : `expected ${c.expect}, said ${got}`);
  }
  console.log(`Reviewer eval cost: $${cost.toFixed(4)}`);
}

const good = rows.filter(r => r.ok).length;
console.log(`\n${good}/${rows.length} eval cases right.`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Evals: ${good}/${rows.length} right\n\n${rows.map(r => `- ${r.ok ? '✅' : '❌'} ${r.name}${r.note ? ` — ${r.note}` : ''}`).join('\n')}\n`);
process.exit(good === rows.length ? 0 : 1);
