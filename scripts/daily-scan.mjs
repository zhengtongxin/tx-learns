#!/usr/bin/env node
// Daily scan (QA engineer agent, light pass): five small checks that no pull request triggers. No AI, a few minutes.
//   node scripts/daily-scan.mjs smoke   [--pkg packages/<track>/<name>] [--out DIR]   one project package a day: its Python files parse,
//                                        its requirements still install together, and every name it imports from them still exists
//   node scripts/daily-scan.mjs drift   [--out DIR]   the docs still match the repo: workflows, scripts, tracks and agent ids named in
//                                        CLAUDE.md and README.md exist, and nothing real is left out
//   node scripts/daily-scan.mjs speed   [--pages a.html,b.html] [--out DIR]   speed budget on a phone with a slowed-down processor
//                                        (home page plus two rotating pages): bytes, requests, largest paint, layout shift
//   node scripts/daily-scan.mjs rework  [--hours 48] [--out DIR]   files that several pull requests changed in the last two days
//   node scripts/daily-scan.mjs readers [--out DIR]   what real readers did (Vercel Web Analytics): lessons marked "not quite clear",
//                                        lessons opened but rarely finished, addresses that do not exist. Skipped without VERCEL_TOKEN
//   node scripts/daily-scan.mjs report  [--out DIR]   one summary of the files above; with GITHUB_TOKEN it stores it in
//                                        signals/daily.json on `agent-status` (the digest reads it) and adds reader ideas to the backlog
// Each check writes DIR/<name>.json: { ok, summary, problems: [...] }. A check that cannot run says so and is never a failure.
// Exit code: 0 always for a check that ran (findings are data, not a broken run), 2 when the script itself broke.
// Env: PLAYWRIGHT_DIR (speed), VERCEL_TOKEN + VERCEL_PROJECT_ID + VERCEL_TEAM_ID (readers), GITHUB_TOKEN + GITHUB_REPOSITORY (report).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, appendFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ROOT, arg, allPages, lessons, serve } from './lib-quality.mjs';

const OUT = resolve(arg('out', 'daily-out'));
const DAY = Math.floor(Date.now() / 864e5);
const save = (name, data) => { mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, name + '.json'), JSON.stringify(data, null, 1)); console.log(`${data.ok ? '✓' : data.skipped ? '·' : '✗'} ${name}: ${data.summary}`); for (const p of data.problems || []) console.log('  - ' + p); return data; };
const read = f => readFileSync(join(ROOT, f), 'utf8');
const ghOut = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${String(v).replace(/\n/g, ' ')}\n`);

// ---------------------------------------------------------------- smoke: one project package a day
// Libraries too large to install on every run: for a package that needs one, pip only works out the versions (--dry-run).
const HEAVY = /^(torch|transformers|sentence-transformers|bitsandbytes|accelerate|peft|trl|datasets|chromadb|xgboost|unsloth|vllm)\b/i;
export const packageDirs = () => { const dir = join(ROOT, 'packages'); if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(t => { try { return readdirSync(join(dir, t), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => `packages/${t}/${e.name}`); } catch { return []; } }).sort(); };
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') || e.name === 'node_modules' || e.name === '__pycache__' ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
// Checks the Python files of one package without running them: syntax, then every `import x` / `from x import y` against
// what is installed (only when the requirements were really installed). Answers with a JSON list of problems.
const PY_CHECK = `
import ast, sys, json, os, importlib, importlib.util
root, installed = sys.argv[1], sys.argv[2] == '1'
files = [l.strip() for l in sys.stdin if l.strip()]
problems, std = [], set(sys.stdlib_module_names)
def local(folder, top):
    d = folder
    while True:
        if os.path.exists(os.path.join(d, top + '.py')) or os.path.isdir(os.path.join(d, top)): return True
        if os.path.abspath(d) == os.path.abspath(root): return False
        d = os.path.dirname(d)
