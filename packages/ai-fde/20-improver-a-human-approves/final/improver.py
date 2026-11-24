# improver.py: an improver that proposes, a person who approves, code that decides (Steps 2 to 5).
import json
import os

from bench import gateway, claims, key, small_prompt, ask
from fake_model import DRY_RUN, fake_ask   # added: DRY_RUN=1 swaps the models for a stand-in
from scoreboard import HELD_OUT, held_claims
from scoring import matrix, accuracy, mistake_cost
from versions import load, save, find, active, FIELDS

IMPROVER = "anthropic/claude-sonnet-5-5"
practice = [c for c in claims if c["id"] not in HELD_OUT]     # the improver never sees held-out claims

# Step 2: the recipe, and the limits
DEFAULT_RECIPE = """1. Read the results on the practice claims and see where the agent differs from the handlers.
2. Propose ONE change to ONE of: instructions, model, effort. Say why.
3. Stop and wait for a person to approve.
4. Only after approval does code run the held-out evaluation.
5. Say in one sentence how this recipe could be better."""


def recipe():
    return open("recipe.txt").read() if os.path.exists("recipe.txt") else DEFAULT_RECIPE


class Busy(Exception):
    pass


def run_config(config, claim):
    prompt = config["instructions"] + "\n" + small_prompt(claim)
    if DRY_RUN:                                   # added
        return fake_ask(config["model"], prompt)[0]
    reply = gateway.chat.completions.create(
        model=config["model"],
        messages=[{"role": "user", "content": prompt}],
        extra_body={"reasoning": {"effort": config["effort"]}})      # check your gateway's name for this
    text = reply.choices[0].message.content
    return json.loads(text[text.index("{"): text.rindex("}") + 1])


def propose():
    state = load()
    if any(v["status"] in ("proposed", "testing") for v in state["versions"]):
        raise Busy("a round is already open")
    config = active(state)
    results = [{"story": c["story"], "agent": run_config(config, c)["action"],
                "handler": key[c["id"]]["action"]} for c in practice]
    prompt = f"""You improve a claims agent by following this recipe:
{recipe()}

Current setup: {json.dumps({f: config[f] for f in FIELDS})}
Results on practice claims: {json.dumps(results)}

Reply with JSON only: {{"field": "instructions" or "model" or "effort", "value": "the new value", "why": "one sentence"}}"""
    proposal = ask(gateway, IMPROVER, prompt)[0]
    if proposal["field"] not in FIELDS or not str(proposal["value"]).strip():
        raise ValueError("the improver must change exactly one of: " + ", ".join(FIELDS))
    n = len(state["versions"]) + 1
    new = {f: config[f] for f in FIELDS}
    new[proposal["field"]] = proposal["value"]
    state["versions"].append({"n": n, **new, "changed": proposal["field"], "why": proposal["why"],
                              "proposed_by": "improver", "approved_by": None,
                              "status": "proposed", "scores": None})
    save(state)
    return n


# Step 3: a person says yes, or no
def approve(n, who):
    state = load()
    version = find(state, n)
    if version["status"] != "proposed":
        raise ValueError("this version is not waiting for approval")
    version["approved_by"] = who
    version["status"] = "testing"
    save(state)


def reject(n, who):
    state = load()
    version = find(state, n)
    if version["status"] != "proposed":
        raise ValueError("this version is not waiting for approval")
    version["rejected_by"] = who
    version["status"] = "rejected"
    save(state)


# Step 4: code decides, keep or roll back
def evaluate(config):
    grid = matrix([(key[c["id"]]["action"], run_config(config, c)["action"]) for c in held_claims])
    return {"agreement": accuracy(grid), "mistake_cost_sgd": mistake_cost(grid)}


def keep_or_roll_back(old, new):
    no_worse = new["agreement"] >= old["agreement"] and new["mistake_cost_sgd"] <= old["mistake_cost_sgd"]
    better = new["agreement"] > old["agreement"] or new["mistake_cost_sgd"] < old["mistake_cost_sgd"]
    return no_worse and better


def finish_round(n):
    state = load()
    version, current = find(state, n), active(state)
    if version["status"] != "testing":
        raise ValueError("this version has not been approved")
    if current["scores"] is None:
        current["scores"] = evaluate(current)
    version["scores"] = evaluate(version)
    if keep_or_roll_back(current["scores"], version["scores"]):
        version["status"] = "kept"
        state["active"] = n
    else:
        version["status"] = "rolled_back"
    save(state)
    return version["status"]


# Step 5: the recipe's last step: improve the recipe, with a person approving
EDITS = "recipe_edits.json"


def edits():
    return json.load(open(EDITS)) if os.path.exists(EDITS) else []


def suggest_recipe_edit(n):
    version = find(load(), n)
    prompt = f"""Here is your recipe:
{recipe()}

Round {n} ended as {version["status"]}, scores {json.dumps(version["scores"])}.
Suggest one better recipe. Reply with JSON only: {{"recipe": "the whole new recipe", "why": "one sentence"}}"""
    suggestion = ask(gateway, IMPROVER, prompt)[0]
    json.dump(edits() + [{**suggestion, "status": "pending"}], open(EDITS, "w"), indent=2)


def approve_recipe_edit(i, who):
    all_edits = edits()
    new_recipe = all_edits[i]["recipe"]
    if "wait for a person" not in new_recipe.lower():
        raise ValueError("a recipe must keep its step that waits for a person")
    open("recipe.txt", "w").write(new_recipe)
    all_edits[i]["status"] = "approved by " + who
    json.dump(all_edits, open(EDITS, "w"), indent=2)
