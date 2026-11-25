// Vercel function behind the Ecosystem page: returns what each agent did last.
// It reads status/all.json from the repo's data-only `agent-status` branch (written by scripts/record-status.mjs).
// The repo is public, so it reads the file from raw.githubusercontent.com with no token.
// This endpoint is public, so it only passes on what the page needs: each known agent's state, time, run count and
// plain-language summary. No links, branch names or error details; retired agents and blank entries are dropped.
const AGENTS = ['writer', 'copy-check', 'reader', 'reviewer', 'scope-guard', 'ui-check', 'live-check', 'optimizer', 'improver', 'news', 'quality', 'recall'];
const STATES = ['ok', 'flag', 'fail', 'skip'];
const HISTORY = 5; // the page's feed shows the 5 newest runs across all agents, so no agent needs more than 5; keeps the public answer small
const clean = t => String(t || '').replace(/\bOn [\w./-]+: /g, '').replace(/https?:\/\/\S+/g, '').slice(0, 300);
const entry = e => ({ state: e.state, summary: clean(e.summary), at: e.at });
const real = e => e && STATES.includes(e.state) && e.at && clean(e.summary).trim();
function publicView(data) {
  const agents = {};
  for (const id of AGENTS) {
    const a = (data.agents || {})[id];
    if (!a) continue;
    const out = { runs: a.runs || 0, history: (a.history || []).filter(real).slice(0, HISTORY).map(entry) };
    if (real(a)) Object.assign(out, entry(a)); else if (out.history[0]) Object.assign(out, out.history[0]);
    if (a.now && a.now.at) out.now = { at: a.now.at };
    agents[id] = out;
  }
  return { agents, updated: data.updated };
}
module.exports = async (req, res) => {
  const repo = process.env.STATUS_REPO ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : 'zhengtongxin/tx-learns');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  try {
    // The repo is public, so no token is needed. (If it ever goes private again, this returns not-found.)
    const r = await fetch(`https://raw.githubusercontent.com/${repo}/agent-status/status/all.json`, {
      headers: { 'user-agent': 'tx-learns-status' },
    });
    if (r.status === 404) { res.setHeader('cache-control', 's-maxage=30'); return res.end(JSON.stringify({ connected: true, agents: {}, reason: 'not-found' })); }
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const data = await r.json();
    res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify({ connected: true, ...publicView(data) }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ connected: false, reason: 'error' }));
  }
};
