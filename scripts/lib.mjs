// Small helpers shared by the digest, live check and recall scripts. No dependencies.
//   gh(method, path, body)  GitHub REST call for this repo (GITHUB_TOKEN, GITHUB_REPOSITORY; GITHUB_API to point at a test server)
//   telegram(text, {html})  message TX; never throws, never fails a workflow
//   loadTrack(source)       window.TRACK from lessons.js text
//   scrub(text)             replaces banned terms (banned-words.txt) with [source]
//   modelsInLessons(root)   the AI model ids the published lessons use, with the lessons that use each
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export const REPO = process.env.GITHUB_REPOSITORY || 'zhengtongxin/tx-learns';
const API = (process.env.GITHUB_API || 'https://api.github.com').replace(/\/$/, '');

export async function gh(method, path, body, { raw = false, ok404 = false, token = '' } = {}) {
  const url = /^https?:/.test(path) ? path : `${API}/repos/${REPO}${path}`;
  const r = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token || process.env.GITHUB_TOKEN || ''}`,
      accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'content-type': 'application/json', 'user-agent': 'tx-learns-agents',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 404 && ok404) return null;
  if (r.status === 204) return {};
  const text = await r.text();
  if (!r.ok) throw new Error(`GitHub ${method} ${path}: ${r.status} ${text.slice(0, 200)}`);
  if (raw) return text;
  try { return JSON.parse(text); } catch { return text; }
}

export async function telegram(text, { html = false } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  text = String(text || '').trim();
  // Telegram's limit is 4096. Cut at a line break, so an HTML message is never cut inside a tag.
  if (text.length > 3900) text = text.slice(0, text.lastIndexOf('\n', 3900) > 0 ? text.lastIndexOf('\n', 3900) : 3900) + '\n…';
  if (!text) return;
  if (process.env.DRY_RUN || !token || !chat) {
    console.log(`--- Telegram${token && chat ? ' (dry run)' : ' (not sent: no TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)'} ---\n${text}\n---`);
    return;
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true, ...(html ? { parse_mode: 'HTML' } : {}) }),
    }).then(x => x.json());
    console.log(r.ok ? 'Telegram message sent.' : `::warning::Telegram error: ${r.description}`);
  } catch (e) { console.log(`::warning::Telegram error: ${e.message}`); }
}

export const escHtml = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function loadTrack(source) {
  const ctx = { window: {} };
  vm.runInNewContext(source, ctx, { filename: 'lessons.js' });
  return ctx.window.TRACK;
}

// Every track listed in tracks.js: { id, dir, T } where dir is the track's folder and T is its lessons.js.
export function loadTracks(root) {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(join(root, 'tracks.js'), 'utf8'), ctx, { filename: 'tracks.js' });
  return ctx.window.TRACKS.map(t => ({ id: t.id, dir: t.id, T: loadTrack(readFileSync(join(root, t.id, 'lessons.js'), 'utf8')) }));
}

// Model ids as lessons write them in code, e.g. gpt-5.4-mini, claude-sonnet-4-6, gemini-3.1-flash-lite, llama3.2.
export const MODEL = /\b(?:gpt-[0-9][\w.-]*|gpt-oss-[\w.-]+|o[1-9]-(?:mini|pro)|claude-[a-z]+-[\w.-]+|gemini-[0-9][\w.-]*|llama[0-9][\w.:-]*|deepseek-[\w.-]+|qwen[0-9][\w.:-]*|mistral-[\w.-]+|grok-[0-9][\w.-]*)\b/gi;
export const modelIds = text => [...new Set((String(text).match(MODEL) || []).map(m => m.replace(/[.:-]+$/, '').toLowerCase()))];
// Every model id the published lessons use: { id: [lesson paths] } (the learning coach's monthly check and the daily news scan read it).
export function modelsInLessons(root) {
  const found = {};
  for (const t of loadTracks(root)) for (const l of t.T.topics.flatMap(w => w.items).filter(x => x.file)) {
    for (const id of modelIds(readFileSync(join(root, t.dir, l.file), 'utf8'))) (found[id] ||= new Set()).add(t.dir + '/' + l.file);
  }
  return Object.fromEntries(Object.entries(found).sort().map(([k, v]) => [k, [...v]]));
}

// Banned terms: the generic rules in banned-words.txt (public) plus the source names, which live outside the repo:
// optional: the BANNED_WORDS_EXTRA variable (one pattern per line) or an untracked banned-words.local.txt on a machine.
export function bannedSources(root) {
  const lines = [];
  for (const f of ['banned-words.txt', 'banned-words.local.txt']) {
    try { lines.push(...readFileSync(join(root, f), 'utf8').split('\n')); } catch {}
  }
  lines.push(...String(process.env.BANNED_WORDS_EXTRA || '').split('\n'));
  return lines.map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

let banned;
export function scrub(text) {
  if (!banned) {
    try { banned = bannedSources(new URL('..', import.meta.url).pathname).map(l => new RegExp(l, 'giu')); } catch { banned = []; }
  }
  return banned.reduce((acc, re) => acc.replace(re, '[source]'), String(text || ''));
}

export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
