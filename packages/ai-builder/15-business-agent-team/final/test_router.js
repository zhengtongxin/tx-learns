const assert = require('assert');
const { route } = require('./router.js');

const cases = [
  ['What are the fees for Primary 5 maths?', 'knowledge', false],
  ['Are you open on Saturday?', 'knowledge', false],
  ['I want to book a trial lesson', 'booking', true],
  ['Can I reschedule tomorrow\'s class?', 'booking', true],
  ['I was charged twice this month', 'billing', true],
  ['Please refund the booking I cancelled', 'billing', true],
  ['My son feels sad about school', 'human', true],
  ['', 'human', true],
  ['My son feels unhappy about school', 'human', true],
];

for (const [text, agent, approval] of cases) {
  const got = route(text);
  assert.strictEqual(got.agent, agent, `"${text}" should go to ${agent}, got ${got.agent}`);
  assert.strictEqual(got.approval, approval, `"${text}" approval should be ${approval}`);
}
console.log('ok: route sends ' + cases.length + ' test requests to the right helper');
