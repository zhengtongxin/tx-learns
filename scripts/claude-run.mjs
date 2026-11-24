#!/usr/bin/env node
// Runs `claude -p` for an agent and keeps a trace of the call: model, turns, tokens, time and estimated cost.
//   node scripts/claude-run.mjs <agent> <the usual claude arguments>
// It behaves like `claude ... --output-format text`: the answer goes to stdout, the exit code is claude's. Any
// --output-format given is replaced (the trace needs claude's JSON result). One JSON line per call is appended to
// $TRACE_DIR/trace-<agent>.jsonl (default /tmp/out); a trusted job then sends it on with scripts/trace.mjs push.
// Workflows fetch this file from main, so a branch under review cannot change how its own run is measured.
// The cost is claude's own estimate at API prices: on TX's subscription nothing is billed per call, but the figure
// shows which agent uses the most of the plan.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [agent, ...raw] = process.argv.slice(2);
if (!agent) { console.error('Usage: node scripts/claude-run.mjs <agent> <claude args>'); process.exit(2); }
const args = [];
for (let i = 0; i < raw.length; i++) { if (raw[i] === '--output-format') { i++; continue; } args.push(raw[i]); }
const model = (args[args.indexOf('--model') + 1] || '').slice(0, 40);
const t0 = Date.now();
const r = spawnSync('claude', [...args, '--output-format', 'json'], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['inherit', 'pipe', 'inherit'] });
let j = null;
try { j = JSON.parse(r.stdout); if (Array.isArray(j)) j = j.filter(x => x && x.type === 'result').pop() || null; } catch { /* not JSON: show it as it is */ }
if (j && typeof j.result === 'string') process.stdout.write(j.result.endsWith('\n') ? j.result : j.result + '\n');
else if (!j && r.stdout) process.stdout.write(r.stdout);
else if (j && j.subtype) console.log(`(claude ended without an answer: ${j.subtype})`);

const n = v => (Number.isFinite(+v) ? +v : 0);
const u = (j && j.usage) || {};
const rec = {
  at: new Date().toISOString(), agent, model: model || 'default',
  usd: +n(j && j.total_cost_usd).toFixed(4), turns: n(j && j.num_turns), ms: n(j && j.duration_ms) || Date.now() - t0,
  in: n(u.input_tokens), out: n(u.output_tokens), cacheRead: n(u.cache_read_input_tokens), cacheWrite: n(u.cache_creation_input_tokens),
  ok: !!j && !j.is_error && r.status === 0, end: (j && j.subtype) || (r.error ? 'spawn_error' : 'no_json'),
  run: process.env.GITHUB_RUN_ID || '',
};
try {
  const dir = process.env.TRACE_DIR || '/tmp/out';
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, `trace-${agent}.jsonl`), JSON.stringify(rec) + '\n');
} catch (e) { console.error(`::warning::trace not written: ${e.message}`); }
console.error(`[trace] ${agent} ${rec.model}: ${rec.turns} turns, ${rec.in + rec.cacheRead + rec.cacheWrite} in / ${rec.out} out tokens, ${(rec.ms / 1000).toFixed(0)}s, ~$${rec.usd}`);
process.exit(r.status === null ? 1 : r.status);
