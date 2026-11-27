#!/usr/bin/env node
// Scout: lets each agent role look for improvements in its own area, not just react to what others found.
//   node scripts/scout.mjs plan --out DIR   decide (no AI) whether a scout is worth running now; writes DIR/prompt.md
//                                           exports scout=true|false, role, file
//   node scripts/scout.mjs add FILE         read the scout's answer, keep new ideas (deduped, capped) in the backlog
// The backlog is signals/ideas.json on the data-only `agent-status` branch. The improvement agent takes the best idea
// when no problem was reported (signals.mjs pick), so ideas go through the same one-PR, scope-guard, review, auto-merge path.
// Cost control: one role and ONE file per run; a file is only scouted again when its content changed (or after 45 days);
// nothing runs while the backlog already holds ideas or something more urgent exists.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { arg } from './lib.mjs';
import { pick, rawFile, update, short, pendingIdeas } from './signals.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PER_RUN = 2, MAX_PENDING = 12, EXPIRE_DAYS = 30, RESCOUT_DAYS = 45, ROLE_GAP_HOURS = 20;
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
const lessons = () => readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(ROOT, d.name, 'lessons.js')))
  .flatMap(d => readdirSync(join(ROOT, d.name)).filter(f => /^\d\d-[a-z0-9-]+\.html$/.test(f)).map(f => `${d.name}/${f}`));
const tops = () => ['index.html', 'tracks.html', 'glossary.html', 'about.html', '404.html'].filter(f => existsSync(join(ROOT, f)));

// One lens per role. `files` lists what the role may look at; `ask` says what that role cares about.
// Files are chosen so one file means one area (the scope guard allows one area per pull request).
export const ROLES = {
  'content-creator': { files: lessons, ask: 'You are the content creator. Read STYLE.md, then the lesson. Look for what would teach better: a missing worked example, a step that jumps, a weak recap, a figure of speech that does not carry over to 中文, a place where the lesson repeats or contradicts another one (scripts/rag.mjs "<question>" finds related lessons).' },
  'backend-engineer': { files: lessons, ask: 'You are the backend engineer. Read the lesson\'s code boxes and facts. Look for code that would not run as written, a command or setting that is wrong or out of date, a claim that is not true, a missing import or step.' },
  'frontend-engineer': { files: tops, ask: 'You are the frontend engineer. Read the page. Look for what would confuse or block a reader on a phone or with a keyboard: unclear labels, missing headings or alt text, controls that are hard to find, tight tap targets, text that is too long.' },
  'cybersecurity-engineer': { files: () => lessons().map(f => f.replace(/^([^/]+)\/(\d\d-.+)\.html$/, '$1/js/$2.js')).filter(f => existsSync(join(ROOT, f))), ask: 'You are the cybersecurity engineer. Read the lesson widget script (one lesson only, never shared site scripts). Look for unsafe patterns: untrusted text put into HTML (innerHTML), links opened without rel, data read from storage without checking, anything that could run attacker text.' },
  'product-engineer': { files: () => ['index.html', ...tops().filter(f => f !== 'index.html')], ask: 'You are the product engineer. Read the page as a first-time visitor. Look for what would make them leave or not know where to start: unclear promise, missing next step, jargon before it is explained.' },
  'translator': { files: lessons, ask: 'You are the translator. Read the lesson in both languages (the class="en" and class="zh" blocks, and the {en, zh} strings in its script). Look for places where the 中文 does not say the same thing as the English: a sentence dropped or added, a number, name or step that differs, a term translated differently from glossary.js or from earlier in the same lesson, or English left as it is where a common 中文 term exists. Wording that is merely different but means the same is fine.' },
  'intern': { files: () => ['glossary.js'].filter(f => existsSync(join(ROOT, f))), ask: 'You are the intern learning AI. Read the glossary terms. Look for definitions that use a harder word than the one they explain, a term lessons use that is missing, or an English and 中文 pair that do not say the same thing.' },
};
const hash = f => createHash('sha1').update(readFileSync(join(ROOT, f))).digest('hex').slice(0, 12);
const words = s => new Set(String(s).toLowerCase().match(/[a-z0-9一-鿿]{3,}/g) || []);
const same = (a, b) => { const x = words(a), y = words(b); const n = [...x].filter(w => y.has(w)).length; return n / Math.max(1, Math.min(x.size, y.size)) >= 0.6; };

