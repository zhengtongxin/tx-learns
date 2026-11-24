# copilot_tools.py: five tools, and the rule for which ones ask first (Step 3).
import os
import requests
from urllib.parse import quote

from permissions import allowed

GATEWAY = os.environ.get("GATEWAY_URL", "http://127.0.0.1:5001")


def send(user, method, path, body=None):
    # TODO: call the gateway with the handler own token and return status and body
    raise NotImplementedError("TODO: send")


def cid(args):
    return quote(str(args.get("claim_id", "")), safe="")


TOOLS = {
    "lookup_claim": {"asks": False, "run": lambda u, a: send(u, "GET", "/claims/" + cid(a))},
    "read_context": {"asks": False, "run": lambda u, a: send(u, "GET", "/context/" + quote(str(a.get("name", "")), safe=""))},
    "start_work":   {"asks": False, "run": lambda u, a: send(u, "POST", "/tools/start_work", {"claim_id": a.get("claim_id")})},
    "send_back":    {"asks": False, "run": lambda u, a: send(u, "POST", "/tools/send_back", {"claim_id": a.get("claim_id"), "note": a.get("note")})},
    "pay_claim":    {"asks": True,  "run": lambda u, a: send(u, "POST", "/tools/pay_claim", {"claim_id": a.get("claim_id"), "amount": a.get("amount")})},
}


def run_tool(user, name, args, confirmed=False):
    # TODO: unknown tool -> error; not allowed -> refused; asks and not confirmed -> a confirm question with the args; otherwise run it
    raise NotImplementedError("TODO: run_tool")
