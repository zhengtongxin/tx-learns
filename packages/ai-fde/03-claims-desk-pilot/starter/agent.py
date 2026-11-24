# agent.py: the agent that reads one claim (Step 5).
import json
from openai import OpenAI

from fake_model import DRY_RUN, rule_decision   # added: DRY_RUN=1 skips the real model

client = None if DRY_RUN else OpenAI()   # added: no key needed in a dry run
POLICIES = json.load(open("data/policies.json"))
WORDING = open("data/policy_wording.txt").read()


def decide(claim):
    if DRY_RUN:                       # added: a stand-in answer so you can test the queue
        return rule_decision(claim)
    policy = POLICIES[claim["policy_id"]]
    # TODO: build the prompt (wording, policy, claim), call the model, return the JSON decision
    raise NotImplementedError("TODO: decide")