export async function plan() {
  if (await pick({ ideas: false })) return null;        // a reported problem comes first: no scout
  const state = await rawFile('signals/ideas.json');
  if (pendingIdeas(state).length >= 5) return null;
  const now = Date.now(), roles = Object.keys(ROLES);
  // The role that scouted longest ago goes first; a role that scouted in the last 20 hours is skipped.
  const order = roles.filter(r => now - Date.parse(state.roles?.[r] || 0) > ROLE_GAP_HOURS * 36e5).sort((a, b) => Date.parse(state.roles?.[a] || 0) - Date.parse(state.roles?.[b] || 0));
  for (const role of order) {
    const todo = ROLES[role].files().filter(f => { const s = state.scouted?.[`${role}|${f}`]; return !s || s.h !== hash(f) || now - Date.parse(s.at) > RESCOUT_DAYS * 864e5; });
    if (todo.length) {
      const file = todo[Math.floor(Math.random() * todo.length)];
      const js = file.replace(/^([^/]+)\/(\d\d-[^.]+)\.html$/, '$1/js/$2.js');
      return { role, file, extra: file !== js && existsSync(join(ROOT, js)) ? js : '' };
    }
  }
  return null;
}

export function prompt(p) {
  return `You are scouting for improvements on TX Learns, a bilingual (EN/中文), static learning site for people new to AI.
${ROLES[p.role].ask}

Look ONLY at ${p.file}${p.extra ? ` (its widget script ${p.extra} too)` : ''}. Read CLAUDE.md first for the rules of the site. You may only read; change nothing.
Suggest at most ${MAX_PER_RUN} improvements that are real, small (one focused edit in that file${p.extra ? ' or its script' : ''}) and worth a reader's time. If you find nothing worth doing, say so with an empty list: that is a good answer. No taste edits, no rewrites, no new features, no renaming.
Answer with ONLY this JSON, nothing before or after:
{"ideas":[{"title":"short, what to change (max 90 chars)","why":"the reader-facing problem, one sentence","priority":1 to 3 (1 = most important)}]}
`;
}

export function clean(answer, p, state, now = new Date().toISOString()) {
  let raw; try { raw = JSON.parse((String(answer).match(/\{[\s\S]*\}/) || ['{}'])[0]); } catch { raw = {}; }
  const taken = [...pendingIdeas(state), ...(state.done || [])].filter(i => i.file === p.file);
  const added = [];
  for (const i of (raw.ideas || []).slice(0, MAX_PER_RUN)) {
    const title = short(i.title, 90), why = short(i.why, 300);
    if (title.length < 10 || why.length < 10) continue;
    if ([...taken, ...added].some(t => same(t.title, title))) continue;
    added.push({ id: createHash('sha1').update(p.file + title.toLowerCase()).digest('hex').slice(0, 10), role: p.role, file: p.file, title, why, priority: Math.max(1, Math.min(3, Math.round(+i.priority) || 2)), at: now });
  }
  return added;
}

const mode = process.argv[2];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (mode === 'plan') {
    const dir = arg('out', '/tmp/scout'); mkdirSync(dir, { recursive: true });
    const p = await plan();
    if (!p) { console.log('No scout needed: something is already waiting, or every file was looked at and is unchanged.'); out('scout', 'false'); }
    else {
      writeFileSync(join(dir, 'prompt.md'), prompt(p)); writeFileSync(join(dir, 'plan.json'), JSON.stringify(p));
      console.log(`Scout: ${p.role} looks at ${p.file}`); out('scout', 'true'); out('role', p.role); out('file', p.file);
    }
  } else if (mode === 'add') {
    const p = JSON.parse(readFileSync(process.argv[4] || '/tmp/scout/plan.json', 'utf8'));
    const answer = readFileSync(process.argv[3], 'utf8');
    await update('signals/ideas.json', d => {
      const now = new Date().toISOString();
      d.ideas = (d.ideas || []).filter(i => Date.now() - Date.parse(i.at) < EXPIRE_DAYS * 864e5);
      const added = clean(answer, p, d, now).slice(0, Math.max(0, MAX_PENDING - d.ideas.length));
      d.ideas.push(...added);
      (d.scouted ||= {})[`${p.role}|${p.file}`] = { h: hash(p.file), at: now };
      (d.roles ||= {})[p.role] = now;
      console.log(`Kept ${added.length} idea(s): ${added.map(i => i.title).join(' | ') || 'none'}`);
      return d;
    });
  } else { console.error('Usage: node scripts/scout.mjs plan --out DIR | add ANSWER_FILE [PLAN_FILE]'); process.exit(2); }
}
