# dispatcher.py: the dispatcher from "Swarms of agents in parallel", finished (Steps 1 to 5 there).
# added: saved here as one file so this project runs on its own.
import asyncio


class RateLimited(Exception):      # map your provider's rate-limit error to this
    pass


class TimedOut(Exception):         # and its timeout error to this
    pass


WAIT_SECONDS = 2


async def attempt(claim, agent):
    """Retries: a rate limit or timeout waits and asks again; a second real failure gives up."""
    failures = 0
    while True:
        try:
            return await agent(claim)
        except (RateLimited, TimedOut):
            await asyncio.sleep(WAIT_SECONDS)      # same attempt, just later (real code also needs a limit on how long it waits)
        except Exception:
            failures += 1
            if failures == 2:                      # second real failure: give up
                raise


async def run_one(claim, agent, on_change, gate):
    async with gate:                                 # wait here until a ticket is free
        on_change(claim["id"], "running")
        try:
            result = await attempt(claim, agent)
        except Exception:
            on_change(claim["id"], "failed")         # one bad claim stays one bad claim
            return None
        on_change(claim["id"], "done")
        return result


async def dispatch(claims, agent, on_change, cap=3):
    cap = max(1, min(25, cap))                       # at most N agents at the same time, N between 1 and 25
    gate = asyncio.Semaphore(cap)
    for c in claims:
        on_change(c["id"], "waiting")
    results = await asyncio.gather(*(run_one(c, agent, on_change, gate) for c in claims))
    return dict(zip([c["id"] for c in claims], results))
