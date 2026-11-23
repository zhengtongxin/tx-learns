#!/usr/bin/env node
// Records what an agent just did, for the live Ecosystem page.
// Usage: node scripts/record-status.mjs <agent>   (agent = an id in the AGENTS list on ecosystem.html, e.g. writer, live-check)
// Env: STATE = ok | flag | fail | skip, SUMMARY = one or two plain sentences, LINK = where to see more,
//      GITHUB_TOKEN with contents: write, GITHUB_REPOSITORY.
// It writes status/all.json on the `agent-status` branch, a data-only branch that is never deployed and
// holds no site content (so agents still never push to main). Never fails the workflow.
const agent = process.argv[2];
const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo } = process.env;
const BRANCH = 'agent-status', PATH = 'status/all.json', KEEP = 12;
if (!agent || !token || !repo) { console.log('::warning::record-status: missing agent, GITHUB_TOKEN or GITHUB_REPOSITORY'); process.exit(0); }

// Summaries end up on the public Ecosystem page, so scrub banned terms (source names etc.) first.
import { readFileSync } from 'node:fs';
let banned = [];
try {
  banned = readFileSync(new URL('../banned-words.txt', import.meta.url), 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => new RegExp(l, 'giu'));
} catch { console.log('::warning::record-status: banned-words.txt not found, summary not scrubbed'); }
const scrub = t => banned.reduce((acc, re) => acc.replace(re, '[source]'), t);

const entry = {
  state: ['ok', 'flag', 'fail', 'skip'].includes(process.env.STATE) ? process.env.STATE : 'ok',
  summary: scrub(process.env.SUMMARY || '').replace(/\s+/g, ' ').trim().slice(0, 400),
  link: process.env.LINK || `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID || ''}`,
  at: new Date().toISOString(),
};

const gh = async (method, path, body) => {
  const r = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const b64 = s => Buffer.from(s).toString('base64');

// First run only: create the branch as an orphan with a vercel.json that turns off its deployments.
async function ensureBranch() {
  if ((await gh('GET', `/git/ref/heads/${BRANCH}`)).status === 200) return;
  const files = {
    'vercel.json': '{ "git": { "deploymentEnabled": false } }\n',
    'README.md': '# Agent status\n\nData only. Each agent records its latest run here for the Ecosystem page. Never deployed, never merged.\n',
    [PATH]: '{"agents":{}}\n',
  };
  const tree = await gh('POST', '/git/trees', { tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })) });
  const commit = await gh('POST', '/git/commits', { message: 'Start agent status log', tree: tree.json.sha, parents: [] });
  const ref = await gh('POST', '/git/refs', { ref: `refs/heads/${BRANCH}`, sha: commit.json.sha });
  if (ref.status >= 300 && ref.status !== 422) throw new Error(`could not create ${BRANCH}: ${ref.status} ${ref.json.message}`);
}

try {
  await ensureBranch();
  for (let attempt = 1; attempt <= 5; attempt++) {
    const cur = await gh('GET', `/contents/${PATH}?ref=${BRANCH}`);
    let data = { agents: {} };
    try { data = JSON.parse(Buffer.from(cur.json.content || '', 'base64').toString() || '{}'); } catch {}
    data.agents ||= {};
    const prev = data.agents[agent] || {};
    data.agents[agent] = { ...entry, runs: (prev.runs || 0) + 1, history: [entry, ...(prev.history || [])].slice(0, KEEP) };
    data.updated = entry.at;
    const put = await gh('PUT', `/contents/${PATH}`, {
      message: `${agent}: ${entry.state}`, branch: BRANCH, sha: cur.json.sha, content: b64(JSON.stringify(data, null, 1) + '\n'),
    });
    if (put.status < 300) { console.log(`Recorded ${agent} = ${entry.state}`); process.exit(0); }
    if (put.status !== 409 && put.status !== 422) throw new Error(`${put.status} ${put.json.message}`);
    await new Promise(r => setTimeout(r, 1000 * attempt + Math.random() * 1000)); // another agent wrote first; retry
  }
  console.log('::warning::record-status: gave up after 5 tries');
} catch (e) {
  console.log(`::warning::record-status: ${e.message}`);
}
