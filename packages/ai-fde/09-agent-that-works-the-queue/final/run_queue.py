# run_queue.py: an agent that works the whole queue (all six steps).
#   python run_queue.py                 work all 25 claims
#   python run_queue.py --limit 5       only the first 5 (cheap trials)
#   python run_queue.py --claim C007    one named claim
import argparse
import json
import os

from openai import OpenAI

from desk_queue import queue, add_claim, start, record_decision
from fake_model import DRY_RUN, rule_decision   # added: DRY_RUN=1 swaps the model for a stand-in

client = None if DRY_RUN else OpenAI()   # added: no key needed in a dry run
MODEL = "gpt-5.4-mini"
POLICIES = json.load(open("data/policies.json"))
SECTIONS = json.load(open("data/manual.json"))   # section title -> text: the claims manual and the wording

BREAK = set()   # added: claim ids that fail on purpose in a dry run (--break C007), to see the retry rules work


# Step 1: let the agent order the queue and write the summary
def pick_order(ids):
    brief = [{"id": i, "amount": queue[i]["claim"]["amount"]} for i in ids]
    if DRY_RUN:                                   # added: biggest amounts first
        return sorted(ids, key=lambda i: -queue[i]["claim"]["amount"])
    reply = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content":
            "Order these insurance claims the way a careful handler would tackle them. "
            'Reply with JSON only: {"order": [claim ids]}\n' + json.dumps(brief)}],
        response_format={"type": "json_object"})
    order = json.loads(reply.choices[0].message.content)["order"]
    # check the model's order: drop ids it invented, add any it forgot
    return [i for i in order if i in ids] + [i for i in ids if i not in order]


def summarise(lines):
    if DRY_RUN:                                   # added
        return f"Dry run: {len(lines)} claims worked."
    reply = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content":
            "Write three short sentences for the claims handlers about this run:\n" + "\n".join(lines)}])
    return reply.choices[0].message.content


# Step 3: a to-do list the queue page can read
TODO_FILE = "todo.json"
todo = {}   # claim id -> {"state", "tries", "line", "read"}


def save_todo():
    json.dump(todo, open(TODO_FILE, "w"), indent=1)


def plan(ids):
    for claim_id in ids:
        todo.setdefault(claim_id, {"state": "to_do", "tries": 0, "line": "", "read": []})   # keep what an earlier run knew
    save_todo()


def show_todo():
    for state in ["to_do", "in_progress", "done", "for_handler"]:
        names = [i for i, item in todo.items() if item["state"] == state]
        print(f"{state:12} {', '.join(names)}")


# Step 5: read the manual by section, and log what was read
TOOLS = [{"type": "function", "function": {
    "name": "read_manual",
    "description": "Read one section of the claims manual or policy wording by its exact title.",
    "parameters": {"type": "object",
                   "properties": {"title": {"type": "string"}},
                   "required": ["title"]}}}]


def decide_with_manual(claim, read_log):
    if DRY_RUN:                                   # added: pretend the helper read one section
        if claim["id"] in BREAK:
            raise RuntimeError("broken on purpose (dry run)")
        read_log.append("Limits and sign-off")
        return rule_decision(claim)
    policy = POLICIES[claim["policy_id"]]
    messages = [{"role": "user", "content":
        f"You help a travel insurer's claims desk. Section titles: {list(SECTIONS)}\n"
        f"Read only what you need with read_manual. Policy: {json.dumps(policy)}\n"
        f"Claim: {json.dumps(claim)}\n"
        'Then reply with JSON only, no code fences: {"action": "approve" or "decline" or "refer", '
        '"payout": a number in S$, "reason": two or three short sentences}'}]
    for _ in range(6):
        message = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS).choices[0].message
        if not message.tool_calls:
            return json.loads(message.content)
        messages.append(message)
        for call in message.tool_calls:
            title = json.loads(call.function.arguments)["title"]
            read_log.append(title)
            messages.append({"role": "tool", "tool_call_id": call.id,
                             "content": SECTIONS.get(title, "No such section.")})
    raise RuntimeError("helper read too many sections without answering")


# Step 4 + 5: a fresh helper for every claim; the main run only gets one line back
def run_helper(claim_id):
    read_log = []
    start(claim_id)                               # added: keep the queue's own state in step
    decision = decide_with_manual(queue[claim_id]["claim"], read_log)
    todo[claim_id]["read"] = read_log
    record_decision(claim_id, decision)
    return f"{claim_id}: {decision['action']} S${decision['payout']}"


# Step 6: failures that fix themselves
MAX_TRIES = 2


def recover():
    """After a killed run, nothing may stay in_progress."""
    if os.path.exists(TODO_FILE):
        todo.update(json.load(open(TODO_FILE)))   # load what the last run saved
    for item in todo.values():
        if item["state"] == "in_progress":
            item["state"] = "to_do"
    save_todo()


def work_one(claim_id):
    item = todo[claim_id]
    if item["state"] != "to_do":
        return
    if queue[claim_id]["decision"] is not None:   # never decide twice
        item["state"] = "done"
        save_todo()
        return
    item["state"] = "in_progress"
    item["tries"] += 1
    save_todo()
    try:
        item["line"] = run_helper(claim_id)
        item["state"] = "done"
    except Exception as err:
        if item["tries"] < MAX_TRIES:
            item["state"] = "to_do"
        else:
            item["state"] = "for_handler"
            item["line"] = f"{claim_id}: failed twice ({type(err).__name__})"
    save_todo()


def run(ids):
    recover()
    plan(ids)
    order = pick_order(ids)
    while any(todo[i]["state"] == "to_do" for i in order):
        for claim_id in order:
            work_one(claim_id)
    show_todo()
    print(summarise([todo[i]["line"] for i in order]))


# Step 2: options to cap the run, or run one claim
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="run only the first N claims")
    parser.add_argument("--claim", help="run one named claim, e.g. C007")
    parser.add_argument("--break", dest="broken", action="append", default=[],
                        help="dry run only: make this claim fail on purpose, e.g. --break C007")   # added
    args = parser.parse_args()
    BREAK.update(args.broken)
    for claim in json.load(open("data/claims.json")):
        add_claim(claim)
    ids = list(queue)
    if args.claim:
        ids = [args.claim]
    elif args.limit:
        ids = ids[:args.limit]
    run(ids)
