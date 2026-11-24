"""floor/trading_floor.py: run all four uncles at once, then sleep, then again.

  python -m floor.trading_floor            run forever (pause = RUN_EVERY_N_MINUTES)
  python -m floor.trading_floor --once     one round, then stop
  python -m floor.trading_floor Wong       one round for one uncle only
"""
import asyncio
import os
import sys

from agents import add_trace_processor
from dotenv import load_dotenv

from floor.accounts import Account, STRATEGIES
from floor.db import record_value, write_log
from floor.trader import run_uncle
from floor.tracing import FloorLog

load_dotenv(override=True)
add_trace_processor(FloorLog())


async def one_round(names):
    results = await asyncio.gather(*(run_uncle(n) for n in names), return_exceptions=True)
    for n, r in zip(names, results):
        if isinstance(r, Exception):
            # added: one uncle failing (for example a missing key) must not stop the others
            write_log(n, "error", repr(r)[:300])
            print(f"{n} failed: {r!r}")
        record_value(n, Account.get(n).summary()["value"])  # a point on the dashboard chart


async def floor(names=None, once=False):
    names = names or list(STRATEGIES)
    for n in names:
        record_value(n, Account.get(n).summary()["value"])  # the starting point
    while True:
        await one_round(names)
        if once:
            return
        await asyncio.sleep(int(os.getenv("RUN_EVERY_N_MINUTES", "60")) * 60)


if __name__ == "__main__":
    args = sys.argv[1:]
    only = [a for a in args if a in STRATEGIES]
    asyncio.run(floor(only or None, once=("--once" in args or bool(only))))
