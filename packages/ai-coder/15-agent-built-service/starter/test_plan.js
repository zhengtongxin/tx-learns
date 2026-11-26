const assert = require('assert');
const fs = require('fs');
const { planWaves } = require('./plan.js');

const tasks = JSON.parse(fs.readFileSync(__dirname + '/tasks.json', 'utf8'));
assert.deepStrictEqual(planWaves(tasks), [['store', 'readme'], ['add', 'list'], ['tests']]);

// Two tasks that share a file never share a wave.
const clash = [
  { id: 'a', deps: [], files: ['src/ui.js'] },
  { id: 'b', deps: [], files: ['src/ui.js'] },
];
assert.deepStrictEqual(planWaves(clash), [['a'], ['b']]);

// A circular dependency is refused before anything runs.
const loop = [
  { id: 'ui', deps: ['api'], files: ['u'] },
  { id: 'api', deps: ['ui'], files: ['a'] },
];
assert.throws(() => planWaves(loop), /Circular/);

// An unknown dependency is refused too.
assert.throws(() => planWaves([{ id: 'x', deps: ['nope'], files: [] }]), /Unknown dependency/);

console.log('ok: plan.js groups tasks into safe waves and refuses bad plans');
