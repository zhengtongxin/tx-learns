# run_pilot.py: run every claim through the agent and the backend, then score (Step 6).
import json

from desk_queue import add_claim, start, record_decision, show_queue, queue
from agent import decide

for claim in json.load(open("data/claims.json")):
    add_claim(claim)
for claim_id in list(queue):
    start(claim_id)
    record_decision(claim_id, decide(queue[claim_id]["claim"]))
show_queue()

# score: the ONLY code that opens the answer key
key = json.load(open("answer_key/handler_decisions.json"))   # {claim id: handler's action}
agree = sum(1 for cid, item in queue.items() if item["decision"]["action"] == key[cid])
print(f"agrees with handlers on {agree} of {len(key)} claims")
