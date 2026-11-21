// Vercel function behind the Ecosystem page: returns what each agent did last.
// It reads status/all.json from the repo's data-only `agent-status` branch (written by scripts/record-status.mjs).
// The repo is private, so it needs a read-only GitHub token in the Vercel env var STATUS_GITHUB_TOKEN.
// Without it, the page still works and says live status is not connected yet.
module.exports = async (req, res) => {
  const token = process.env.STATUS_GITHUB_TOKEN;
  const repo = process.env.STATUS_REPO ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : 'zhengtongxin/tx-learns');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (!token) { res.setHeader('cache-control', 'no-store'); return res.end(JSON.stringify({ connected: false, reason: 'no-token' })); }
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/status/all.json?ref=agent-status`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github.raw+json', 'user-agent': 'tx-learns-status' },
    });
    // 404 means either no agent has recorded yet, or the token cannot see this private repo.
    if (r.status === 404) { res.setHeader('cache-control', 's-maxage=30'); return res.end(JSON.stringify({ connected: true, agents: {}, reason: 'not-found' })); }
    if (r.status === 401 || r.status === 403) { res.setHeader('cache-control', 'no-store'); return res.end(JSON.stringify({ connected: false, reason: 'token-rejected' })); }
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const data = await r.json();
    // Links point into a private repo; keep them, since TX is the one who opens them.
    res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify({ connected: true, ...data }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ connected: false, reason: 'error', message: String(e.message || e).slice(0, 120) }));
  }
};
