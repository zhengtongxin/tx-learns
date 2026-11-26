// Plan limits and repeat-safe billing events. Plain functions, no network.
const PLANS = { free: { limit: 3 }, pro: { limit: 100 } };

function newState() {
  return { accounts: {}, seen: [] };
}

function account(state, id) {
  if (!state.accounts[id]) state.accounts[id] = { plan: 'free', used: 0 };
  return state.accounts[id];
}

// Returns { ok: true } or { ok: false, reason: 'limit' }.
function recordUse(state, id) {
  const a = account(state, id);
  if (a.used >= PLANS[a.plan].limit) return { ok: false, reason: 'limit' };
  a.used += 1;
  return { ok: true };
}

// A webhook event: { id, account, plan }. The same id may arrive twice.
function applyEvent(state, event) {
  if (state.seen.includes(event.id)) return { duplicate: true };
  if (!PLANS[event.plan]) throw new Error(`Unknown plan: ${event.plan}`);
  account(state, event.account).plan = event.plan;
  state.seen.push(event.id);
  return { duplicate: false };
}

function resetMonth(state) {
  for (const id of Object.keys(state.accounts)) state.accounts[id].used = 0;
}

module.exports = { PLANS, newState, recordUse, applyEvent, resetMonth };
