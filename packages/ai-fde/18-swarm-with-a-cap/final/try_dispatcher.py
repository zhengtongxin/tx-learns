# try_dispatcher.py: test the dispatcher with stand-in agents first, and time three caps.
# From "Swarms of agents in parallel", Steps 2 and 6. No model, no key, no cost.
#   python try_dispatcher.py
import asyncio
import random
import time
from collections import Counter

from dispatcher import dispatch


async def stand_in(claim):
    await asyncio.sleep(random.uniform(0.5, 1.5))     # pretend to think
    return {"action": "approve", "payout": claim["amount"]}


claims = [{"id": f"C-{i}", "amount": 100 * i} for i in range(1, 26)]
state = {}


def on_change(claim_id, status):
    state[claim_id] = status


for cap in (3, 10, 25):
    state.clear()
    start = time.perf_counter()
    asyncio.run(dispatch(claims, stand_in, on_change, cap))
    print(cap, "agents:", round(time.perf_counter() - start, 1), "seconds", dict(Counter(state.values())))
