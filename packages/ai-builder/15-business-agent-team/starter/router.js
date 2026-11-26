// Fill in RULES and route, then run: node test_router.js
// route(text) returns { agent, approval }:
//   agent    'billing', 'booking' or 'knowledge', else 'human'
//   approval true when a person must approve first
// Put the riskiest topics first, so one request never matches a softer rule.
const RULES = [];

function route(text) {
  throw new Error('not written yet');
}

module.exports = { route, RULES };
