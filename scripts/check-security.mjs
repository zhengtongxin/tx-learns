#!/usr/bin/env node
// Security check (the cybersecurity engineer agent's script). No AI, no network. It fails when:
//   1. Any tracked file holds what looks like a secret: an API key or token, a private key, a password in a URL.
//   2. A page the site serves has an unsafe link: javascript: links, plain http:// links or files, a new-tab link
//      without rel="noopener", or a script loaded from a site that is not on the short trusted list.
//   3. A workflow puts text that anyone can write (a PR title or body, a branch name, a comment) straight into a
//      shell script, where it could run as a command. Pass it through env: instead.
//   4. A workflow uses pull_request_target, which runs with write access on code from strangers.
// Usage: node scripts/check-security.mjs        Runs in the copy check.
// A secret is never printed in full: only the file, the line and the kind of secret.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
let files = [];
try { files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean); }
catch { console.log('Not a git checkout: nothing to scan.'); process.exit(0); }
files = files.filter(f => existsSync(join(root, f)) && !/\.(png|jpe?g|gif|ico|webp|woff2?|pdf|zip)$/i.test(f));

const SECRETS = [
  ['an Anthropic API key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['an OpenAI-style API key', /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/],
  ['a GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['an AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['a Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['a Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['a Telegram bot token', /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/],
  ['a Hugging Face token', /\bhf_[A-Za-z0-9]{30,}/],
  ['a private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['a password inside a URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@'"]+:[^\s/@'"$]{6,}@[^\s'"]+/i],
];
// Hosts a page may load scripts from. Everything else is served from this site itself.
const SCRIPT_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com'];
const served = f => /\.(html|js|css)$/.test(f) && !/^(scripts|\.github|inbox|api)\//.test(f) && !f.startsWith('node_modules/');
// Text anyone can write: never put it straight into a run: script.
const UNTRUSTED = /\$\{\{\s*github\.(?:head_ref|event\.(?:pull_request\.(?:title|body|head\.ref|head\.label)|issue\.(?:title|body)|comment\.body|review\.body|head_commit\.message|commits)|event\.inputs)/;

const problems = [];
const bad = (f, i, what) => problems.push(`${f}:${i + 1}: ${what}`);
for (const f of files) {
  let text;
  try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue; // binary
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.length > 5000) line = line.slice(0, 5000);
    for (const [kind, re] of SECRETS) if (re.test(line) && !/example|placeholder|your[-_ ]?key|xxxx/i.test(line)) bad(f, i, `looks like ${kind}. Remove it, and revoke it if it was real.`);
    if (served(f)) {
      if (/\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(line)) bad(f, i, 'a javascript: link. Use a button with a script instead.');
      if (/\b(?:href|src)\s*=\s*["']http:\/\/(?!localhost|127\.0\.0\.1)/i.test(line)) bad(f, i, 'a plain http:// link or file. Use https://.');
      for (const m of line.matchAll(/<a\b[^>]*>/gi)) if (/target\s*=\s*["']_blank/i.test(m[0]) && !/rel\s*=\s*["'][^"']*noopener/i.test(m[0]) && !/rel\s*=\s*["'][^"']*noreferrer/i.test(m[0])) bad(f, i, 'a link that opens a new tab without rel="noopener".');
      for (const m of line.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'](https?:)?\/\/([^/"']+)/gi)) if (!SCRIPT_HOSTS.includes(m[2].toLowerCase())) bad(f, i, `a script loaded from ${m[2]}, which is not on the trusted list.`);
    }
    if (/^\.github\/workflows\/.*\.ya?ml$/.test(f)) {
      if (/^\s*pull_request_target\s*:/.test(line) || /^\s*on:\s*\[?[^#]*\bpull_request_target\b/.test(line)) bad(f, i, 'pull_request_target runs with write access on code from strangers. Use pull_request.');
      // An env: or with: entry (KEY: ${{ ... }}) is safe; the same text inside a shell script is not.
      if (UNTRUSTED.test(line) && (/^\s*(?:-\s*)?run\s*:/.test(line) || !/^\s*(?:-\s*)?[A-Za-z_][\w-]*\s*:\s/.test(line))) bad(f, i, 'text anyone can write goes straight into a shell script. Pass it through env: and use "$NAME".');
    }
  });
}
if (problems.length) {
  problems.forEach(p => console.log(p));
  console.log(`\n${problems.length} security problem(s).`);
  process.exit(1);
}
console.log(`Security check passed: ${files.length} files, ${SECRETS.length} secret patterns, links and workflows.`);
