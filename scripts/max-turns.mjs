#!/usr/bin/env node
// Picks --max-turns for an agent from what it really used: the 95th percentile of turns over its recent successful calls
// (trace/runs.json on the agent-status branch, written by scripts/trace.mjs) plus a margin. Prints one number.
//   node scripts/max-turns.mjs <agent> <ceiling> [--step review] [--floor 12] [--runs /tmp/runs.json]
// The ceiling is the old fixed limit: the answer never goes above it. With fewer than 15 successful calls, or no file,
// the ceiling is used, so a new agent is never starved. Margin: 25% plus 3 turns.
import { readFileSync } from 'node:fs';
import { arg } from './lib.mjs';

const [agent, ceilingRaw] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const ceiling = Math.max(1, +ceilingRaw || 30), floor = +arg('floor', 12), step = arg('step', '');
let runs = [];
try { runs = JSON.parse(readFileSync(arg('runs', '/tmp/runs.json'), 'utf8')).runs || []; } catch { /* no history yet */ }
const turns = runs.filter(r => r.agent === agent && r.ok && r.end === 'success' && (!step || (r.step || 'main') === step)).map(r => +r.turns).filter(n => n > 0).sort((a, b) => a - b);
if (turns.length < 15) { console.log(ceiling); process.exit(0); }
const p95 = turns[Math.min(turns.length - 1, Math.ceil(0.95 * turns.length) - 1)];
const pick = Math.min(ceiling, Math.max(floor, Math.ceil(p95 * 1.25) + 3));
console.error(`max-turns ${agent}${step ? '/' + step : ''}: ${turns.length} calls, p95 ${p95}, margin 25% + 3 -> ${pick} (ceiling ${ceiling})`);
console.log(pick);