for f in files:
    rel = os.path.relpath(f, root)
    try: tree = ast.parse(open(f, encoding='utf8').read(), f)
    except SyntaxError as e:
        problems.append(f"{rel}: does not parse (line {e.lineno}: {e.msg})"); continue
    if not installed: continue
    for n in ast.walk(tree):
        mods = [(a.name, None) for a in n.names] if isinstance(n, ast.Import) else [(n.module, [a.name for a in n.names])] if isinstance(n, ast.ImportFrom) and n.module and n.level == 0 else []
        for mod, names in mods:
            top = mod.split('.')[0]
            if top in std or local(os.path.dirname(f), top): continue
            try:
                if importlib.util.find_spec(top) is None: problems.append(f"{rel}: imports {top}, which the requirements do not install"); continue
                m = importlib.import_module(mod)
            except Exception as e:
                problems.append(f"{rel}: import {mod} fails ({type(e).__name__}: {str(e)[:120]})"); continue
            for name in names or []:
                if name == '*' or hasattr(m, name): continue
                try:
                    if importlib.util.find_spec(mod + '.' + name) is not None: continue
                except Exception: pass
                problems.append(f"{rel}: {mod} no longer has {name}")
print(json.dumps(sorted(set(problems))))
`;
function smoke() {
  const all = packageDirs();
  if (!all.length) return save('smoke', { ok: true, skipped: true, summary: 'No project packages.', problems: [] });
  const pkg = (arg('pkg', '') || all[DAY % all.length]).replace(/\/$/, ''), dir = join(ROOT, pkg);
  if (!all.includes(pkg)) return save('smoke', { ok: true, skipped: true, summary: `Skipped: ${pkg.slice(0, 80)} is not a project package.`, problems: [] });
  const files = walk(dir), py = files.filter(f => f.endsWith('.py'));
  const reqs = files.filter(f => /(^|\/)requirements\.txt$/.test(f));
  const problems = [], notes = [];
  let installed = false, how = 'no Python requirements';
  const venv = join(tmpdir(), 'smoke-venv'), vpy = join(venv, 'bin', 'python');
  if (py.length) {
    rmSync(venv, { recursive: true, force: true });
    const mk = spawnSync('python3', ['-m', 'venv', venv], { encoding: 'utf8' });
    if (mk.status !== 0) notes.push('could not create a Python environment, so only the syntax was checked');
    else if (reqs.length) {
      const heavy = reqs.some(r => readFileSync(r, 'utf8').split('\n').some(l => HEAVY.test(l.trim())));
      const args = ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', ...(heavy ? ['--dry-run'] : []), ...reqs.flatMap(r => ['-r', r])];
      const r = spawnSync(vpy, args, { encoding: 'utf8', timeout: 12 * 60e3 });
      if (r.error && r.error.code === 'ETIMEDOUT') notes.push('pip did not finish in 12 minutes, so only the syntax was checked');
      else if (r.status !== 0) problems.push(`${reqs.map(f => relative(ROOT, f)).join(' + ')}: the requirements no longer install together (${(r.stderr || '').trim().split('\n').filter(l => /ERROR|conflict|No matching/i.test(l)).slice(0, 2).join(' ').slice(0, 300) || 'pip failed'})`);
      else { installed = !heavy; how = heavy ? 'versions resolve (large libraries, not installed)' : 'requirements installed'; }
    }
    const chk = spawnSync(existsSync(vpy) ? vpy : 'python3', ['-c', PY_CHECK, dir, installed ? '1' : '0'], { input: py.join('\n'), encoding: 'utf8', timeout: 5 * 60e3 });
    try { problems.push(...JSON.parse(chk.stdout.trim().split('\n').pop()).map(p => `${pkg}/${p}`)); }
    catch { notes.push('the Python check did not answer: ' + (chk.stderr || '').trim().split('\n').pop().slice(0, 200)); }
  }
  // JavaScript and JSON files of the package: syntax only.
  for (const f of files.filter(f => /\.(m?js)$/.test(f))) { const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); if (r.status !== 0) problems.push(`${relative(ROOT, f)}: does not parse (${(r.stderr || '').trim().split('\n').find(l => /Error/.test(l)) || 'syntax error'})`); }
  for (const f of files.filter(f => f.endsWith('.json'))) { try { JSON.parse(readFileSync(f, 'utf8')); } catch (e) { problems.push(`${relative(ROOT, f)}: not valid JSON (${e.message.slice(0, 80)})`); } }
  return save('smoke', { ok: !problems.length, pkg, how, files: files.length, notes,
    summary: problems.length ? `${pkg}: ${problems.length} problem(s) in the project code.` : `${pkg} is fine (${py.length} Python file(s), ${how}${notes.length ? '; ' + notes.join('; ') : ''}).`, problems });
}

// ---------------------------------------------------------------- drift: do the docs still match the repo?
export function drift(root = ROOT) {
  const rd = f => { try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; } };
  const claude = rd('CLAUDE.md'), readme = rd('README.md'), docs = claude + '\n' + readme, problems = [];
  const ls = d => { try { return readdirSync(join(root, d)); } catch { return []; } };
  const flows = ls('.github/workflows').filter(f => f.endsWith('.yml')), scripts = ls('scripts').filter(f => /\.(mjs|json)$/.test(f));
  for (const f of flows) if (!claude.includes('`' + f + '`')) problems.push(`CLAUDE.md does not mention the workflow ${f}`);
  for (const m of new Set(docs.match(/`[\w-]+\.yml`/g) || [])) if (!flows.includes(m.slice(1, -1))) problems.push(`the docs name ${m}, which is not in .github/workflows/`);
  for (const f of scripts.filter(f => f.endsWith('.mjs'))) if (!docs.includes(f)) problems.push(`the docs do not mention scripts/${f}`);
  for (const m of new Set(docs.match(/scripts\/[\w./-]+\.(?:mjs|json|md)/g) || [])) if (!existsSync(join(root, m))) problems.push(`the docs name ${m}, which does not exist`);
  let ids = []; try { const w = {}; new Function('window', rd('tracks.js'))(w); ids = (w.TRACKS || []).map(t => t.id); } catch { problems.push('tracks.js cannot be read'); }
  for (const id of ids) if (!claude.includes('`' + id + '/`')) problems.push(`CLAUDE.md does not list the track folder ${id}/`);
  // Agent ids: the status API, the How it works page and the digest must know the same agents, and every id a workflow records must be known.
  const list = (text, re) => { const m = text.match(re); return m ? [...m[1].matchAll(/'([\w-]+)'/g)].map(x => x[1]) : []; };
  const api = list(rd('api/status.js'), /const AGENTS = \[([^\]]*)\]/), page = [...rd('ecosystem.html').matchAll(/\{id:'([\w-]+)',hue:/g)].map(m => m[1]);
  const digest = [...(rd('scripts/digest.mjs').match(/const AG = \{[\s\S]*?\};/) || [''])[0].matchAll(/(?:'([\w-]+)'|\b([a-z][\w]*)): '/g)].map(m => m[1] || m[2]);
  const recorded = new Set(flows.flatMap(f => [...rd('.github/workflows/' + f).matchAll(/record-status\.mjs ([\w-]+)/g)].map(m => m[1])));
  for (const id of api) { if (page.length && !page.includes(id)) problems.push(`api/status.js knows the agent ${id}, but ecosystem.html has no card for it`); if (digest.length && !digest.includes(id)) problems.push(`api/status.js knows the agent ${id}, but the digest has no name for it`); }
  for (const id of page) if (api.length && !api.includes(id)) problems.push(`ecosystem.html has a card for ${id}, but api/status.js does not pass it on`);
  for (const id of recorded) if (api.length && !api.includes(id)) problems.push(`a workflow records the agent ${id}, but api/status.js does not know it`);
  for (const f of ['scripts/rules/writer.md', 'scripts/rules/reviewer.md']) if (!existsSync(join(root, f))) problems.push(`${f} is missing (the agents' rule packet)`);
  return { ok: !problems.length, summary: problems.length ? `The docs and the repo disagree in ${problems.length} place(s).` : `The docs match the repo (${flows.length} workflows, ${scripts.length} scripts, ${ids.length} tracks, ${api.length} agents).`, problems };
}

