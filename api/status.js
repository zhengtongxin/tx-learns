// Public Ecosystem status. No token or logs: bounded reads of the public status branch and GitHub reports.
// Preserve the five-entry activity feed; use up to twelve recorded runs privately to establish attention evidence.
const AGENTS = ['writer', 'copy-check', 'reader', 'reviewer', 'scope-guard', 'ui-check', 'live-check', 'optimizer', 'improver', 'news', 'quality', 'recall'];
const STATES = ['ok', 'flag', 'fail', 'skip'];
const HISTORY = 5, EVIDENCE = 12, FRESH = 30 * 60000, EXTRA_TTL = 10 * 60000, MAX_BYTES = 256 * 1024;
const CHECKERS = new Set(['copy-check', 'reader', 'reviewer', 'scope-guard', 'ui-check', 'live-check', 'quality']);
const pair = (en, zh) => ({ en, zh });
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const plain = (value, max = 400) => typeof value !== 'string' ? '' : value.slice(0, 64000)
  .replace(/\bOn [\w./-]+: /g, '').replace(/https?:\/\/\S+/g, '').replace(/<\/?([a-z][a-z0-9]*)\s*>/gi, '$1').replace(/<[^>]*>/g, '')
  .replace(/\b(?:gh[pousr]_[\w]{20,}|github_pat_[\w]{20,}|sk-[\w-]{20,})\b/g, '[redacted]')
  .replace(/\b(token|password|secret|api[-_ ]?key)\s*[:=]\s*["']?[^\s"']+/gi, '$1=[redacted]')
  .replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069`*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function iso(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(value)) return '';
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms <= now ? new Date(ms).toISOString() : '';
}
function repository() {
  const repo = process.env.STATUS_REPO || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : 'zhengtongxin/tx-learns');
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(repo)) throw new Error('Invalid repository');
  return repo;
}
// Match the original string, not a URL-normalized path (which can hide credentials, ports, % escapes or dot segments).
function source(value, repo) {
  if (typeof value !== 'string' || /[\s\\%]/.test(value) || !value.startsWith(`https://github.com/${repo}/`)) return null;
  const path = value.slice(`https://github.com/${repo}/`.length);
  const m = /^(?:(pull|issues)\/([1-9]\d{0,15})(?:#issuecomment-([1-9]\d{0,19}))?|(actions\/runs)\/([1-9]\d{0,19})|(commit)\/([a-f0-9]{40})(?:#commitcomment-([1-9]\d{0,19}))?)$/.exec(path);
  if (!m) return null;
  return { url: value, type: m[1] || m[4] || m[6], number: m[2] || m[5] || m[7], comment: m[3] || m[8], scope: value.split('#')[0] };
}
function entry(e, repo, now) {
  if (!object(e) || !STATES.includes(e.state) || !iso(e.at, now) || !plain(e.summary)) return null;
  const link = source(e.link, repo);
  return { state: e.state, summary: plain(e.summary, 300), at: iso(e.at, now), ...(link ? { link: link.url } : {}) };
}
function publicView(data, repo, now) {
  const agents = {};
  for (const id of AGENTS) {
    const a = data.agents[id]; if (!object(a)) continue;
    const history = (Array.isArray(a.history) ? a.history : []).slice(0, EVIDENCE).map(e => entry(e, repo, now)).filter(Boolean).slice(0, HISTORY);
    const last = entry(a, repo, now) || (!a.state && !a.at ? history[0] : null);
    const out = { runs: Number.isSafeInteger(a.runs) && a.runs >= 0 ? a.runs : 0, history, ...last };
    const at = iso(a.now?.at, now), link = source(a.now?.link, repo);
    if (at && now - Date.parse(at) < FRESH) out.now = { at, ...(link ? { link: link.url } : {}) };
    const invalid = (a.state || a.at) && !entry(a, repo, now);
    const staleNow = a.now && (!at || now - Date.parse(at) >= FRESH);
    const staleResult = (a.state || a.at) && !a.now && (!iso(a.at, now) || now - Date.parse(a.at) > 8 * 86400000);
    if (invalid || staleNow || staleResult) out.uncertain = true;
    if (last || history.length || a.state || a.now) agents[id] = out;
  }
  return { agents, ...(iso(data.updated, now) ? { updated: iso(data.updated, now) } : {}) };
}
const IMPACT = {
  writer: pair('A lesson draft may not reach review.', '课的草稿可能无法进入审阅。'),
  'copy-check': pair('This change cannot merge until its checks pass.', '这项改动要通过检查才能合并。'),
  reviewer: pair('This change is waiting for a passing review.', '这项改动还需要通过审阅。'),
  'scope-guard': pair('This change may be outside the requested scope.', '这项改动可能超出了需求范围。'),
  reader: pair('Readers may get stuck in the reported lesson.', '读者可能在报告中的课里看不懂。'),
  'ui-check': pair('The reported page may be awkward to use; this is not a merge gate.', '报告中的页面可能不好用；这项检查不阻止合并。'),
  'live-check': pair('The live site needs checking; a failed check alone does not prove it is broken.', '需要核实线上网站；巡检失败不等于网站已坏。'),
  quality: pair('The reported page has a quality finding; merges are not blocked.', '报告中的页面有质量问题；不会阻止合并。'),
  improver: pair('A planned fix may not have been delivered.', '计划中的修复可能尚未交付。'),
  optimizer: pair('An efficiency improvement may not have been delivered.', '效率改进可能尚未交付。'),
  news: pair('Recent announcements may not have been checked against lessons.', '近期公告可能尚未与课的内容核对。'),
  recall: pair('The review reminder may not have been sent.', '复习提醒可能尚未发出。'),
};
function titleFor(agent, state, detail) {
  if (state === 'fail') return pair('The task could not finish', '任务未能完成');
  // The successful browser summary lists things it did NOT find; do not turn that negative list into a diagnosis.
  if (agent === 'ui-check' && /All .*pages tested passed/.test(detail)) return pair('Visual notes need a look', '有视觉检查建议待确认');
  if (/floating (?:lesson )?(?:pager|navigation)|pager bar/i.test(detail) && /sits on top|overlap|obscur|cover|hard to read/i.test(detail)) return pair('Floating navigation hides content', '浮动导航遮住内容');
  if (/listitem|list structure|list semantics|<li>|list.*(?:direct|child)/i.test(detail)) return pair('List structure needs fixing', '列表结构需要修正');
  if (/contrast/i.test(detail)) return pair('Text contrast needs fixing', '文字对比度需要修正');
  if (/broken link|missing file|404|dead link/i.test(detail)) return pair('A link or file is missing', '链接或文件缺失');
  if (/popup|overflow|wider than|overlap/i.test(detail)) return pair('Layout or popup problem', '布局或弹窗有问题');
  if (agent === 'reader') return pair('A lesson needs clearer explanations', '课的讲解需要更清楚');
  if (agent === 'ui-check') return pair('The page review found issues', '页面审阅发现问题');
  if (agent === 'scope-guard') return pair('Changes need a scope review', '需要核对改动范围');
  if (agent === 'quality') return pair('The quality report needs attention', '质量报告有待处理');
  return pair('The check reported a problem', '检查报告了问题');
}
const pathsIn = text => [...new Set(String(text || '').match(/\b(?:[a-z0-9-]+\/)?[a-z0-9-]+\.html\b/g) || [])];
const normalized = text => plain(text, 64000).toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ').trim();
function matchesRepair(c, repair, repo) {
  const { pr, body, problem } = repair;
  if (c.staleEvidence || repair.fetchedAt < (c.evidenceAt || Date.parse(c.e.at))) return false;
  if (Date.parse(pr.created_at) < Date.parse(c.e.at) || !c.files.length || !c.files.every(file => body.includes(file))) return false;
  const sources = (problem.match(/https:\/\/github\.com\/[^\s<>"')]+/g) || []).map(link => source(link, repo)).filter(Boolean);
  if (c.s && sources.some(s => s.scope === c.s.scope && (!c.s.comment || s.comment === c.s.comment))) return true;
  // Same file or the boilerplate "found by the intern" is not enough. Require the actual recorded diagnostic wording.
  const problemText = normalized(problem);
  return c.files.every(file => problem.includes(file)) && c.fingerprints?.length > 0 && c.fingerprints.every(f => problemText.includes(f));
}
function findings(body, quality) {
  if (typeof body !== 'string') return { text: '', files: [], truncated: true };
  const lines = [], all = body.split('\n'); let active = false;
  for (const line of all) {
    if (quality && /^####\s+Problems\s*$/i.test(line)) { active = true; continue; }
    if (quality && /^#{1,4}\s/.test(line)) { active = false; continue; }
    if (!quality && /Visual pass/.test(line)) { active = true; continue; }
    if (!quality && /Screenshots and logs:/.test(line)) active = false;
    if ((quality ? active : active || /^\|/.test(line)) && (/^[-*]\s/.test(line) || /^\|/.test(line)) && !/^\|\s*(?:Page|:?-)/.test(line)) lines.push(line);
  }
  const distinct = [...new Set(lines.map(l => plain(l.replace(/^[-*]\s|\|/g, ' '), 1200)))].filter(Boolean);
  const text = distinct.join(' ');
  const fingerprints = [...new Set(distinct.map(line => normalized(line.replace(/.*\]:?\s*/, '').replace(/^.*?\.html\s*:?\s*/, ''))).filter(s => s.length >= 18))];
  return { text: text.slice(0, 400), files: pathsIn(lines.join(' ')), fingerprints, truncated: text.length > 400 };
}
function diagnosticItem(agent, e, repo, checkedAt, suffix = '') {
  const s = source(e.link, repo), detail = plain(e.summary);
  return { id: `${agent}:${s?.type || 'report'}:${s?.number || e.at}${suffix}`, agent, kind: 'action', state: e.state, at: e.at || checkedAt, historical: false,
    title: titleFor(agent, e.state, detail), detail, detailTruncated: plain(e.summary, 64000).length > 400 || !!e.detailTruncated, impact: IMPACT[agent],
    owner: pair('You (TX), to review', '你（TX），先确认'),
    next: e.state === 'fail' ? pair('Open the failed run, fix the reported cause, then re-run it.', '打开失败任务，按失败步骤说明处理原因，再重新运行。')
      : pair('Open the report, check the named problem and request a focused fix.', '打开报告，核实具体问题，再安排针对性修复。'),
    links: s ? [{ url: s.url, label: pair('Open the report', '打开报告') }] : [] };
}
function guidanceFor(item) {
  if (item.state === 'fail') return pair('Open the failed run, fix the cause named in its failing step, then re-run it. No automatic repair is confirmed.', '打开失败任务，按失败步骤说明处理原因，再重新运行；尚未确认有自动修复。');
  if (item.agent === 'reader') return pair('Clarify the named confusing steps in both languages, then re-run the intern review. No automatic repair is confirmed.', '把指出的难懂步骤补充清楚，中英同步，再运行实习生审阅；尚未确认有自动修复。');
  if (item.agent === 'quality' && item.title.en === 'List structure needs fixing') return pair('Use li as direct list children and keep interactive controls inside them; then re-run the quality check. No automatic repair is confirmed.', '让列表的直接子元素为 li，把交互控件放在 li 内，再运行质量检查；尚未确认有自动修复。');
  if (item.agent === 'ui-check' && item.title.en === 'Floating navigation hides content') return pair('Move or offset the floating pager so headings remain visible, then re-run the UI check. No automatic repair is confirmed.', '调整浮动导航的位置或预留空间，避免遮住标题，再运行界面检查；尚未确认有自动修复。');
  if (item.agent === 'ui-check') return pair('Adjust the reported layout on desktop and phone, then re-run the UI check. No automatic repair is confirmed.', '按报告调整电脑和手机布局，再运行界面检查；尚未确认有自动修复。');
  return pair('Open the report and request a focused fix, then re-run its check. No automatic repair is confirmed.', '打开报告，安排针对性修复后重新检查；尚未确认有自动修复。');
}
function unknown(item, why) {
  item.kind = 'unknown'; item.owner = pair('Not confirmed', '尚未确认');
  item.next = why || pair('Open the last report to check whether this still needs work; no matching recovery is recorded.', '打开上次报告确认是否还需处理；没有记录能证明该问题已恢复。');
}
function passing(agent, e) {
  return CHECKERS.has(agent) && e.state === 'ok' && !/opened|drafted|prepared|waiting|nothing to fix|could not/i.test(e.summary);
}
function coversFinding(agent, before, after) {
  if (agent === 'ui-check') return false; // Summary has no reliable changed-page manifest; a pass may cover different pages.
  if (agent !== 'reader') return true;
  const scores = text => [...String(text).matchAll(/\b((?:[a-z0-9-]+\/)?\d\d-[a-z0-9-]+\.html)\s+(\d+(?:\.\d+)?)\/10\b/g)];
  const low = scores(before.summary).filter(m => +m[2] < 8), fresh = scores(after.summary);
  if (!low.length || !fresh.length || after.detailTruncated) return false;
  return low.every(old => fresh.some(next => next[1] === old[1] && +next[2] >= 8 && +next[2] <= 10));
}
// Each process makes at most four optional GitHub API reads per ten minutes, shared across concurrent requests.
// Raw branch files are separately cached (status: 60 seconds; reader details: ten minutes). Failures cache too.
function createHandler({ fetch: fetcher = (...args) => fetch(...args), now = Date.now, timeoutMs = 4500 } = {}) {
  const caches = new Map();
  async function request(url, limit = timeoutMs) {
    const controller = new AbortController(), fetchedAt = now(); let timer;
    try {
      return await Promise.race([(async () => {
        const r = await fetcher(url, { headers: { 'user-agent': 'tx-learns-status', accept: 'application/vnd.github+json' }, signal: controller.signal, redirect: 'error' });
        if (r.redirected || !r.ok) return { ok: false, status: r.status };
        if (+r.headers.get('content-length') > MAX_BYTES) throw new Error('Response too large');
        const reader = r.body.getReader(); let length = 0; const chunks = [];
        while (true) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength;
          if (length > MAX_BYTES) { await reader.cancel(); throw new Error('Response too large'); } chunks.push(Buffer.from(value)); }
        return { ok: true, data: JSON.parse(Buffer.concat(chunks).toString('utf8')), fetchedAt, resolvedAt: now(), paginated: /rel="next"/.test(r.headers.get('link') || '') };
      })(), new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Timed out')); }, limit); })]);
    } catch { return { ok: false }; } finally { clearTimeout(timer); controller.abort(); }
  }
  return async function handler(req, res) {
    const time = now(), checkedAt = new Date(time).toISOString();
    res.setHeader('content-type', 'application/json; charset=utf-8');
    const attention = { checkedAt, complete: true, items: [] };
    const send = body => res.end(JSON.stringify({ ...body, attention }));
    try {
      const repo = repository();
      if (!caches.has(repo)) { if (caches.size >= 4) caches.clear(); caches.set(repo, { values: new Map(), start: time, count: 0 }); }
      const cache = caches.get(repo);
      if (time - cache.start >= EXTRA_TTL) { cache.start = time; cache.count = 0; }
      const deadline = Date.now() + 8000; // Bound total endpoint latency even when several optional services hang.
      const get = async (path, api = false, ttl = EXTRA_TTL) => {
        const url = api ? `https://api.github.com/repos/${repo}${path}` : `https://raw.githubusercontent.com/${repo}/agent-status/${path}`;
        let record = cache.values.get(url);
        if (!record || record.expires <= time) {
          const remaining = deadline - Date.now(); if (remaining <= 0) return { ok: false };
          if (api && cache.count >= 4) return { ok: false };
          if (api) cache.count++;
          if (cache.values.size >= 40) for (const [key, value] of cache.values) if (value.expires <= time) cache.values.delete(key);
          record = { expires: time + ttl, promise: request(url, Math.min(timeoutMs, remaining)) }; cache.values.set(url, record);
        }
        const result = await record.promise;
        if (result.ok && Number.isFinite(result.fetchedAt)) attention.checkedAt = new Date(Math.min(Date.parse(attention.checkedAt), result.fetchedAt)).toISOString();
        return result;
      };
      const raw = await get('status/all.json', false, 60000);
      if (raw.status === 404) { attention.complete = false; res.setHeader('cache-control', 's-maxage=30'); return send({ connected: true, agents: {}, reason: 'not-found' }); }
      if (!raw.ok || !object(raw.data) || !object(raw.data.agents)) throw new Error('Unavailable status');
      const data = raw.data, view = publicView(data, repo, time), candidates = [];
      if (!Object.keys(view.agents).length) attention.complete = false;
      for (const agent of AGENTS) {
        const a = data.agents[agent]; if (!object(a)) continue;
        const history = Array.isArray(a.history) ? a.history : [];
        if (history.length > EVIDENCE || history.some(e => !entry(e, repo, time))) attention.complete = false;
        const events = [a, ...history.slice(0, EVIDENCE)].map(e => {
          const safe = entry(e, repo, time); return safe && { ...safe, summary: plain(e.summary), detailTruncated: plain(e.summary, 64000).length > 400 };
        }).filter(Boolean).sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
        const unique = [...new Map(events.map(e => [`${e.at}:${e.state}:${e.link || ''}`, e])).values()];
        const seen = new Set();
        for (const e of unique.filter(e => e.state === 'flag' || e.state === 'fail')) {
          const s = source(e.link, repo), scope = s?.scope || 'unscoped'; if (seen.has(scope)) continue; seen.add(scope);
          const item = diagnosticItem(agent, e, repo, checkedAt), current = unique[0]?.at === e.at;
          item.historical = !current;
          if (!current || !s || time - Date.parse(e.at) > 8 * 86400000) unknown(item);
          candidates.push({ item, e, a, events: unique, s, files: pathsIn(e.summary), current });
        }
        const invalid = (a.state || a.at) && !entry(a, repo, time);
        const nowAt = iso(a.now?.at, time), stale = a.now && (!nowAt || time - Date.parse(nowAt) >= FRESH);
        const staleResult = (a.state || a.at) && !a.now && (!iso(a.at, time) || time - Date.parse(a.at) > 8 * 86400000);
        if (invalid || stale || staleResult) {
          attention.complete = false;
          const item = diagnosticItem(agent, { state: stale ? 'run' : 'skip', at: checkedAt, summary: '', link: a.now?.link || a.link }, repo, checkedAt, ':unknown');
          item.title = stale || staleResult ? pair('Run status needs checking', '需要核实运行状态') : pair('No usable result was recorded', '没有可用的运行结果');
          item.impact = pair('The last result cannot confirm what is happening now.', '上次记录无法确认当前情况。');
          unknown(item, pair('Open the run to check whether it stopped or is still running.', '打开任务确认它已停止，还是仍在运行。')); attention.items.push(item);
        }
      }
      // A daily green quality scan never erases the separate, still-open weekly issue.
      const issues = await get('/issues?state=open&creator=github-actions%5Bbot%5D&per_page=30', true);
      if (!issues.ok || !Array.isArray(issues.data) || issues.paginated || issues.data.some(q => !object(q))) attention.complete = false;
      const quality = Array.isArray(issues.data) && issues.data.find(q => object(q) && q.state === 'open' && q.title === 'Quality check' && !q.pull_request && q.user?.login === 'github-actions[bot]' && source(q.html_url, repo)?.type === 'issues');
      const qualityStatus = entry(data.agents.quality, repo, time);
      const qualitySnapshotOld = qualityStatus && Date.parse(qualityStatus.at) > (issues.fetchedAt || 0);
      if (qualitySnapshotOld) attention.complete = false;
      if (quality) {
        if (String(quality.number) !== source(quality.html_url, repo)?.number) attention.complete = false;
        const finding = findings(quality.body, true), at = iso(quality.updated_at, time);
        const failed = /check itself could not finish/i.test(quality.body || '');
        const e = { state: failed ? 'fail' : 'flag', at: at || checkedAt, link: quality.html_url, summary: finding.text || 'The weekly check has an open report; inspect it for details.' };
        const item = diagnosticItem('quality', e, repo, checkedAt);
        if (!finding.text || !at) { unknown(item); attention.complete = false; }
        item.detailTruncated = finding.truncated;
        if (failed) item.impact = pair('The weekly check did not finish; its findings may be incomplete.', '每周检查未完成，已报告的问题可能不完整。');
        // Never trade a newer daily/weekly finding for an older cached issue. A daily problem is a separate scope.
        const dailyCandidate = candidates.find(c => c.item.agent === 'quality' && c.current && c.e.state === 'flag' && /^Daily scan:/i.test(c.e.summary));
        let cleanDailyAt = '';
        if (dailyCandidate && !qualitySnapshotOld) {
          const result = await get('signals/daily.json'), daily = result.data, dailyAt = iso(daily?.at, time);
          if (!result.ok || !object(daily) || !dailyAt) attention.complete = false;
          else if (daily.state === 'ok' && Date.parse(dailyCandidate.e.at) >= Date.parse(dailyAt) && Date.parse(dailyCandidate.e.at) - Date.parse(dailyAt) <= 5 * 60000
            && ['readers', 'smoke', 'drift', 'speed'].every(k => object(daily[k]) && (daily[k].ok === true || daily[k].skipped === true))) cleanDailyAt = dailyCandidate.e.at;
          else if (result.fetchedAt < Date.parse(dailyCandidate.e.at)) { attention.complete = false; unknown(dailyCandidate.item); }
          if (!cleanDailyAt && !/(?:could not|failed|broken|no longer|not install|does not|did not|problem)/i.test(dailyCandidate.e.summary)) unknown(dailyCandidate.item);
        }
        const onlyWeeklyMirror = c => c.e.at === cleanDailyAt;
        const issueRun = (String(quality.body || '').match(/https:\/\/github\.com\/[^\s<>"')]+/g) || []).map(link => source(link, repo)).find(s => s?.type === 'actions/runs');
        if (!qualitySnapshotOld) candidates.splice(0, candidates.length, ...candidates.filter(c => c.item.agent !== 'quality' || c.e.state === 'fail'
          || !(onlyWeeklyMirror(c) || (issueRun && c.s?.scope === issueRun.scope))));
        if (qualitySnapshotOld) { item.historical = true; unknown(item, pair('A newer quality result exists. Open the report; this cached issue cannot confirm its current contents or repair.', '已有更新的质量检查结果；打开报告确认，缓存中的旧问题无法证明当前内容或修复状态。')); }
        candidates.push({ item, e, s: source(e.link, repo), events: [], a: {}, files: finding.files, fingerprints: finding.fingerprints, current: !qualitySnapshotOld, quality: true, staleEvidence: !!qualitySnapshotOld,
          evidenceAt: Math.max(Date.parse(e.at), Date.parse(qualityStatus?.at) || 0) });
      } else if (!issues.ok || !Array.isArray(issues.data) || issues.paginated || issues.data.some(q => !object(q))) {
        for (const c of candidates.filter(c => c.item.agent === 'quality')) unknown(c.item);
      }
      // Reader scores are already scrubbed public data. Bind only matching lessons from the recorded run, not arbitrary newer scores.
      const reader = candidates.find(c => c.item.agent === 'reader' && c.current && c.e.state === 'flag');
      if (reader) {
        const scores = await get('signals/reader.json');
        if (!scores.ok || !object(scores.data?.lessons)) attention.complete = false;
        else {
          const found = Object.entries(scores.data.lessons).filter(([file, v]) => /^[a-z0-9-]+\/\d\d-[a-z0-9-]+\.html$/.test(file) && object(v) && Number.isFinite(v.score) && v.score < 8 && v.score >= 0 && iso(v.at, time)
            && Date.parse(reader.e.at) >= Date.parse(v.at) && Date.parse(reader.e.at) - Date.parse(v.at) < FRESH && reader.e.summary.includes(file.split('/').pop()));
          if (found.length) {
            const text = found.map(([file, v]) => `${file}: ${v.score}/10. ${(Array.isArray(v.confusing) ? v.confusing : []).slice(0, 3).map(c => `${plain(c?.where, 60)}: ${plain(c?.why, 200)}`).join(' ')}`).join(' ');
            reader.item.detail = plain(text); reader.files = found.map(([file]) => file);
            reader.fingerprints = found.flatMap(([, v]) => (Array.isArray(v.confusing) ? v.confusing : []).slice(0, 3).map(c => normalized(c?.why)).filter(s => s.length >= 18));
            reader.item.detailTruncated = text.length > 400;
          }
        }
      }
      const ui = candidates.find(c => c.item.agent === 'ui-check' && c.current && c.e.state === 'flag' && c.s?.comment);
      if (ui) {
        const path = ui.s.type === 'commit' ? `/comments/${ui.s.comment}` : `/issues/comments/${ui.s.comment}`;
        const report = await get(path, true), comment = report.data;
        if (!report.ok || !object(comment) || comment.user?.login !== 'github-actions[bot]' || comment.html_url !== ui.s.url || !String(comment.body).startsWith('<!-- tx-ui-check -->')) attention.complete = false;
        else {
          const found = findings(comment.body, false);
          if (found.text) { ui.item.detail = found.text; ui.files = found.files; ui.item.title = titleFor('ui-check', 'flag', found.text); }
          else attention.complete = false;
          ui.item.detailTruncated = found.truncated;
        }
      }
      // Only known improver output links are candidates. Confirm GitHub state, origin and explicit problem scope.
      const repairTargets = candidates.filter(c => ['quality', 'reader'].includes(c.item.agent));
      const repairSince = Math.min(...repairTargets.flatMap(c => [Date.parse(c.e.at), ...c.events.filter(e => ['flag', 'fail'].includes(e.state) && source(e.link, repo)?.scope === c.s?.scope).map(e => Date.parse(e.at))]));
      const allRepairIds = [...new Set([data.agents.improver, ...(Array.isArray(data.agents.improver?.history) ? data.agents.improver.history.slice(0, EVIDENCE) : [])]
        .filter(e => e?.state === 'ok' && iso(e.at, time) && Date.parse(e.at) >= repairSince)
        .map(e => source(e?.link, repo)).filter(s => s?.type === 'pull').map(s => s.number))];
      if (allRepairIds.length > 2) attention.repairSearchLimited = true;
      const repairIds = allRepairIds.slice(0, 2);
      const repairs = [];
      for (const id of repairIds) {
        const result = await get(`/pulls/${id}`, true), pr = result.data;
        if (!result.ok || !object(pr) || !['open', 'closed'].includes(pr.state) || typeof pr.draft !== 'boolean' || !iso(pr.created_at, time)) { attention.complete = false; continue; }
        if (String(pr.number) !== id || source(pr.html_url, repo)?.scope !== `https://github.com/${repo}/pull/${id}` || pr.head?.repo?.full_name !== repo || pr.base?.repo?.full_name !== repo || !/^improver\//.test(pr.head?.ref || '')) { attention.complete = false; continue; }
        if (pr.state !== 'open' || pr.draft !== false || pr.merged_at) continue;
        const body = String(pr.body || '').split(/\n---\s*\n/)[0];
        const problem = /(?:^|\n)#{0,4}\s*Problem:?\s*([\s\S]*?)(?=\n#{0,4}\s*(?:Change|Check):|$)/i.exec(body)?.[1] || '';
        if (problem && iso(pr.created_at, time)) repairs.push({ pr, body, problem, fetchedAt: result.fetchedAt });
      }
      for (const c of candidates) {
        const { item, e, s } = c;
        if (c.current && item.kind === 'action') item.next = guidanceFor(item);
        const later = c.events.find(x => Date.parse(x.at) > Date.parse(e.at) && passing(item.agent, x) && coversFinding(item.agent, e, x) && source(x.link, repo)?.scope === s?.scope);
        const running = iso(c.a.now?.at, time), runSource = source(c.a.now?.link, repo);
        const sameNow = running && time - Date.parse(running) < FRESH && Date.parse(running) > Date.parse(e.at) && runSource?.scope === s?.scope;
        let recovered = later && s?.type === 'pull', rechecking = sameNow && s?.type === 'pull' && CHECKERS.has(item.agent);
        if (!c.quality && s?.type === 'actions/runs' && (later || sameNow) && CHECKERS.has(item.agent)) {
          const result = await get(`/actions/runs/${s.number}`, true), run = result.data;
          if (!result.ok || !object(run) || !Number.isInteger(run.run_attempt) || !iso(run.run_started_at, time) || source(run.html_url, repo)?.scope !== s.scope) attention.complete = false;
          else if (result.fetchedAt >= Math.max(Date.parse(e.at), Date.parse(later?.at) || 0, Date.parse(running) || 0) && run.run_attempt > 1 && Date.parse(run.run_started_at) > Date.parse(e.at)) {
            recovered = !!later && run.status === 'completed' && run.conclusion === 'success';
            rechecking = !!sameNow && ['queued', 'in_progress'].includes(run.status);
          } else if (result.fetchedAt < Math.max(Date.parse(e.at), Date.parse(later?.at) || 0, Date.parse(running) || 0)) { attention.complete = false; unknown(item); }
        }
        if (recovered && !(item.agent === 'quality' && quality)) {
          item.kind = 'resolved'; item.state = 'ok'; item.at = later.at; item.title = pair('The same change passed a later check', '同一项改动的后续检查已通过');
          item.impact = pair('This report has a matching later pass; it does not clear unrelated reports.', '这份报告已有对应的后续通过记录，不代表其他问题也已解决。');
          item.owner = pair('Confirmed by this agent', '该 agent 已确认'); item.next = pair('No action for this report; the matching recheck passed.', '这份报告无需再操作；对应复查已通过。');
          item.links.push({ url: later.link, label: pair('Open the passing check', '打开通过的检查') });
        } else if (rechecking) {
          item.kind = 'auto'; item.owner = pair('This agent is rechecking', '该 agent 正在复查');
          item.next = pair('Wait for this exact recheck; a fix is not yet confirmed.', '等待这次对应复查；尚未确认已修好。');
          item.links.push({ url: runSource.url, label: pair('Watch the recheck', '查看复查进展') });
        } else if (['quality', 'reader'].includes(item.agent) && c.files.length && !c.staleEvidence) {
          const staleRepair = repairs.some(repair => repair.fetchedAt < (c.evidenceAt || Date.parse(e.at)));
          if (staleRepair) { attention.complete = false; unknown(item, pair('The report is newer than the repair status. Open the PR to confirm who is handling it.', '报告比修复状态更新；打开 PR 核实是否仍有人处理。')); }
          const repair = repairs.find(repair => matchesRepair(c, repair, repo));
          if (repair) {
            item.kind = 'auto'; item.owner = pair('Improvement engineer agent', '持续改进工程师 agent');
            item.next = pair('A matching repair PR is open. Wait for its checks; the problem is not confirmed fixed yet.', '已确认有对应的修复 PR，等待它通过检查；尚未确认问题已解决。');
            item.links.push({ url: repair.pr.html_url, label: pair('View the repair PR', '查看修复 PR') });
          }
        }
        if (item.historical && item.kind !== 'resolved') {
          item.impact = pair('This is an earlier report; its impact on the current site or PR is not confirmed.', '这是较早的报告；尚未确认它是否仍影响当前网站或 PR。');
        }
        item.links = [...new Map(item.links.map(link => [link.url, link])).values()];
        attention.items.push(item);
      }
      const order = { action: 0, auto: 1, unknown: 2, resolved: 3 };
      attention.items.sort((a, b) => Number(a.historical) - Number(b.historical) || order[a.kind] - order[b.kind] || Date.parse(b.at) - Date.parse(a.at));
      if (attention.items.length > 24) { attention.items.length = 24; attention.complete = false; }
      res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=60');
      return send({ connected: true, ...view });
    } catch {
      attention.complete = false; res.statusCode = 502; res.setHeader('cache-control', 'no-store');
      return send({ connected: false, agents: {}, reason: 'error' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
