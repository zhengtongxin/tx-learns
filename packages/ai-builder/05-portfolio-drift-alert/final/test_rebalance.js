const assert = require('assert');
const { drift, breaches } = require('./rebalance.js');

const holdings = JSON.parse(require('fs').readFileSync(__dirname + '/portfolio.json', 'utf8'));
const targets = { 'WORLD-ETF': 0.5, 'BOND-FUND': 0.3, 'SGX-IDX': 0.2 };

const rows = drift(holdings, targets);
const hit = breaches(rows, 0.05);

assert.strictEqual(hit.length, 1, 'only one holding is more than 5 points off');
assert.strictEqual(hit[0].symbol, 'WORLD-ETF');
assert.strictEqual(hit[0].trade, 1200, 'buy 1,200 dollars of WORLD-ETF');
assert.strictEqual(breaches(rows, 0.5).length, 0, 'a wide limit gives no alert');
assert.strictEqual(drift([], targets).length, 0, 'no holdings, no rows');
assert.ok(drift([{ symbol: 'X', qty: 0, price: 1 }], { X: 1 })[0].weight === 0, 'zero total stays 0');
console.log('ok: drift and breaches behave (WORLD-ETF is 8.3 points under target)');