// ---------------------------------------------------------------- speed: a budget, measured the same way every day
export const BUDGET = { bytes: 400 * 1024, requests: 25, lcp: 2000, cls: 0.1 };
async function speed() {
  let chromium;
  try { ({ chromium } = createRequire(process.env.PLAYWRIGHT_DIR ? join(resolve(process.env.PLAYWRIGHT_DIR), 'node_modules/') : import.meta.url)('playwright')); }
  catch { return save('speed', { ok: true, skipped: true, summary: 'Skipped: no headless browser (PLAYWRIGHT_DIR).', problems: [] }); }
  const pool = allPages().filter(p => p !== 'index.html' && p !== '404.html');
  const pages = (arg('pages', '') ? arg('pages', '').split(',') : ['index.html', pool[DAY % pool.length], pool[(DAY * 7 + 3) % pool.length]]).filter((p, i, a) => p && a.indexOf(p) === i);
  const { srv, base } = await serve(), browser = await chromium.launch(), problems = [], rows = [];
  try {
    for (const p of pages) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let bytes = 0, requests = 0;
      page.on('response', async r => { requests++; try { bytes += (await r.body()).length; } catch {} });
      await page.addInitScript(() => { window.__lcp = 0; window.__cls = 0;
        try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
        try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {} });
      await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
      const m = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3) }));
      await ctx.close();
      const row = { page: p, bytes, requests, ...m }; rows.push(row);
      const over = [bytes > BUDGET.bytes && `${Math.round(bytes / 1024)} KB (budget ${BUDGET.bytes / 1024} KB)`, requests > BUDGET.requests && `${requests} requests (budget ${BUDGET.requests})`,
        m.lcp > BUDGET.lcp && `largest paint at ${m.lcp} ms (budget ${BUDGET.lcp} ms)`, m.cls > BUDGET.cls && `layout shift ${m.cls} (budget ${BUDGET.cls})`].filter(Boolean);
      if (over.length) problems.push(`${p}: ${over.join(', ')}`);
    }
  } finally { await browser.close(); srv.close(); }
  const worst = rows.slice().sort((a, b) => b.lcp - a.lcp)[0];
  return save('speed', { ok: !problems.length, rows, summary: problems.length ? `${problems.length} of ${rows.length} page(s) are over the speed budget.` : `${rows.length} pages are within the speed budget (slowest largest paint ${worst.lcp} ms, ${worst.page}).`, problems });
}

