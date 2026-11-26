// Vercel function for the two anonymous reader signals the site keeps (nothing else is recorded anywhere):
//   "Was this lesson clear?"  yes / no, from the line at the end of every lesson
//   a lesson was finished     the reader reached its end
// POST /api/feedback  {"event":"feedback","lesson":"<track>/<NN-slug>.html","answer":"yes"|"no"}  or  {"event":"done","lesson":...}
// GET  /api/feedback  the counts per lesson for the last 14 days: {"days":14,"lessons":{"<lesson>":{"yes":2,"no":1,"done":7}}}
// Storage is a private Vercel Blob store connected to this project (BLOB_READ_WRITE_TOKEN is set by Vercel, never in the repo).
// Each signal is one tiny blob whose NAME holds everything: <prod|test>/<day>/<track>~<lesson>~<yes|no|done>~<random>.
// So counting only lists names and never opens a blob, and nothing about the reader is kept: no address, no id, no text.
// Only production counts ("prod"); preview deployments write to "test", which is never read back.
// The answer to GET is public on purpose (plain counts), so the daily scan needs no token to read it.
const { put, list } = require('@vercel/blob');

const LESSON = /^[a-z][a-z0-9-]{1,30}\/\d\d-[a-z0-9-]{1,80}\.html$/;
const DAYS = 14;
const DAY_CAP = 1000; // signals kept per day; past that the day is full, so a flood cannot fill the store
const ENV = process.env.VERCEL_ENV === 'production' ? 'prod' : 'test';
const dayOf = t => new Date(t).toISOString().slice(0, 10);

function kindOf(b) {
  if (!b || typeof b !== 'object' || typeof b.lesson !== 'string' || !LESSON.test(b.lesson)) return '';
  if (b.event === 'done') return 'done';
  if (b.event === 'feedback' && (b.answer === 'yes' || b.answer === 'no')) return b.answer;
  return '';
}
// "<env>/<day>/<track>~<file>~<kind>~<random>" -> { lesson, kind }, or null for a name this function did not write
function parseName(pathname) {
  const m = String(pathname).split('/').pop().match(/^([a-z][a-z0-9-]*)~(\d\d-[a-z0-9-]+\.html)~(yes|no|done)~[a-z0-9]+$/);
  return m ? { lesson: `${m[1]}/${m[2]}`, kind: m[3] } : null;
}
function tally(names) {
  const lessons = {};
  for (const n of names) { const p = parseName(n); if (!p) continue; (lessons[p.lesson] ||= { yes: 0, no: 0, done: 0 })[p.kind]++; }
  return lessons;
}

module.exports = async (req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  try {
    if (req.method === 'POST') {
      // Only the site's own pages may write.
      const origin = req.headers.origin;
      if (origin) { let h = ''; try { h = new URL(origin).host; } catch {} if (h !== req.headers.host) { res.statusCode = 403; return res.end('{"ok":false}'); } }
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body.slice(0, 400)); } catch { body = null; } }
      const kind = kindOf(body);
      if (!kind) { res.statusCode = 400; return res.end('{"ok":false}'); }
      const prefix = `${ENV}/${dayOf(Date.now())}/`;
      const today = await list({ prefix, limit: DAY_CAP });
      if (today.hasMore || today.blobs.length >= DAY_CAP) { res.statusCode = 429; return res.end('{"ok":false}'); }
      const name = `${prefix}${body.lesson.replace('/', '~')}~${kind}~${Math.random().toString(36).slice(2, 12)}`;
      await put(name, '1', { access: 'private', addRandomSuffix: false, contentType: 'text/plain' });
      res.statusCode = 200; res.setHeader('cache-control', 'no-store');
      return res.end('{"ok":true}');
    }
    if (req.method !== 'GET') { res.statusCode = 405; return res.end('{"ok":false}'); }
    const names = [];
    for (let i = 0; i < DAYS; i++) {
      const r = await list({ prefix: `prod/${dayOf(Date.now() - i * 864e5)}/`, limit: DAY_CAP });
      for (const b of r.blobs) names.push(b.pathname);
    }
    res.statusCode = 200; res.setHeader('cache-control', 'public, max-age=0, s-maxage=600');
    return res.end(JSON.stringify({ days: DAYS, lessons: tally(names), updated: new Date().toISOString() }));
  } catch (e) {
    // Never show a reader an error for this: the page does not wait for the answer.
    res.statusCode = 200; res.setHeader('cache-control', 'no-store');
    return res.end(JSON.stringify({ ok: false, days: DAYS, lessons: {}, note: 'feedback store not reachable' }));
  }
};
module.exports.kindOf = kindOf; module.exports.parseName = parseName; module.exports.tally = tally;
