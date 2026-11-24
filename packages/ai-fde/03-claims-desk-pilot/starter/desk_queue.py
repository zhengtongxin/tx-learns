# desk_queue.py: the backend queue for the claims desk pilot (Steps 2 to 4).
# added: the lesson calls this file's code "the backend". It is named desk_queue.py
# because a file called queue.py would hide Python's own queue module.

SIGNOFF_LIMIT = 800   # S$: any bigger payout waits for a handler

queue = {}   # claim id -> its record


def add_claim(claim):
    # TODO: store the claim with state waiting and no decision yet
    raise NotImplementedError("TODO: add_claim")


def start(claim_id):
    # TODO: move the claim to in_progress
    raise NotImplementedError("TODO: start")


def record_decision(claim_id, decision):
    """The one function every decision passes through, so the rule cannot be skipped."""
    # TODO: save the decision; send big approvals and every refer to waiting_signoff, everything else to decided
    raise NotImplementedError("TODO: record_decision")


def sign_off(claim_id, handler):
    queue[claim_id]["state"] = "decided"
    queue[claim_id]["signed_by"] = handler


def show_queue():
    # TODO: print one line per claim: id, state, and the decision if there is one
    raise NotImplementedError("TODO: show_queue")
