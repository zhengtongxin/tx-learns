// TODO: the dashboard. Poll the read-only API every few seconds (setInterval) and draw it.
//   GET /api/roster               -> ["Wong", "Muthu", "AhKow", "Hamid"]
//   GET /api/portfolio/<name>     -> { name, value, cash, profit, holdings, strategy }
//   GET /api/history/<name>       -> [{ ts, value }, ...]   (draw a small line per uncle)
//   GET /api/logs?limit=60        -> [{ ts, who, type, message }, ...]  (the live log)
// Hint: put text from the agents in with textContent, never innerHTML, so it cannot run as code.
// Compare with final/frontend/src/main.ts when you are stuck.
const cards = document.getElementById("cards")!;
const logBox = document.getElementById("log")!;

async function refresh() {
  // TODO
  cards.textContent = "TODO";
  logBox.textContent = "TODO";
}

refresh();
setInterval(refresh, 3000);
