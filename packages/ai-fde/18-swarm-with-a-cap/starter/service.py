# service.py: a dispatch page, a run panel from records, a summary, a health check (all six steps).
# Start it with:  uvicorn service:app
import asyncio
import sqlite3
import time
import uuid

import openai   # added: to turn the provider's errors into the dispatcher's RateLimited / TimedOut
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from dispatcher import dispatch, RateLimited, TimedOut
from desk import load_claims, decide

app = FastAPI()
SIGNOFF_LIMIT = 800


# Step 1: the number is checked before any agent starts
class Start(BaseModel):
    n: int = Field(default=3, ge=1, le=25)          # 1 to 25 agents at once


# Step 3 + 6: a table with one row per claim per run, including cost and time
db = sqlite3.connect("runs.db", check_same_thread=False)
db.execute("""CREATE TABLE IF NOT EXISTS claim_runs (
    run TEXT, claim TEXT, status TEXT, action TEXT, payout REAL,
    PRIMARY KEY (run, claim))""")
for column in ("cost_usd REAL", "secs REAL", "started REAL", "finished REAL"):
    try:
        db.execute(f"ALTER TABLE claim_runs ADD COLUMN {column}")
    except sqlite3.OperationalError:
        pass                                  # the column is already there


def save(run, claim_id, **fields):          # fields: status, action, payout, cost_usd... set by our own code
    # TODO: insert the row if missing (status waiting), then update each given column; commit
    raise NotImplementedError("TODO: save")


# Step 2: only one dispatch at a time
current = None                       # the id of the run that is working, if any


async def run_dispatch(run, n):
    # TODO: define agent_for_run (call decide in a thread, map openai.RateLimitError to RateLimited and APITimeoutError to TimedOut, save the decision, cost and times), then await dispatch(); always set current back to None
    raise NotImplementedError("TODO: run_dispatch")


@app.post("/dispatch")
async def start(body: Start):
    # TODO: refuse with 409 if a dispatch is running; otherwise make a run id, set current, create the background task, return the run id
    raise NotImplementedError("TODO: start")


@app.get("/runs/{run}")
def panel(run: str):
    # TODO: return one dict per claim row of this run
    raise NotImplementedError("TODO: panel")


# Step 4: a finishing summary from records, not from a model
def count(run, where, *args):
    # TODO: COUNT(*) of this runs rows that match the extra condition
    raise NotImplementedError("TODO: count")


@app.get("/runs/{run}/summary")
def summary(run: str):
    # TODO: five counts: approved (<= S$800), waiting_signoff (> S$800), declined, referred, left_for_handler
    raise NotImplementedError("TODO: summary")


# Step 6: one run's totals, including its own run time
@app.get("/runs/{run}/totals")     # added: the lesson shows this as a SQL comment; here it is a route
def totals(run: str):
    # TODO: total cost, slowest claim, and run time (last finish minus first start)
    raise NotImplementedError("TODO: totals")


# Step 5: say so when the agent is not running
@app.get("/health")
def health():
    # TODO: say ok, and whether a dispatch is busy
    raise NotImplementedError("TODO: health")


PAGE = """<h1>Queue</h1>
<label>Agents at once <input id="n" type="number" min="1" max="25" value="3"></label>
<button id="go">Start dispatch</button> <p id="msg"></p>
<table id="panel" border="1" cellpadding="4"></table>
<pre id="summary"></pre>
<script>
fetch("/health").then(r => r.json()).catch(() => null).then(h => {
  if (!h) { go.disabled = true; msg.textContent = "The agent service is not running. Ask Kumar to start it."; }
  else if (h.busy) { msg.textContent = "A dispatch is already running."; }
});

// added: the small script the lesson says you write yourself. It asks /runs/{run} every two seconds.
async function poll(run) {
  const rows = await (await fetch("/runs/" + run)).json();
  panel.textContent = "";
  for (const r of rows) {
    const tr = panel.insertRow();
    for (const v of [r.claim, r.status, r.action || "", r.payout == null ? "" : "S$" + r.payout]) {
      tr.insertCell().textContent = v;       // textContent, never innerHTML
    }
  }
  const h = await (await fetch("/health")).json();
  if (rows.length && !h.busy) {
    summary.textContent = JSON.stringify(await (await fetch("/runs/" + run + "/summary")).json(), null, 2);
    go.disabled = false;
    return;
  }
  setTimeout(() => poll(run), 2000);
}

go.onclick = async () => {
  const r = await fetch("/dispatch", {method: "POST", headers: {"Content-Type": "application/json"},
                                      body: JSON.stringify({n: Number(n.value)})});
  msg.textContent = r.ok ? "Started." : "Could not start.";
  if (r.ok) { go.disabled = true; summary.textContent = ""; poll((await r.json()).run); }
};
</script>"""


@app.get("/", response_class=HTMLResponse)
def page():
    return PAGE
