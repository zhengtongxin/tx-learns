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
    return [[(c["id"], *ask(gateway, model, small_prompt(c))) for c in claims]
            for _ in range(2)]


# Step 3: one row per model
def row(model, runs):
    price_in, price_out = CANDIDATES[model]
    tally = defaultdict(lambda: [0, 0])      # difficulty -> [right, total]
    cost = secs = 0
    big_wrong = 0
    for run in runs:
        for cid, decision, tin, tout, seconds in run:
            want = key[cid]
            tally[want["difficulty"]][0] += matches(decision, want)
            tally[want["difficulty"]][1] += 1
            cost += (tin * price_in + tout * price_out) / 1_000_000
            secs += seconds
            if (decision["action"] == "approve" and float(decision["payout"]) > SIGNOFF_LIMIT
                    and want["action"] != "approve"):
                big_wrong += 1
    n = sum(total for _, total in tally.values())
    return {"model": model,
            "by_level": {level: right / total for level, (right, total) in tally.items()},
            "cost_1000": cost / n * 1000, "secs": secs / n, "big_wrong": big_wrong}


# Step 4: a model must pass every line of the bar, not most of them
def clears(r):
    return (r["by_level"]["easy"] >= BAR["easy"]
            and r["big_wrong"] <= BAR["big_wrong"]
            and r["secs"] <= BAR["secs"])


# Step 5: the cheapest that clears the bar, plus a stronger fallback
def pick_cheapest(rows):
    passing = [r for r in rows if clears(r)]
    if not passing:
        raise SystemExit("nobody clears the bar: change the prompt, or talk to Mr Goh about the bar")
    return min(passing, key=lambda r: r["cost_1000"])["model"]


def decide_routed(claim, pick):
    # added: `pick` is passed in, because the lesson kept it as a top-level variable
    decision = ask(gateway, pick, small_prompt(claim))[0]
    if decision["action"] == "refer":          # the cheap model is unsure
        decision = ask(gateway, STRONG, small_prompt(claim))[0]
    return decision                            # a refer from the strong model still goes to a handler


# Step 6: the half-page for Mr Goh
# added: fills in the numbers for you; the words are still yours to improve
def memo(rows, pick):
    r = next(x for x in rows if x["model"] == pick)
    cleared = [x["model"] for x in rows if clears(x)]
    return f"""Model choice for the claims desk (draft for Mr Goh)

The bar we agreed: at least {BAR['easy']:.0%} right on easy claims, no wrongly
approved big payouts, at most {BAR['secs']:g} seconds a claim.

Our pick: {pick}. {len(cleared)} of {len(rows)} models cleared the bar and it is the cheapest of them:
{r['by_level']['easy']:.0%} on easy claims, {r['secs']:.1f} seconds, US${r['cost_1000']:.2f} per 1,000 claims.
Fallback: {STRONG} handles only the claims {pick} refers.

We will look again if: prices drop by half, a new model arrives, or
more than 1 in 10 claims has to go to the fallback."""


if __name__ == "__main__":
    rows = [row(model, run_twice(model)) for model in CANDIDATES]
    print(f"{'model':38} {'easy':>5} {'cost/1000':>10} {'secs':>5} {'big wrong':>9}")
    for r in rows:
        print(f"{r['model']:38} {r['by_level'].get('easy', 0):5.0%} {r['cost_1000']:10.2f} "
              f"{r['secs']:5.1f} {r['big_wrong']:9}  {'clears the bar' if clears(r) else 'does NOT clear the bar'}")
    pick = pick_cheapest(rows)
    print()
    print(memo(rows, pick))