// ---------------------------------------------------------------- rework: the same file changed again and again
const GENERATED = /^(sitemap\.xml|vercel\.json)$/;
// `log` is the text of: git log --first-parent -m --since=<hours> --numstat --format=@%s
export function reworkFrom(log, min = 3) {
  const by = {}; let prs = 0;
  for (const block of String(log).split(/^@/m).slice(1)) {
    const [title, ...lines] = block.split('\n'); prs++;
    for (const l of lines) { const m = l.match(/^(\d+)\t(\d+)\t(.+)$/); if (!m || GENERATED.test(m[3]) || +m[1] + +m[2] <= 4) continue; (by[m[3]] ||= []).push(title.trim().slice(0, 70)); } // 4 lines or fewer is a ?v= hash or a date, not a change
  }
  const hot = Object.entries(by).filter(([, t]) => t.length >= min).sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(([file, t]) => ({ file, changes: t.length }));
  return { prs, hot };
}
function rework() {
  const hours = +arg('hours', 48);
  let log; try { log = execFileSync('git', ['log', '--first-parent', '-m', `--since=${hours} hours ago`, '--numstat', '--format=@%s'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6 }); }
  catch { return save('rework', { ok: true, skipped: true, summary: 'Skipped: no git history here.', problems: [] }); }
  const { prs, hot } = reworkFrom(log);
  const problems = hot.map(h => `${h.file}: changed by ${h.changes} merges in ${hours} hours`);
  return save('rework', { ok: !hot.length, prs, hot, summary: hot.length ? `${hot.length} file(s) were reworked 3 or more times in ${hours} hours (${prs} merges).` : `No file was reworked 3 or more times in ${hours} hours (${prs} merges).`, problems });
}

