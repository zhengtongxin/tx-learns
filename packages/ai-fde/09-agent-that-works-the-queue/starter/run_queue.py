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
    # TODO: ask the model for an order as JSON, then check it: drop invented ids and add forgotten ones
    raise NotImplementedError("TODO: pick_order")


def summarise(lines):
    if DRY_RUN:                                   # added
        return f"Dry run: {len(lines)} claims worked."
    # TODO: ask the model for three short sentences about the run
    raise NotImplementedError("TODO: summarise")


# Step 3: a to-do list the queue page can read
TODO_FILE = "todo.json"
todo = {}   # claim id -> {"state", "tries", "line", "read"}


def save_todo():
    # TODO: write todo to TODO_FILE as JSON
    raise NotImplementedError("TODO: save_todo")


def plan(ids):
    # TODO: give every id a to_do entry (setdefault, so an earlier run is kept), then save
    raise NotImplementedError("TODO: plan")


def show_todo():
    # TODO: print one line per state with the claim ids in it
    raise NotImplementedError("TODO: show_todo")


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
    # TODO: loop up to 6 rounds: call the model with TOOLS; if it asks for read_manual, log the title and send the section back as a tool message; if not, return the JSON decision
    raise NotImplementedError("TODO: decide_with_manual")


# Step 4 + 5: a fresh helper for every claim; the main run only gets one line back
def run_helper(claim_id):
    # TODO: fresh helper: decide with the manual, store what was read, record_decision, return ONE line
    raise NotImplementedError("TODO: run_helper")


# Step 6: failures that fix themselves
MAX_TRIES = 2


def recover():
    """After a killed run, nothing may stay in_progress."""
    # TODO: load todo.json if it exists; anything in_progress goes back to to_do; save
    raise NotImplementedError("TODO: recover")


def work_one(claim_id):
    # TODO: skip unless to_do; never decide twice; count the try; on failure go back to to_do once, then for_handler
    raise NotImplementedError("TODO: work_one")


def run(ids):
    # TODO: recover, plan, work every claim in pick_order until none is to_do, then show the list and the summary
    raise NotImplementedError("TODO: run")


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
