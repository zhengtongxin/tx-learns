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
    # TODO: write this function
    # Hint: asyncio.gather the uncles (return_exceptions=True), log failures, record each value
    raise NotImplementedError("TODO")


async def floor(names=None, once=False):
    # TODO: write this function
    # Hint: loop: one_round, then asyncio.sleep(RUN_EVERY_N_MINUTES * 60)
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    args = sys.argv[1:]
    only = [a for a in args if a in STRATEGIES]
    asyncio.run(floor(only or None, once=("--once" in args or bool(only))))