// ---------------------------------------------------------------- readers: what real readers did
const VOTES_MIN = 3, UNCLEAR_SHARE = 0.5, VIEWS_MIN = 10;
// rows from the analytics API: one object per group, the group's value under the dimension's name, plus a count.
const rowsOf = (json, keys) => (json && Array.isArray(json.data) ? json.data : []).map(r => ({ key: String(keys.map(k => r[k]).find(v => v != null && v !== '') ?? ''), n: +(r.count ?? r.total ?? r.pageviews ?? r.visitors ?? 0) })).filter(r => r.key);
export function readerSignal({ views = [], yes = [], no = [], done = [] }, known = lessons().map(l => l.path), pages = allPages()) {
  const lesson = k => k.replace(/^\/+/, ''), tally = rows => Object.fromEntries(rows.map(r => [lesson(r.key), r.n]));
  const Y = tally(yes), N = tally(no), D = tally(done), V = tally(views.map(r => ({ ...r, key: r.key === '/' ? 'index.html' : r.key })));
  const unclear = known.map(f => ({ file: f, no: N[f] || 0, votes: (N[f] || 0) + (Y[f] || 0) })).filter(x => x.votes >= VOTES_MIN && x.no / x.votes >= UNCLEAR_SHARE).sort((a, b) => b.no - a.no).slice(0, 5);
  const unfinished = known.map(f => ({ file: f, views: V[f] || 0, done: D[f] || 0 })).filter(x => x.views >= VIEWS_MIN && x.done / x.views < 0.1).sort((a, b) => b.views - a.views).slice(0, 3);
  const missing = Object.entries(V).filter(([p]) => /\.html$/.test(p) && !pages.includes(p)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views }));
  const total = Object.values(V).reduce((a, b) => a + b, 0), votes = Object.values(Y).reduce((a, b) => a + b, 0) + Object.values(N).reduce((a, b) => a + b, 0);
  const top = known.map(f => ({ file: f, views: V[f] || 0 })).filter(x => x.views).sort((a, b) => b.views - a.views).slice(0, 3);
  return { total, votes, top, unclear, unfinished, missing };
}
async function readers() {
  const { VERCEL_TOKEN: token, VERCEL_PROJECT_ID: projectId, VERCEL_TEAM_ID: teamId } = process.env;
  if (!token || !projectId) return save('readers', { ok: true, skipped: true, summary: 'Skipped: reader data is not connected (VERCEL_TOKEN and VERCEL_PROJECT_ID).', problems: [] });
  const q = async (kind, by, days, filter) => {
    const u = new URL(`https://api.vercel.com/v1/query/web-analytics/${kind}/aggregate`);
    const p = { projectId, by, limit: 100, since: new Date(Date.now() - days * 864e5).toISOString(), until: new Date().toISOString(), ...(teamId ? { teamId } : {}), ...(filter ? { filter } : {}) };
    for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
    const r = await fetch(u, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`${kind} ${r.status} ${(await r.text()).slice(0, 120).replace(/\s+/g, ' ')}`);
    return r.json();
  };
  try {
    const views = rowsOf(await q('visits', 'requestPath', 7), ['requestPath']);
    const ev = async (name, extra) => rowsOf(await q('events', 'eventData/lesson', 14, `eventName eq '${name}'${extra || ''}`), ['eventData', 'eventData/lesson', 'lesson']).filter(r => /^[\w-]+\/\d\d-[\w-]+\.html$/.test(r.key));
    const s = readerSignal({ views, yes: await ev('Lesson feedback', " and eventData/answer eq 'yes'"), no: await ev('Lesson feedback', " and eventData/answer eq 'no'"), done: await ev('Lesson done') });
    const problems = [...s.unclear.map(x => `${x.file}: ${x.no} of ${x.votes} readers said "not quite clear"`), ...s.missing.map(x => `/${x.path}: ${x.views} view(s) of an address that does not exist`)];
    return save('readers', { ok: !problems.length, ...s, summary: `${s.total} page view(s) in 7 days, ${s.votes} answer(s) to "Was this lesson clear?" in 14 days${s.unclear.length ? `; ${s.unclear.length} lesson(s) marked unclear` : ''}${s.missing.length ? `; ${s.missing.length} missing address(es)` : ''}${s.unfinished.length ? `; opened often but rarely finished: ${s.unfinished.map(x => x.file).join(', ')}` : ''}.`, problems });
  } catch (e) {
    return save('readers', { ok: true, skipped: true, summary: `Skipped: the analytics API did not answer (${String(e.message).slice(0, 160)}).`, problems: [] });
  }
}

