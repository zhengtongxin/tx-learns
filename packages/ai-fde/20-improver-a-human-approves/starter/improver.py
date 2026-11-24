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
    # TODO: call the model in this config (instructions + small_prompt, with the reasoning effort) and return the JSON decision
    raise NotImplementedError("TODO: run_config")


def propose():
    # TODO: refuse if a round is open (Busy); run the active config on the practice claims; ask the improver for ONE change to ONE field; check it; append the new version as proposed; return its number
    raise NotImplementedError("TODO: propose")


# Step 3: a person says yes, or no
def approve(n, who):
    # TODO: only a proposed version; record who approved; status becomes testing
    raise NotImplementedError("TODO: approve")


def reject(n, who):
    # TODO: only a proposed version; record who rejected; status becomes rejected; nothing else changes
    raise NotImplementedError("TODO: reject")


# Step 4: code decides, keep or roll back
def evaluate(config):
    # TODO: run the config on every held-out claim and return agreement and mistake cost
    raise NotImplementedError("TODO: evaluate")


def keep_or_roll_back(old, new):
    # TODO: True only if no worse on both numbers and better on at least one
    raise NotImplementedError("TODO: keep_or_roll_back")


def finish_round(n):
    # TODO: only a testing version; score the active version once if it has no scores; score the new one; keep (and make active) or roll back; save
    raise NotImplementedError("TODO: finish_round")


# Step 5: the recipe's last step: improve the recipe, with a person approving
EDITS = "recipe_edits.json"


def edits():
    return json.load(open(EDITS)) if os.path.exists(EDITS) else []


def suggest_recipe_edit(n):
    # TODO: ask the improver for a better recipe and store it as pending
    raise NotImplementedError("TODO: suggest_recipe_edit")


def approve_recipe_edit(i, who):
    # TODO: refuse a recipe without the words wait for a person; otherwise write recipe.txt and mark the edit approved
    raise NotImplementedError("TODO: approve_recipe_edit")
