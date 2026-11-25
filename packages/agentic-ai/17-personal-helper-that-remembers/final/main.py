"""main.py: give Kaki an errand and a "done means" line."""
import asyncio

from dotenv import load_dotenv

from checker import run_errand
from tools import open_toolbox
from worker import build_worker

load_dotenv(override=True)

ERRAND = ("Find three kopitiams within 2 km of Tiong Bahru that open before 7am and sell half-boiled eggs. "
          "Write them to kopi.md and ping my phone with the best one.")
DONE_MEANS = "kopi.md exists with three kopitiams, each with opening time and address, and the phone was pinged."


async def main():
    cfg = {"configurable": {"thread_id": "errand-1"}}
    async with open_toolbox("workspace") as all_tools:  # the MCP sessions live inside this block
        worker = build_worker(all_tools)
        reply, feedback = await run_errand(worker, ERRAND, DONE_MEANS, cfg)
    print("\nKaki says:", reply)
    print("Checker says:", feedback)


if __name__ == "__main__":
    asyncio.run(main())
