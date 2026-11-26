// Split a hawker-centre bill. Money is whole cents; shares always add up to the total.
function splitBill(items, options = {}) {
  const service = options.service ?? 0.10;
  const gst = options.gst ?? 0.09;
  const owed = {};
  let subtotal = 0;

  for (const item of items) {
    if (!item.who || item.who.length === 0) throw new Error(`Nobody is sharing "${item.name}"`);
    const base = Math.floor(item.cents / item.who.length);
    let extra = item.cents - base * item.who.length;
    for (const person of item.who) {
      owed[person] = (owed[person] || 0) + base + (extra-- > 0 ? 1 : 0);
    }
    subtotal += item.cents;
  }

  // Service charge first, then GST on both.
  const total = Math.round(subtotal * (1 + service) * (1 + gst));

  // Hand the total out in proportion, giving leftover cents to the biggest remainders.
  const people = Object.keys(owed);
  const shares = {};
  const rest = [];
  let given = 0;
  for (const p of people) {
    const exact = subtotal === 0 ? 0 : (total * owed[p]) / subtotal;
    shares[p] = Math.floor(exact);
    given += shares[p];
    rest.push([p, exact - shares[p]]);
  }
  rest.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < total - given; i++) shares[rest[i][0]] += 1;

  return { total, shares };
}

module.exports = { splitBill };
