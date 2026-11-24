# bench.py: the helpers the model-picking lessons built up, saved in one file.
# Everything here comes from "Frontier models on real claims" and "Open models,
# local models and token cost". This project imports from it.
# Keep one-off experiments out of this file (or under `if __name__ == "__main__":`),
# because importing it runs every top-level line.
import json
import os
import time

from openai import OpenAI

from fake_model import DRY_RUN, fake_ask   # added: DRY_RUN=1 swaps the model for a rule-based stand-in

claims = json.load(open("data/claims.json"))          # the 25 invented claims
POLICIES = json.load(open("data/policies.json"))
WORDING = open("data/policy_wording.txt").read()
WORDING_PARTS = json.load(open("data/wording_sections.json"))   # {"delays": "...", "baggage": "...", ...}

# {"C007": {"action": "approve", "payout": 420, "difficulty": "easy", "reason": "..."}, ...}
key = json.load(open("answer_key/handler_decisions.json"))   # only scoring reads this


def build_prompt(claim):
    """The full prompt: the whole wording pasted in."""
    policy = POLICIES[claim["policy_id"]]
    return f"""You help a travel insurer's claims desk.
Policy wording:
{WORDING}

This customer's policy: {json.dumps(policy)}
The claim: {json.dumps(claim)}

Reply with JSON only: {{"action": "approve" or "decline" or "refer", "payout": a number in S$, "reason": two or three short sentences}}"""


SECTIONS = {"delay": ["delays", "limits"],
            "baggage": ["baggage", "limits"],
            "medical": ["medical", "limits"]}


def compact(data):
    return json.dumps(data, separators=(",", ":"))   # drops the spaces that json.dumps adds by default


def small_prompt(claim):
    """The short prompt: only the wording sections this kind of claim needs."""
    wording = "\n".join(WORDING_PARTS[name] for name in SECTIONS[claim["type"]])
    policy = compact(POLICIES[claim["policy_id"]])
    return f"""Travel claims desk. Relevant wording:
{wording}
Policy: {policy}
Claim: {compact(claim)}
JSON only: {{"action": "approve" or "decline" or "refer", "payout": number in S$, "reason": two short sentences}}"""


# One gateway, many models. Here the gateway is OpenRouter (others exist).
# added: a placeholder key so the file can be imported in a dry run without a real key
gateway = OpenAI(base_url="https://openrouter.ai/api/v1",
                 api_key=os.environ.get("GATEWAY_API_KEY", "YOUR_KEY_HERE"))

# check the exact names on your gateway's model list
MODELS = ["openai/gpt-5.4-mini", "anthropic/claude-haiku-5-5", "anthropic/claude-sonnet-5-5"]

# US$ per million tokens: (input, output). Invented numbers: copy your gateway's real list.
PRICE = {
    "openai/gpt-5.4-mini": (0.40, 1.60),
    "anthropic/claude-haiku-5-5": (1.00, 5.00),
    "anthropic/claude-sonnet-5-5": (3.00, 15.00)}


def ask(client, model, prompt):
    """One model call. Returns (decision, tokens in, tokens out, seconds)."""
    if DRY_RUN:                                   # added: no network in a dry run
        return fake_ask(model, prompt)
    start = time.perf_counter()
    reply = client.chat.completions.create(
        model=model, messages=[{"role": "user", "content": prompt}])
    seconds = time.perf_counter() - start
    text = reply.choices[0].message.content
    # keep only the {...} part, in case a model adds chatter around it
    decision = json.loads(text[text.index("{"): text.rindex("}") + 1])
    return decision, reply.usage.prompt_tokens, reply.usage.completion_tokens, seconds


def run_all(client, model):
    return [(c["id"], *ask(client, model, small_prompt(c))) for c in claims]


def matches(decision, want):
    """Right = same action and a payout within S$1 of the handler's."""
    return (decision["action"] == want["action"]
            and abs(float(decision["payout"]) - want["payout"]) <= 1)


def rough_tokens(text):
    return len(text) // 4          # about four characters per token


if __name__ == "__main__":
    # a quick check that the data and prompts load; no model is called
    full = sum(rough_tokens(build_prompt(c)) for c in claims) / len(claims)
    small = sum(rough_tokens(small_prompt(c)) for c in claims) / len(claims)
    print(f"full {full:.0f} tokens, small {small:.0f} tokens, saved {1 - small / full:.0%}")
    approve_share = sum(1 for want in key.values() if want["action"] == "approve") / len(key)
    print(f"approving everything scores {approve_share:.0%}")