// ---------------------------------------------------------------- report
const CHECKS = ['readers', 'smoke', 'drift', 'speed', 'rework'];
export function combine(parts) {
  const ran = CHECKS.filter(k => parts[k]), bad = ran.filter(k => !parts[k].ok && !parts[k].skipped);
  // Rework is a trend to watch, never a reason to flag the run.
  const flag = bad.filter(k => k !== 'rework');
  return { state: !ran.length ? 'fail' : flag.length ? 'flag' : 'ok', summary: ran.length ? ran.map(k => parts[k].summary).join(' ') : 'The daily scan produced no results.', bad };
}
async function report() {
  const parts = {}; for (const k of CHECKS) { try { parts[k] = JSON.parse(readFileSync(join(OUT, k + '.json'), 'utf8')); } catch {} }
  const c = combine(parts);
  console.log(`${c.state}: ${c.summary}`); ghOut('state', c.state); ghOut('summary', c.summary.slice(0, 380));
  if (!process.env.GITHUB_TOKEN) return;
  const { update, short } = await import('./signals.mjs');
  const slim = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { ok: !!v.ok, skipped: !!v.skipped, summary: short(v.summary, 300), problems: (v.problems || []).slice(0, 6).map(p => short(p, 200)) }]));
  await update('signals/daily.json', () => ({ at: new Date().toISOString(), state: c.state, ...slim }));
  // Lessons real readers marked unclear go to the improvement engineer agent like any other idea (one small pull request, same checks).
  const unclear = ((parts.readers && parts.readers.unclear) || []).filter(u => u && /^[a-z0-9-]+\/\d\d-[a-z0-9-]+\.html$/.test(u.file) && Number.isInteger(u.no) && Number.isInteger(u.votes)); // only lesson paths and plain numbers leave the scan job's files
  if (unclear.length) await update('signals/ideas.json', d => {
    d.ideas ||= [];
    for (const u of unclear.slice(0, 2)) {
      const id = createHash('sha1').update(u.file + 'readers').digest('hex').slice(0, 10), title = 'Readers marked this lesson not quite clear';
      if (d.ideas.length >= 12 || d.ideas.some(i => i.id === id) || (d.done || []).some(x => x.file === u.file && x.title === title && Date.now() - Date.parse(x.at) < 30 * 864e5)) continue;
      d.ideas.push({ id, role: 'readers', file: u.file, title, why: `${u.no} of ${u.votes} readers who answered "Was this lesson clear?" in the last 14 days chose "Not quite".`, priority: 1, at: new Date().toISOString() });
    }
    return d;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  try {
    if (mode === 'smoke') smoke();
    else if (mode === 'drift') save('drift', drift());
    else if (mode === 'speed') await speed();
    else if (mode === 'rework') rework();
    else if (mode === 'readers') await readers();
    else if (mode === 'report') await report();
    else { console.error('Usage: node scripts/daily-scan.mjs smoke|drift|speed|rework|readers|report [--out DIR]'); process.exit(2); }
  } catch (e) { console.error(`daily-scan ${mode} broke: ${e.stack || e.message}`); process.exit(2); }
}
