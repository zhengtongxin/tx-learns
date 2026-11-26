// How far each holding has drifted from its target share.
// holdings: [{ symbol, qty, price }]   targets: { symbol: share between 0 and 1 }
function drift(holdings, targets) {
  const total = holdings.reduce((sum, h) => sum + h.qty * h.price, 0);
  return holdings.map(h => {
    const weight = total === 0 ? 0 : (h.qty * h.price) / total;
    const target = targets[h.symbol] ?? 0;
    return {
      symbol: h.symbol,
      weight: round(weight),
      target,
      gap: round(weight - target),
      trade: Math.round((target - weight) * total), // + buy, - sell, in dollars
    };
  });
}

function round(x) { return Math.round(x * 1000) / 1000; }

// Only the rows whose gap is bigger than the limit (for example 0.05 = 5 points).
function breaches(rows, limit) {
  return rows.filter(r => Math.abs(r.gap) > limit);
}

module.exports = { drift, breaches };
