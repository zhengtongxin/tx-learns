#!/usr/bin/env node
// Learning coach agent: the weekly "what to review" message, so lessons do not fade.
//   Spaced recall: each lesson comes back 1, 3, 7, 14, 30, 60, 120, 240 and 365 days after it went live.
//                  A lesson is due this week when one of those days fell in the last 7 days.
//   Gap finder:    topics with planned lessons not written yet, and the next one to learn in each.
//   Model check:   once a month (first Sunday), the AI model names used in lessons, so Claude can flag outdated ones.
// Usage: node scripts/recall.mjs plan --out plan.json        (needs the repo with full git history)
//        node scripts/recall.mjs models --out models.json    (model names and the lessons that use them)
//        node scripts/recall.mjs message --plan plan.json [--questions questions.json] [--stale stale.json]
//   plan picks the lessons; Claude (in the workflow, read-only) writes questions for them;
//   message prints the Telegram text (HTML) to stdout.
// Env: SITE (live URL for links), NOW (ISO date, for testing).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTracks, modelsInLessons, arg, escHtml as e } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE || 'https://tx-learns.vercel.app/').replace(/\/?$/, '/');
const NOW = process.env.NOW ? new Date(process.env.NOW) : new Date();
const DAY = 864e5, STEPS = [1, 3, 7, 14, 30, 60, 120, 240, 365], MAX = 4;

function published(file) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%cI', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    return out.length ? new Date(out[out.length - 1]) : null;
  } catch { return null; }
}

function plan() {
  const TR = loadTracks(ROOT);
  const all = [];
  for (const t of TR) for (const w of t.T.topics) for (const it of w.items) if (it.file) {
    const at = published(t.dir + '/' + it.file);
    if (!at) continue;
    const age = (NOW - at) / DAY;
    const step = STEPS.findIndex(s => s <= age && s > age - 7);
    all.push({ file: t.dir + '/' + it.file, title: it.title, topic: w.title, age: Math.floor(age), step });
  }
  let due = all.filter(l => l.step >= 0).sort((a, b) => b.age - a.age);
  // Nothing due: bring back the lesson that has gone longest since its last review day.
  if (!due.length && all.length) {
    const since = l => l.age - Math.max(0, ...STEPS.filter(s => s <= l.age));
    due = [all.sort((a, b) => since(b) - since(a))[0]];
    due[0].extra = true;
  }
  const gaps = TR.flatMap(t => t.T.topics).map(w => ({ topic: w.title, live: w.items.filter(i => i.file).length, total: w.items.length, next: (w.items.find(i => !i.file) || {}).title }))
    .filter(g => g.next);
  return { at: NOW.toISOString(), due: due.slice(0, MAX), more: due.slice(MAX).map(l => l.title.en), gaps };
}

function ago(d) { return d < 1 ? 'today' : d < 2 ? 'yesterday' : d < 14 ? `${d} days ago` : d < 60 ? `${Math.round(d / 7)} weeks ago` : `${Math.round(d / 30)} months ago`; }

const models = () => modelsInLessons(ROOT);

function message(P, Q, S) {
  const qs = {};
  for (const l of (Q && Q.lessons) || []) if (l && l.file && Array.isArray(l.qs)) qs[l.file] = l.qs.slice(0, 2);
  const L = ['🧠 <b>Weekly review</b>', ''];
  if (P.due.length) {
    L.push(P.due[0].extra ? 'Nothing is due this week, so here is the one you have not seen for longest:' : 'Due this week. Try to answer before you open the lesson:', '');
    P.due.forEach((l, i) => {
      L.push(`${i + 1}. <b>${e(l.title.en)}</b> · ${e(l.title.zh)}`, `   ${e(l.topic.en)} · learned ${ago(l.age)}${l.step >= 0 ? ` · review ${l.step + 1}` : ''}`);
      for (const q of qs[l.file] || []) L.push(`   ❓ ${e(q.q)}`, `   <tg-spoiler>💡 ${e(q.a)}</tg-spoiler>`);
      L.push(`   ${SITE}${l.file}`, '');
    });
    if (P.more && P.more.length) L.push(`Also due, a quick skim is enough: ${e(P.more.join(' · '))}`, '');
  } else L.push('No lessons yet. Drop your first notes and this fills up.', '');
  if (P.gaps.length) {
    L.push('🕳️ <b>Gaps</b>');
    for (const g of P.gaps.slice(0, 4)) L.push(`• ${e(g.topic.en)}: ${g.live} of ${g.total} written. Next: ${e(g.next.en)}`);
    L.push('');
  }
  const stale = ((S && S.stale) || []).filter(x => x && x.model).slice(0, 8);
  if (stale.length) {
    L.push('🧪 <b>Model names to update</b> (monthly check)');
    for (const x of stale) L.push(`• <code>${e(x.model)}</code>${x.use ? ` → <code>${e(x.use)}</code>` : ''}: ${e(x.why || '')} (${e((x.files || []).map(f => f.replace(/^.*\//, '')).join(', '))})`);
    L.push('');
  } else if (S) L.push('🧪 Monthly model check: every model name in the lessons is still current.', '');
  L.push('Tap a 💡 to see the answer.');
  return L.join('\n');
}

const mode = process.argv[2];
if (mode === 'plan') {
  const P = plan();
  writeFileSync(arg('out', 'plan.json'), JSON.stringify(P, null, 1));
  console.log(`Due: ${P.due.map(l => l.file).join(', ') || 'none'}. Gaps: ${P.gaps.length} topics.`);
} else if (mode === 'models') {
  const M = models();
  writeFileSync(arg('out', 'models.json'), JSON.stringify(M, null, 1));
  console.log(`Models in lessons: ${Object.keys(M).join(', ') || 'none'}.`);
} else if (mode === 'message') {
  const P = JSON.parse(readFileSync(arg('plan', 'plan.json'), 'utf8'));
  let Q = null; try { Q = JSON.parse(readFileSync(arg('questions', 'questions.json'), 'utf8')); } catch {}
  let S = null; try { S = JSON.parse(readFileSync(arg('stale', 'stale.json'), 'utf8')); } catch {}
  process.stdout.write(message(P, Q, S) + '\n');
} else { console.log('Usage: node scripts/recall.mjs plan|models|message'); process.exit(2); }
