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
    # TODO: if the file exists, load it; otherwise shuffle the ids with a fixed seed, keep 10, save them, return them as a set
    raise NotImplementedError("TODO: load_held_out")


HELD_OUT = load_held_out()
held_claims = [c for c in claims if c["id"] in HELD_OUT]

# Step 2: record cost and working time
MODEL = "openai/gpt-5.4-mini"


def run_claim(claim):
    """Run the agent on one claim and note every call it makes."""
    # TODO: call ask() once, return the decision and a list with one model event (kind, secs, tin, tout)
    raise NotImplementedError("TODO: run_claim")


def working_secs(events):
    # TODO: add up secs, skipping events of kind human_wait
    raise NotImplementedError("TODO: working_secs")


def cost_us(events):
    # TODO: tokens times PRICE[MODEL], in US$
    raise NotImplementedError("TODO: cost_us")


# Step 3: score a run
def score_run(results):
    """results: one {"id", "decision", "events"} per claim."""
    # TODO: build the confusion matrix and return agreement, mistakes, mistake cost, straight-through, kappa, cost and working time per claim
    raise NotImplementedError("TODO: score_run")


# Step 4: run it, and keep every run as its own file
RUNS = "runs"
os.makedirs(RUNS, exist_ok=True)
_lock = threading.Lock()


class Busy(Exception):
    pass


def run_evaluation(label):
    # TODO: take the lock or raise Busy; run every held-out claim; save the report as its own file in runs/; always release the lock
    raise NotImplementedError("TODO: run_evaluation")


def list_runs():
    # TODO: read every file in runs/ in name order
    raise NotImplementedError("TODO: list_runs")


# Step 6: compare this run with an earlier one
HIGHER_IS_BETTER = {"agreement": True, "kappa": True, "straight_through": True,
                    "mistake_cost_sgd": False, "cost_per_claim_usd": False, "secs_per_claim": False}


def compare(old, new):
    # TODO: for each metric print old -> new and better / same / WORSE; return the list of worse ones
    raise NotImplementedError("TODO: compare")
