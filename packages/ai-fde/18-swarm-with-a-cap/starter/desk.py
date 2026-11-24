# desk.py: your claims agent and claim list.
# added: the lesson says "saved as desk.py" with load_claims() and decide(claim) but does
# not show them. This is the smallest version that does what the lesson describes.
import json
import random
import time

from openai import OpenAI

from fake_model import DRY_RUN, rule_decision   # DRY_RUN=1 swaps the model for a stand-in

client = None if DRY_RUN else OpenAI()
MODEL = "gpt-5.4-mini"
PRICE = (0.40, 1.60)    # US$ per million tokens (in, out). Invented: copy your provider's real prices.
POLICIES = json.load(open("data/policies.json"))
WORDING = open("data/policy_wording.txt").read()


def load_claims():
    """The day's claims."""
    return json.load(open("data/claims.json"))


def decide(claim):
    """Returns (decision, cost in US$). This call blocks while it waits for the model."""
    if DRY_RUN:
        time.sleep(random.uniform(0.3, 0.8))          # pretend to think
        return rule_decision(claim), 0.0001
    policy = POLICIES[claim["policy_id"]]
    # TODO: build the prompt, call the model, return (decision, cost in US$ from the token counts)
    raise NotImplementedError("TODO: decide")
