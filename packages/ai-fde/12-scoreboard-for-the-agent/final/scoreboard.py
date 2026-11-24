# scoreboard.py: a held-out set, a scored run, saved runs and a comparison (Steps 1 to 4 and 6).
import json
import os
import random
import threading
from datetime import datetime

from bench import claims, key, small_prompt, ask, gateway, PRICE
from scoring import matrix, accuracy, mistakes, mistake_cost, kappa, straight_through


# Step 1: a held-out set, chosen once and saved so it never changes
def load_held_out(path="data/held_out_ids.json"):
    if os.path.exists(path):                     # already chosen: never choose again
        return set(json.load(open(path)))
    ids = sorted(c["id"] for c in claims)
    random.Random(7).shuffle(ids)
    held = sorted(ids[:10])
    json.dump(held, open(path, "w"))
    return set(held)


HELD_OUT = load_held_out()
held_claims = [c for c in claims if c["id"] in HELD_OUT]

# Step 2: record cost and working time
MODEL = "openai/gpt-5.4-mini"


def run_claim(claim):
    """Run the agent on one claim and note every call it makes."""
    decision, tin, tout, secs = ask(gateway, MODEL, small_prompt(claim))
    events = [{"kind": "model", "secs": secs, "tin": tin, "tout": tout}]
    return decision, events


def working_secs(events):
    return sum(e["secs"] for e in events if e["kind"] != "human_wait")   # waiting for a person does not count


def cost_us(events):
    price_in, price_out = PRICE[MODEL]
    return sum(e.get("tin", 0) * price_in + e.get("tout", 0) * price_out for e in events) / 1_000_000


# Step 3: score a run
def score_run(results):
    """results: one {"id", "decision", "events"} per claim."""
    pairs = [(key[r["id"]]["action"], r["decision"]["action"]) for r in results]
    grid = matrix(pairs)
    n = len(results)
    return {"claims": n,
            "agreement": accuracy(grid),
            "mistakes": mistakes(grid),
            "mistake_cost_sgd": mistake_cost(grid),
            "straight_through": straight_through(grid),
            "kappa": kappa(grid),
            "cost_per_claim_usd": sum(cost_us(r["events"]) for r in results) / n,
            "secs_per_claim": sum(working_secs(r["events"]) for r in results) / n}


# Step 4: run it, and keep every run as its own file
RUNS = "runs"
os.makedirs(RUNS, exist_ok=True)
_lock = threading.Lock()


class Busy(Exception):
    pass


def run_evaluation(label):
    if not _lock.acquire(blocking=False):       # someone else is already running one
        raise Busy("an evaluation is already running")
    try:
        results = []
        for claim in held_claims:
            decision, events = run_claim(claim)
            results.append({"id": claim["id"], "decision": decision, "events": events})
        now = datetime.now()
        report = {"label": label, "model": MODEL, "at": now.isoformat(timespec="seconds"),
                  "scores": score_run(results)}
        name = now.strftime("%Y%m%d-%H%M%S-%f") + ".json"   # added: %f (microseconds), so two quick runs never share a name
        json.dump(report, open(os.path.join(RUNS, name), "w"), indent=2)
        return name, report
    finally:
        _lock.release()


def list_runs():
    return [{**json.load(open(os.path.join(RUNS, n))), "run": n} for n in sorted(os.listdir(RUNS))]


# Step 6: compare this run with an earlier one
HIGHER_IS_BETTER = {"agreement": True, "kappa": True, "straight_through": True,
                    "mistake_cost_sgd": False, "cost_per_claim_usd": False, "secs_per_claim": False}


def compare(old, new):
    worse = []
    for metric, higher in HIGHER_IS_BETTER.items():
        a, b = old["scores"][metric], new["scores"][metric]
        if a == b:
            verdict = "same"
        elif (b > a) == higher:
            verdict = "better"
        else:
            verdict = "WORSE"
            worse.append(metric)
        print(f"{metric:20} {a:10.4f} -> {b:10.4f}  {verdict}")
    return worse
