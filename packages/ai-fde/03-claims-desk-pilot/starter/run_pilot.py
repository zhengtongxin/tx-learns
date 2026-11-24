# run_pilot.py: run every claim through the agent and the backend, then score (Step 6).
import json

from desk_queue import add_claim, start, record_decision, show_queue, queue
from agent import decide

# TODO 1: load data/claims.json and add_claim() each one
# TODO 2: for every claim id in the queue: start() it, decide() it, record_decision() it
# TODO 3: show_queue()

# TODO 4: score. Load answer_key/handler_decisions.json ({claim id: handler's action}),
#         count the claims where the agent's action matches, and print
#         "agrees with handlers on N of M claims". Nothing else may open the answer key.
