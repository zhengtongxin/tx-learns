const assert = require('assert');
const { splitBill } = require('./split.js');

const items = [
  { name: 'noodles', cents: 600, who: ['Mei'] },
  { name: 'rice', cents: 500, who: ['Raj'] },
  { name: 'drinks', cents: 300, who: ['Mei', 'Raj'] },
];

const r = splitBill(items);
assert.strictEqual(r.total, 1679);                      // 1400 + 10% service, then 9% GST
assert.deepStrictEqual(r.shares, { Mei: 899, Raj: 780 });
assert.strictEqual(Object.values(r.shares).reduce((a, b) => a + b, 0), r.total);

// Three people share one dish: the leftover cent goes to someone, and it still adds up.
const three = splitBill([{ name: 'crab', cents: 1000, who: ['A', 'B', 'C'] }], { service: 0, gst: 0 });
assert.strictEqual(three.total, 1000);
assert.strictEqual(Object.values(three.shares).reduce((a, b) => a + b, 0), 1000);

// A dish nobody shares is an error.
assert.throws(() => splitBill([{ name: 'ghost', cents: 100, who: [] }]), /Nobody/);

// Your own test goes here: for example, a dish eaten by one person only.

console.log('ok: splitBill adds up to the total in every case');
