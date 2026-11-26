// Pick which helper handles a request, and whether a person must approve first.
// Riskier topics come first, so "refund the booking" goes to billing.
const RULES = [
  { agent: 'billing', words: ['refund', 'charged', 'invoice', 'receipt'], approval: true },
  { agent: 'booking', words: ['book', 'reschedule', 'cancel', 'trial lesson'], approval: true },
  { agent: 'knowledge', words: ['fee', 'fees', 'price', 'hours', 'open', 'where', 'subject'], approval: false },
];

function route(text) {
  // Match whole words only: "feels" must not match "fee".
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (const rule of RULES) {
    if (rule.words.some(w => t.includes(' ' + w + ' '))) {
      return { agent: rule.agent, approval: rule.approval };
    }
  }
  return { agent: 'human', approval: true }; // anything unknown goes to a person
}

module.exports = { route, RULES };
