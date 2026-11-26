#!/usr/bin/env node
// Who each lesson is for: a short brief the intern agent (reader.yml) reads before it scores a lesson.
// A beginner lesson is judged by a complete newcomer. An intermediate or advanced lesson is judged by the reader it
// is written for: someone who already knows what the easier levels teach. Without this, an advanced lesson always
// scores low, and the number says more about the lesson's level than about its writing.
//   node scripts/reader-brief.mjs agentic-ai/09-outreach-email-helper.html ai-fde/17-swarms.html
// Reads tracks.js, <track>/lessons.js (topic level) and <track>/prereqs.js (the lesson's own "know" and "tools" lines)
// from the current folder, in a sandbox. No network, no dependencies. Run from the repo root.
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

export const WHO = {
  1: 'a complete newcomer to AI: smart and curious, can read a little Python, has never called a model.',
  2: 'someone who has finished the beginner lessons: knows what a model, a prompt, an API key, a tool call and an agent are, can read Python and has run a script that calls a model. Libraries, frameworks and services are still new.',
  3: 'someone comfortable with Python and the terminal who has built a small agent or app: knows models, prompts, tools, agents, git and environment variables. A specific library, cloud service or technique may still be new.',
};
const load = f => { const win = {}; if (existsSync(f)) { try { vm.runInNewContext(readFileSync(f, 'utf8'), { window: win }, { timeout: 5000 }); } catch {} } return win; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 300);

export function brief(files, root = '.') {
  return files.filter(f => /^[a-z][a-z0-9-]*\/\d\d-[a-z0-9-]+\.html$/.test(f)).map(f => {
    const [track, file] = f.split('/');
    const T = load(`${root}/${track}/lessons.js`).TRACK;
    const topic = ((T && T.topics) || []).find(t => (t.items || []).some(i => i.file === file));
    const level = topic && [1, 2, 3].includes(topic.level) ? topic.level : 1;
    const p = (load(`${root}/${track}/prereqs.js`).PREREQ || {})[file] || {};
    return { file: f, level, who: WHO[level], know: clean(p.know && p.know.en), tools: clean(p.tools && p.tools.en) };
  });
}
export function text(rows) {
  return rows.map(r => `- ${r.file}: level ${r.level} of 3. Read it as ${r.who}` +
    (r.level > 1 && r.know ? ` The lesson itself assumes: ${r.know}` : '') +
    (r.level > 1 && r.tools ? ` It expects these to be set up already: ${r.tools}.` : '')).join('\n');
}
if (import.meta.url === `file://${process.argv[1]}`) console.log(text(brief(process.argv.slice(2))));
