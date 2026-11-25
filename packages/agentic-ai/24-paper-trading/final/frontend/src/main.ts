// The dashboard asks the read-only API for new numbers every few seconds (polling).
// Text from the agents goes in with textContent, never innerHTML, so it cannot run as code.
type Portfolio = { name: string; value: number; cash: number; profit: number; holdings: Record<string, number>; strategy: string };
type Point = { ts: number; value: number };
type LogRow = { ts: number; who: string; type: string; message: string };

const cards = document.getElementById("cards")!;
const logBox = document.getElementById("log")!;

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

function sparkline(points: Point[]): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 40");
  svg.setAttribute("preserveAspectRatio", "none");
  if (points.length > 1) {
    const vs = points.map((p) => p.value);
    const lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
    const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${38 - ((p.value - lo) / span) * 36}`).join(" ");
    const line = document.createElementNS(ns, "polyline");
    line.setAttribute("points", d);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "1.5");
    svg.appendChild(line);
  }
  return svg;
}

function card(p: Portfolio, h: Point[]): HTMLElement {
  const el = document.createElement("div");
  el.className = "card";
  const title = document.createElement("h2");
  title.textContent = p.name;
  const money = document.createElement("div");
  money.textContent = `S$${p.value.toFixed(2)} `;
  const pl = document.createElement("span");
  pl.className = p.profit >= 0 ? "up" : "down";
  pl.textContent = `(${p.profit >= 0 ? "+" : ""}${p.profit.toFixed(2)})`;
  money.appendChild(pl);
  const held = document.createElement("div");
  held.textContent = "Holds: " + (Object.entries(p.holdings).map(([s, q]) => `${s} x${q}`).join(", ") || "nothing");
  const strat = document.createElement("small");
  strat.textContent = p.strategy;
  el.append(title, money, held, sparkline(h), strat);
  return el;
}

async function refresh() {
  try {
    const names = await get<string[]>("/api/roster");
    const built = await Promise.all(names.map(async (n) =>
      card(await get<Portfolio>(`/api/portfolio/${n}`), await get<Point[]>(`/api/history/${n}`))));
    cards.replaceChildren(...built);
    const rows = await get<LogRow[]>("/api/logs?limit=60");
    logBox.replaceChildren(...rows.map((r) => {
      const div = document.createElement("div");
      div.textContent = `${new Date(r.ts * 1000).toLocaleTimeString()} ${r.who} [${r.type}] ${r.message}`;
      return div;
    }));
  } catch (e) {
    logBox.textContent = `Cannot reach the API. Is uvicorn running on port 8000? (${e})`;
  }
}

refresh();
setInterval(refresh, 3000);
