// Fill in the two functions, then run: node test_rebalance.js
// holdings: [{ symbol, qty, price }]   targets: { symbol: share between 0 and 1 }

function drift(holdings, targets) {
  // Return one row per holding: { symbol, weight, target, gap, trade }
  //   weight = its value / total value, rounded to 3 decimals
  //   gap    = weight - target
  //   trade  = dollars to buy (+) or sell (-) to reach the target
  throw new Error('not written yet');
}

function breaches(rows, limit) {
  // Keep only the rows whose gap is bigger than limit, up or down.
  throw new Error('not written yet');
}

module.exports = { drift, breaches };
