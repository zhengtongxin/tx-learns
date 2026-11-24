# copilot_agent.py: the Agents SDK wired to the tools (Step 4), plus the handover tool (Step 6).
import json
import os
import re

from agents import Agent, Runner, RunContextWrapper, function_tool

from copilot_tools import run_tool
from copilot_log import log_turn, history
from handover import handover_facts

DRY_RUN = os.environ.get("DRY_RUN") == "1"   # added: DRY_RUN=1 answers with simple rules instead of a model


def use(ctx, name, args):
    user = ctx.context
    result = run_tool(user, name, args)                  # never confirmed here: only the handler's click does that
    if "confirm" in result:
        user["pending"].append(result["args"])
    log_turn(user["name"], "step", name + " " + json.dumps(args) + " -> " + json.dumps(result)[:300])
    return json.dumps(result)


@function_tool
def lookup_claim(ctx: RunContextWrapper[dict], claim_id: str) -> str:
    """Look up one claim in the records."""
    return use(ctx, "lookup_claim", {"claim_id": claim_id})


@function_tool
def read_context(ctx: RunContextWrapper[dict], name: str) -> str:
    """Read one governed context file, such as manual or claim_rules."""
    return use(ctx, "read_context", {"name": name})


@function_tool
def start_work(ctx: RunContextWrapper[dict], claim_id: str) -> str:
    """Start the agent on a claim."""
    return use(ctx, "start_work", {"claim_id": claim_id})


@function_tool
def send_back(ctx: RunContextWrapper[dict], claim_id: str, note: str) -> str:
    """Send a decision back to the agent with a note."""
    return use(ctx, "send_back", {"claim_id": claim_id, "note": note})


@function_tool
def pay_claim(ctx: RunContextWrapper[dict], claim_id: str, amount: float) -> str:
    """Ask to pay a claim. The handler must confirm."""
    return use(ctx, "pay_claim", {"claim_id": claim_id, "amount": amount})


@function_tool
def pilot_handover() -> str:
    """Answer questions about what the pilot built, decided and measured."""
    return json.dumps(handover_facts())


copilot = Agent(
    name="Handover copilot",
    instructions=("You help claims handlers at a small travel insurer. Look things up before you answer, and say which record "
                  "or context file you used. You cannot pay by yourself: if a tool asks for confirmation, tell the handler what is waiting."),
    tools=[lookup_claim, read_context, start_work, send_back, pay_claim, pilot_handover],
)


class _Ctx:                      # added: a tiny stand-in for the SDK's context wrapper, used in a dry run
    def __init__(self, user):
        self.context = user


def dry_answer(user, question):
    """added: no model. Understands a few plain sentences so you can test the whole page."""
    ctx, q = _Ctx(user), question.lower()
    claim = re.search(r"c\d{3}", q)
    claim_id = claim.group(0).upper() if claim else None
    amount = re.search(r"(\d[\d,]*)", q[claim.end():]) if claim else None
    if claim_id and "pay" in q and amount:
        result = use(ctx, "pay_claim", {"claim_id": claim_id, "amount": float(amount.group(1).replace(",", ""))})
        if "refused" in result:
            return "Dry run: " + result
        return "Dry run: I asked to pay. Press Confirm if you agree."
    if claim_id and "start" in q:
        return "Dry run: " + use(ctx, "start_work", {"claim_id": claim_id})
    if claim_id and "send back" in q:
        return "Dry run: " + use(ctx, "send_back", {"claim_id": claim_id, "note": question})
    if claim_id:
        return "Dry run: " + use(ctx, "lookup_claim", {"claim_id": claim_id})
    if "manual" in q or "rule" in q:
        return "Dry run: " + use(ctx, "read_context", {"name": "claim_rules"})
    if "pilot" in q or "handover" in q:
        return "Dry run: " + json.dumps(handover_facts())
    return "Dry run: try 'look up C007', 'pay C007 300', 'start C008' or 'what are the rules?'"


def ask(user, question):
    user["pending"] = []
    log_turn(user["name"], "user", question)
    if DRY_RUN:
        answer = dry_answer(user, question)
    else:
        answer = Runner.run_sync(copilot, history(user["name"]), context=user).final_output
    log_turn(user["name"], "assistant", answer)
    return {"answer": answer, "pending": user["pending"]}
