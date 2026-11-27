#!/usr/bin/env node
/* Logic brief for the efficiency engineer agent's daily logic check (no AI, free).
   A code review asks "does this file do what it says?". The logic check asks "do the parts of the site agree with each
   other, and do the rules still fit what really happens?": a next step that contradicts the text beside it, a score kept
   under the wrong name, a pass line almost nothing passes, a loop that can never end, a page that describes behaviour the
   code no longer has. One flow per day, in rotation, so each is looked at about once a week.
   Usage: node scripts/logic-brief.mjs [--flow path|coach|signals|claims] [--out DIR] [--offline] | list
   Writes DIR/logic-brief.md (the question, the files to read in full and the facts gathered here) and prints flow=<id>.
   The facts come from the repository and, for `signals`, from the data-only agent-status branch (read without a token;
   --offline or a failed read leaves that part out). To add a flow, add an entry to FLOWS. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const arg = (k, d) => (process.argv.includes('--' + k) ? process.argv[process.argv.indexOf('--' + k) + 1] : d);
const OFFLINE = process.argv.includes('--offline');
const REPO = process.env.GITHUB_REPOSITORY || 'zhengtongxin/tx-learns';
const win = f => { const c = { window: {} }; vm.runInNewContext(readFileSync(join(ROOT, f), 'utf8'), c, { filename: f }); return c.window; };
const raw = async f => { if (OFFLINE) return null; try { const r = await fetch(`https://raw.githubusercontent.com/${REPO}/agent-status/${f}`, { signal: AbortSignal.timeout(15000) }); return r.ok ? await r.json() : null; } catch { return null; } };
const grab = (f, re) => [...readFileSync(join(ROOT, f), 'utf8').matchAll(re)].map(m => m[0].trim().slice(0, 220));

export const FLOWS = {
  path: {
    title: 'The learning path',
    ask: 'Follow a learner from the landing page to the last lesson of a track and on to the next one. Do the order, the levels, the "before" and "after" lines, the buttons and the progress rules tell one story? Look for: a next step that contradicts the text beside it, a track that asks for something nothing earlier teaches and does not say so, a dead end, a lesson that can count as done or not done wrongly, a count or label two places compute differently.',
    files: ['tracks.js', 'assets/site.js', 'tracks.html', 'index.html', 'scripts/check-counts.mjs', 'scripts/test-site.mjs'],
    async facts() {
      const { TRACKS, DOMAINS } = win('tracks.js'), out = [], warn = [];
      for (const t of TRACKS) {
        const T = win(`${t.id}/lessons.js`).TRACK, items = T.topics.flatMap(w => w.items);
        out.push(`- ${t.id} (domain ${t.domain}, starts at level ${t.level}${t.entry ? ', entry point "' + t.entry.en + '"' : ''}): topics at levels ${T.topics.map(w => w.level).join(',')}; ${items.filter(x => x.file).length} of ${items.length} lessons published; next: ${(t.next || []).join(', ') || 'none'}${t.go ? '; go: ' + t.go.href : ''}\n  before: ${t.before.en}\n  after: ${t.after.en}`);
        // Deterministic hints: the "after" line names a track the buttons do not offer (or the other way round), and gaps in the published order.
        for (const o of TRACKS) if (o !== t && o.domain === t.domain) { const said = t.after.en.includes(o.title.en), linked = (t.next || []).includes(o.id); if (said !== linked) warn.push(`${t.id}: its "after" line ${said ? 'names' : 'does not name'} ${o.title.en}, but next ${linked ? 'offers' : 'does not offer'} it`); }
        const firstGap = items.findIndex(x => !x.file); if (firstGap > -1 && items.slice(firstGap).some(x => x.file)) warn.push(`${t.id}: a "coming soon" lesson sits before a published one ("${items[firstGap].title.en}")`);
        if (T.topics[0].level > t.level) warn.push(`${t.id}: starts at level ${t.level} but its first topic is level ${T.topics[0].level}`);
      }
      for (const d of DOMAINS) if (!TRACKS.some(t => t.domain === d.id)) out.push(`- domain ${d.id} has no track yet`);
      return `Tracks, in tracks.js order:\n${out.join('\n')}\n\nThings a script noticed (each may be fine; check before changing anything):\n${warn.map(w => '- ' + w).join('\n') || '- nothing'}`;
    },
  },
  coach: {
    title: 'The study coach',
    ask: 'Follow one answer from the passage it was written from to the strength map, the plan and the wrong-question book. Is every number kept under the thing it measures, and can every path be undone exactly? Look for: a result scored under the wrong area or passage, a counter two actions change differently, a threshold used with two values, a case the plan can never reach or never leave, text on study/how.html or study/about.html that promises what coach/coach.js does not do.',
    files: ['coach/logic.js', 'coach/coach.js', 'coach/exams.js', 'study/how.html', 'study/about.html', 'scripts/test-coach.mjs'],
    async facts() {
      return `Numbers the coach decides with (the same idea should not appear with two values):\n${[...grab('coach/logic.js', /[^;{}\n]*(0\.\d+|GAPS=\[[^\]]*\]|>=?\s*\d+|<\s*\d+)[^;{}\n]*/g).slice(0, 40), ...grab('coach/coach.js', /[^;{}\n]*(s<0\.\d+|\.length>\d+|perDay|MAXV)[^;{}\n]*/g).slice(0, 20)].map(l => '- ' + l).join('\n')}`;
    },
  },
  signals: {
    title: 'The agents\' rules against what really happens',
    ask: 'The agents decide by fixed numbers: a pass line, waiting days, caps, how often they run. Compare those numbers with the data below. Look for: a line almost everything or almost nothing passes, a queue that grows faster than it is worked off, an item that can be picked for ever or never, two scripts that read the same file with different rules, a signal nobody reads, work that repeats without new input. You may change the scripts under scripts/ that hold such a rule (not the protected ones, not .github/). A finding that needs a workflow or CLAUDE.md change goes in your summary under "Needs TX", not into a file.',
    files: ['scripts/signals.mjs', 'scripts/scout.mjs', 'scripts/news.mjs', 'scripts/daily-scan.mjs', 'scripts/reader-brief.mjs', 'scripts/max-turns.mjs', 'api/status.js'],
    async facts() {
      const out = [`Rule numbers in the scripts:\n${['scripts/signals.mjs', 'scripts/scout.mjs', 'scripts/news.mjs'].flatMap(f => grab(f, /^const [A-Z_]+ = \d[^;]*;/gm).map(l => `- ${f}: ${l}`)).join('\n')}`];
      const reader = await raw('signals/reader.json'), imp = await raw('signals/improver.json'), ideas = await raw('signals/ideas.json'), daily = await raw('signals/daily.json'), runs = await raw('trace/runs.json');
      if (reader?.lessons) { const h = {}; for (const v of Object.values(reader.lessons)) h[v.score] = (h[v.score] || 0) + 1; out.push(`Intern scores on record (score: lessons): ${Object.keys(h).sort((a, b) => a - b).map(k => `${k}: ${h[k]}`).join(', ')}`); }
      if (imp?.attempts) { const now = Date.now(), a = Object.entries(imp.attempts); out.push(`Improvement agent: ${a.length} items tried, ${a.filter(([, t]) => now - Date.parse(t) < 7 * 864e5).length} in the last 7 days; kinds: ${[...new Set(a.map(([k]) => k.split(':')[0]))].join(', ') || 'none'}`); }
      if (ideas) out.push(`Ideas waiting: ${(ideas.ideas || []).length}; done: ${(ideas.done || []).length}`);
      if (daily) out.push(`Daily scan: readers: ${daily.readers?.summary || 'n/a'} Rework: ${daily.rework?.summary || 'n/a'} ${(daily.rework?.problems || []).slice(0, 5).join('; ')}`);
      const calls = Array.isArray(runs) ? runs : runs && Object.values(runs).find(Array.isArray);
      if (calls) { const by = {}, since = Date.now() - 7 * 864e5; for (const c of calls) if (Date.parse(c.at) > since) { const k = `${c.agent}/${c.step || '-'}/${c.model}`, b = by[k] || (by[k] = { n: 0, usd: 0 }); b.n++; b.usd += c.usd || 0; } out.push(`Agent calls in the last 7 days (estimated at API prices; nothing is billed per call):\n${Object.entries(by).sort((a, b) => b[1].usd - a[1].usd).slice(0, 12).map(([k, b]) => `- ${k}: ${b.n} calls, $${b.usd.toFixed(2)}`).join('\n')}`); }
      if (out.length === 1) out.push('The agents\' data could not be read this run: judge the rules against each other only.');
      return out.join('\n\n');
    },
  },
  claims: {
    title: 'What the site says about itself',
    ask: 'These pages tell readers what the site does: what it records, how a lesson counts as done, how the coach scores and plans, what stays on the device. Check each such sentence against the code that does it. Look for a sentence the code no longer keeps (fix the sentence in both languages, or the code when the sentence is the promise), and for two pages that say different things about the same behaviour. ecosystem.html is frozen: do not edit it; a wrong sentence there goes in your summary under "Needs TX".',
    files: ['about.html', 'study/about.html', 'study/how.html', 'assets/site.js', 'api/feedback.js', 'coach/coach.js'],
    async facts() {
      return `Storage keys and requests the site script uses (what "the site records" must match):\n${[...new Set([...grab('assets/site.js', /'learn-[a-z]+'/g), ...grab('assets/site.js', /'\/api\/[a-z]+'/g), ...grab('coach/coach.js', /indexedDB\.open\([^)]*\)/g)])].map(l => '- ' + l).join('\n')}`;
    },
  },
};

export const flowFor = date => { const ids = Object.keys(FLOWS), day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 864e5); return ids[day % ids.length]; };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'list') { for (const [id, f] of Object.entries(FLOWS)) console.log(`${id}: ${f.title} (${f.files.join(', ')})`); process.exit(0); }
  const id = arg('flow', '') || flowFor(new Date()), flow = FLOWS[id];
  if (!flow) { console.error(`Unknown flow "${id}". Flows: ${Object.keys(FLOWS).join(', ')}`); process.exit(2); }
  const missing = flow.files.filter(f => !existsSync(join(ROOT, f)));
  if (missing.length) { console.error(`Flow "${id}" names files that do not exist: ${missing.join(', ')}`); process.exit(1); }
  const dir = arg('out', '/tmp'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'logic-brief.md'), `# Logic check: ${flow.title}\n\n${flow.ask}\n\nRead these files in full first:\n${flow.files.map(f => '- ' + f).join('\n')}\n\n## Facts gathered by a script\n\n${await flow.facts()}\n`);
  console.log(`flow=${id}`);
}
