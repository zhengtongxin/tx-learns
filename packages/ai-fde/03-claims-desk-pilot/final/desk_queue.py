# desk_queue.py: the backend queue for the claims desk pilot (Steps 2 to 4).
# added: the lesson calls this file's code "the backend". It is named desk_queue.py
# because a file called queue.py would hide Python's own queue module.

SIGNOFF_LIMIT = 800   # S$: any bigger payout waits for a handler

queue = {}   # claim id -> its record


def add_claim(claim):
    queue[claim["id"]] = {"claim": claim, "state": "waiting", "decision": None}


def start(claim_id):
    queue[claim_id]["state"] = "in_progress"


def record_decision(claim_id, decision):
    """The one function every decision passes through, so the rule cannot be skipped."""
    item = queue[claim_id]
    item["decision"] = decision
    too_big = decision["action"] == "approve" and decision["payout"] > SIGNOFF_LIMIT
    needs_human = too_big or decision["action"] == "refer"
    item["state"] = "waiting_signoff" if needs_human else "decided"


def sign_off(claim_id, handler):
    queue[claim_id]["state"] = "decided"
    queue[claim_id]["signed_by"] = handler


def show_queue():
    for claim_id, item in queue.items():
        decision = item["decision"]
        line = f"{claim_id}  {item['state']:16}"
        if decision:
            line += f"{decision['action']:8} S${decision['payout']}  {decision['reason']}"
        print(line)
