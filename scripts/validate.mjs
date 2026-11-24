#!/usr/bin/env node
// Structured output check: is this JSON what its schema says? A small subset of JSON Schema, no dependencies:
// type (object, array, string, number, integer, boolean), enum, required, properties, items, maxItems, maxLength.
//   node scripts/validate.mjs <schema.json> <data.json>     exit 0 when valid, 1 (and what is wrong) when not
// Also exports validate(schema, data) -> list of problems (empty = valid).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function validate(schema, data, path = '$') {
  const bad = [];
  const kind = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;
  const t = schema.type;
  if (t && !(t === kind || (t === 'integer' && Number.isInteger(data)))) return [`${path}: expected ${t}, got ${kind}`];
  if (schema.enum && !schema.enum.includes(data)) bad.push(`${path}: must be one of ${schema.enum.join(', ')}`);
  if (kind === 'string' && schema.maxLength && data.length > schema.maxLength) bad.push(`${path}: longer than ${schema.maxLength}`);
  if (kind === 'object') {
    for (const k of schema.required || []) if (!(k in data)) bad.push(`${path}.${k}: missing`);
    for (const [k, s] of Object.entries(schema.properties || {})) if (k in data) bad.push(...validate(s, data[k], `${path}.${k}`));
  }
  if (kind === 'array') {
    if (schema.maxItems && data.length > schema.maxItems) bad.push(`${path}: more than ${schema.maxItems} items`);
    if (schema.items) data.forEach((x, i) => bad.push(...validate(schema.items, x, `${path}[${i}]`)));
  }
  return bad;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [s, d] = process.argv.slice(2);
  if (!s || !d) { console.error('Usage: node scripts/validate.mjs <schema.json> <data.json>'); process.exit(2); }
  let problems;
  try { problems = validate(JSON.parse(readFileSync(s, 'utf8')), JSON.parse(readFileSync(d, 'utf8'))); }
  catch (e) { problems = [`not readable JSON: ${e.message.slice(0, 100)}`]; }
  if (problems.length) { console.log(problems.slice(0, 10).join('\n')); process.exit(1); }
  console.log('valid');
}
