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
    prompt = f"""You help a travel insurer's claims desk.
Policy wording:
{WORDING}

This customer's policy: {json.dumps(policy)}
The claim: {json.dumps(claim)}

Reply with JSON only: {{"action": "approve" or "decline" or "refer", "payout": a number in S$, "reason": two or three short sentences}}"""
    reply = client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"})
    cost = (reply.usage.prompt_tokens * PRICE[0] + reply.usage.completion_tokens * PRICE[1]) / 1_000_000
    return json.loads(reply.choices[0].message.content), cost
