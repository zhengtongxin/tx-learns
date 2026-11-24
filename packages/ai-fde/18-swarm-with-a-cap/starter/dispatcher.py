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
    # TODO: loop: a rate limit or timeout waits WAIT_SECONDS and tries again (same attempt); any other error counts as a failure, and the second one is raised
    raise NotImplementedError("TODO: attempt")


async def run_one(claim, agent, on_change, gate):
    # TODO: wait for a gate ticket, report running, await attempt(), report done, or failed (return None) when it raises
    raise NotImplementedError("TODO: run_one")


async def dispatch(claims, agent, on_change, cap=3):
    # TODO: clamp cap to 1..25, make a Semaphore, report waiting for every claim, gather run_one for all of them, return {claim id: result}
    raise NotImplementedError("TODO: dispatch")
