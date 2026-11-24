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
    prompt = f"""You help a travel insurer's claims desk.
Policy wording:
{WORDING}

This customer's policy: {json.dumps(policy)}
The claim: {json.dumps(claim)}

Reply with JSON only: {{"action": "approve" or "decline" or "refer", "payout": a number in S$, "reason": two or three short sentences}}"""
    reply = client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"})
    return json.loads(reply.choices[0].message.content)
