# choose_model.py: the project. Agree a bar, run the candidates, pick the cheapest that clears it.
from collections import defaultdict

from bench import claims, key, matches, small_prompt, ask, gateway

# Step 1: the bar, agreed with Mr Goh and Aisha BEFORE you see any score
SIGNOFF_LIMIT = 800           # S$, the same limit as the pilot's queue

BAR = {"easy": 0.90,          # matches the handlers on at least 90% of easy claims
       "big_wrong": 0,        # never approves a big payout the handlers did not approve
       "secs": 5.0}           # at most 5 seconds per claim, for a busy queue

# Step 2: the candidates
# US$ per million tokens: (input, output). Invented: copy your gateway's real list.
CANDIDATES = {
    "meta-llama/llama-3.3-70b-instruct": (0.10, 0.30),
    "openai/gpt-5.4-mini": (0.40, 1.60),
    "anthropic/claude-haiku-5-5": (1.00, 5.00),
    "anthropic/claude-sonnet-5-5": (3.00, 15.00)}

STRONG = "anthropic/claude-sonnet-5-5"


def run_twice(model):
    # TODO: run every claim through ask() with the gateway, twice, and return the two runs
    raise NotImplementedError("TODO: run_twice")


# Step 3: one row per model
def row(model, runs):
    # TODO: turn two runs into one row: accuracy by difficulty, cost per 1,000 claims, seconds per claim, big wrong approvals
    raise NotImplementedError("TODO: row")


# Step 4: a model must pass every line of the bar, not most of them
def clears(r):
    # TODO: True only if the model passes EVERY line of BAR
    raise NotImplementedError("TODO: clears")


# Step 5: the cheapest that clears the bar, plus a stronger fallback
def pick_cheapest(rows):
    # TODO: among the rows that clear the bar, return the cheapest model name; stop with a message if none do
    raise NotImplementedError("TODO: pick_cheapest")


def decide_routed(claim, pick):
    # added: `pick` is passed in, because the lesson kept it as a top-level variable
    # TODO: ask the cheap model first; only if it says refer, ask the strong one
    raise NotImplementedError("TODO: decide_routed")


# Step 6: the half-page for Mr Goh
# added: fills in the numbers for you; the words are still yours to improve
def memo(rows, pick):
    # TODO: fill the half-page memo with the numbers from the row of the pick
    raise NotImplementedError("TODO: memo")


if __name__ == "__main__":
    rows = [row(model, run_twice(model)) for model in CANDIDATES]
    print(f"{'model':38} {'easy':>5} {'cost/1000':>10} {'secs':>5} {'big wrong':>9}")
    for r in rows:
        print(f"{r['model']:38} {r['by_level'].get('easy', 0):5.0%} {r['cost_1000']:10.2f} "
              f"{r['secs']:5.1f} {r['big_wrong']:9}  {'clears the bar' if clears(r) else 'does NOT clear the bar'}")
    pick = pick_cheapest(rows)
    print()
    print(memo(rows, pick))
