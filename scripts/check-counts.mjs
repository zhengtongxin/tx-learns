#!/usr/bin/env node
// Count check: the lesson list (each track's lessons.js) is the only source of truth for how many
// topics and lessons there are. This fails when anything disagrees with it:
//   1. a page or tracks.js types a topic or lesson count by hand (counts must be computed from lessons.js),
//   2. a lesson file is missing from lessons.js, listed twice, or listed but not on disk,
//   3. a lesson's tag is not "<Topic> · Lesson N" (N = non-project items so far in that topic) or "<Topic> · Project".
// Usage: node scripts/check-counts.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['.git', 'node_modules', 'scripts', '.github', 'inbox', 'status']);
const problems = [];
const say = (where, msg) => problems.push(`${where}: ${msg}`);

function load(file, name) {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(join(root, file), 'utf8'), ctx, { filename: file });
  return ctx.window[name];
}

const tracks = load('tracks.js', 'TRACKS') || [];
let allTopics = 0, allLessons = 0;

const domains = load('tracks.js', 'DOMAINS') || [];
const lastLevel = {};
for (const tr of tracks) {
  if (!domains.some(d => d.id === tr.domain)) say('tracks.js', `"${tr.id}" needs domain:'<id>' from window.DOMAINS`);
  const prev = lastLevel[tr.domain] || 1;
  if (tr.level < prev) say('tracks.js', `"${tr.id}" is level ${tr.level} after a level ${prev} track in its domain: list easier tracks first`);
  lastLevel[tr.domain] = tr.level;
}
for (const tr of tracks) {
  if (![1, 2, 3].includes(tr.level)) say('tracks.js', `"${tr.id}" needs level 1, 2 or 3`);
  for (const k of ['topics', 'total']) if (k in tr) say('tracks.js', `"${tr.id}" has ${k}:${tr[k]} typed by hand. Remove it: the page counts lessons.js.`);
  const dir = dirname(tr.href);
  const T = load(join(dir, 'lessons.js'), 'TRACK');
  if (!T || !Array.isArray(T.topics)) { say(join(dir, 'lessons.js'), 'no window.TRACK.topics'); continue; }
  const items = T.topics.flatMap(w => w.items);
  allTopics += T.topics.length; allLessons += items.length;

  // 2. lessons.js and the lesson files on disk agree.
  const listed = new Map();
  for (const it of items.filter(i => i.file)) {
    if (listed.has(it.file)) say(join(dir, 'lessons.js'), `${it.file} is listed twice`);
    listed.set(it.file, it);
    if (!existsSync(join(root, dir, it.file))) say(join(dir, 'lessons.js'), `${it.file} is listed but the file does not exist`);
  }
  const onDisk = readdirSync(join(root, dir)).filter(f => /^\d\d-.+\.html$/.test(f));
  for (const f of onDisk) if (!listed.has(f)) say(join(dir, f), 'lesson file is not listed in lessons.js, so it is not counted or linked');
  const nums = onDisk.map(f => f.slice(0, 2));
  for (const n of new Set(nums)) if (nums.filter(x => x === n).length > 1) say(dir, `two lesson files start with ${n}-`);

  // Difficulty: every topic has level 1-3 and the levels never go down the list (easiest first).
  let prev = 1;
  for (const w of T.topics) {
    if (![1, 2, 3].includes(w.level)) say(join(dir, 'lessons.js'), `topic ${w.n} has no level 1, 2 or 3`);
    else { if (w.level < prev) say(join(dir, 'lessons.js'), `topic ${w.n} ("${w.title.en}") is level ${w.level} after a level ${prev} topic: put easier topics first`); prev = w.level; }
  }

  // 3. Each published lesson's tag matches its place in lessons.js.
  for (const w of T.topics) {
    let n = 0;
    for (const it of w.items) {
      if (it.k !== 'p') n++;
      if (!it.file || !existsSync(join(root, dir, it.file))) continue;
      const want = it.k === 'p'
        ? { en: `${w.title.en} · Project`, zh: `${w.title.zh} · 项目` }
        : { en: `${w.title.en} · Lesson ${n}`, zh: `${w.title.zh} · 第 ${n} 课` };
      const html = readFileSync(join(root, dir, it.file), 'utf8');
      const m = html.match(/<span class="tag"><span class="en">([^<]*)<\/span><span class="zh">([^<]*)<\/span>/);
      if (!m) { say(join(dir, it.file), 'no <span class="tag"> with .en and .zh found'); continue; }
      if (m[1].trim() !== want.en) say(join(dir, it.file), `tag says "${m[1]}", lessons.js says "${want.en}"`);
      if (m[2].trim() !== want.zh) say(join(dir, it.file), `tag says "${m[2]}", lessons.js says "${want.zh}"`);
    }
  }
}

// 1. No hand-typed counts on the served pages (lesson pages themselves are skipped: their text is prose).
const COUNT = [
  /\b\d+\s+(?:topics?|lessons?)\b/gi,            // "7 topics", "24 lessons"
  /\d+\s*(?:个主题|课(?!程))/g,                   // "7 个主题", "24 课"
  /data-count="\d+"(?=.{0,80}?(?:Topics|Lessons|主题|课))/gi, // hero stat counters
];
function walk(d, out = []) {
  for (const name of readdirSync(d)) {
    if (SKIP.has(name)) continue;
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|js)$/.test(name) && !/^\d\d-/.test(name)) out.push(p);
  }
  return out;
}
for (const f of walk(root)) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const re of COUNT) for (const m of line.matchAll(re))
      say(`${relative(root, f)}:${i + 1}`, `"${m[0]}" is a count typed by hand. Compute it from lessons.js instead.`);
  });
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n✗ Count check: ${problems.length} problem(s). Truth from lessons.js: ${allTopics} topics, ${allLessons} lessons.`);
  process.exit(1);
}
console.log(`✓ Count check passed: ${allTopics} topics, ${allLessons} lessons, every lesson listed once and tagged to match.`);
