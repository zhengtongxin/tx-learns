# added: a rule-based stand-in for the model, so you can try the whole project
# without a key or a network. Turn it on with DRY_RUN=1. Its answers are made
# from simple rules, so the scores it produces mean nothing about a real model.
import json
import os

DRY_RUN = os.environ.get("DRY_RUN") == "1"

_HERE = os.path.dirname(os.path.abspath(__file__))
POLICIES = json.load(open(os.path.join(_HERE, "data", "policies.json")))


def rule_decision(claim):
    """Decide a claim with plain rules: cap at the limit, take off the excess."""
    story = claim.get("story", "").lower()
    policy = POLICIES.get(claim.get("policy_id"))
    if policy is None or claim.get("type") not in policy["limits"]:
        return {"action": "refer", "payout": 0, "reason": "dry run: unknown policy or claim type"}
    if "bench" in story or "cafe table" in story:
        return {"action": "decline", "payout": 0, "reason": "dry run: item was left unattended"}
    if "did not declare" in story:
        return {"action": "decline", "payout": 0, "reason": "dry run: existing condition was not declared"}
    if "again" in story or "third" in story:
        return {"action": "refer", "payout": 0, "reason": "dry run: repeat claim, a handler should look"}
    limit = policy["limits"][claim["type"]]
    payout = max(0, min(claim["amount"], limit) - policy["excess"])
    return {"action": "approve", "payout": payout, "reason": "dry run: amount capped at the limit, less the excess"}


def fake_ask(model, prompt):
    """Same shape as the real ask(): (decision, tokens in, tokens out, seconds)."""
    claim_line = next((l for l in prompt.splitlines() if l.startswith("Claim: ")), None)
    if claim_line:
        decision = rule_decision(json.loads(claim_line[len("Claim: "):]))
    elif prompt.startswith("You improve a claims agent"):
        decision = {"field": "effort", "value": "medium", "why": "dry run: try a little more thinking"}
    elif prompt.startswith("Here is your recipe"):
        decision = {"recipe": "1. Read the results.\n2. Propose ONE change.\n3. Stop and wait for a person to approve.\n4. Run the held-out evaluation.\n5. Say how this recipe could be better.",
                    "why": "dry run: same recipe, tidier"}
    else:
        decision = {"action": "refer", "payout": 0, "reason": "dry run"}
    return decision, len(prompt) // 4, 60, 0.05
