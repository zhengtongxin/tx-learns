const assert = require('assert');
const { newState, recordUse, applyEvent, resetMonth } = require('./billing.js');

const s = newState();
for (let i = 0; i < 3; i++) assert.strictEqual(recordUse(s, 'shop1').ok, true);
assert.deepStrictEqual(recordUse(s, 'shop1'), { ok: false, reason: 'limit' });   // 4th use refused

resetMonth(s);
assert.strictEqual(recordUse(s, 'shop1').ok, true);                              // new month, new count

const up = { id: 'evt_1', account: 'shop1', plan: 'pro' };
assert.deepStrictEqual(applyEvent(s, up), { duplicate: false });
for (let i = 0; i < 50; i++) assert.strictEqual(recordUse(s, 'shop1').ok, true); // pro limit is 100

// The same event again changes nothing.
assert.deepStrictEqual(applyEvent(s, up), { duplicate: true });
assert.strictEqual(s.seen.length, 1);

// An unknown plan throws and changes nothing.
assert.throws(() => applyEvent(s, { id: 'evt_2', account: 'shop1', plan: 'gold' }), /Unknown plan/);
assert.strictEqual(s.accounts.shop1.plan, 'pro');
assert.strictEqual(s.seen.includes('evt_2'), false);

console.log('ok: limits hold and repeated billing events change nothing');
