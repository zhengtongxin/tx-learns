"""workers/adk_worker.py: one builder. It reads its goal from the board, plans, writes a page, ticks steps off.

No arguments  -> seed its own demo goal and run alone.
With arguments -> claim TASK_ID on the shared board, build that page, exit.

added: the lesson's workers came from the previous lesson. This is a small Google ADK one.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # so we can import board.py

from dotenv import load_dotenv
from google.adk.agents import LlmAgent

from board import Board
from config import SITE_DIR, WORKER_MAX_LLM_CALLS, WORKER_MODEL
from runner import run_once

load_dotenv()

TASK_ID = int(sys.argv[1]) if len(sys.argv) > 2 else None
BOARD = sys.argv[2] if len(sys.argv) > 2 else "board.db"
SLUG = os.getenv("SITE_SLUG", "demo")


def make_tools(board: Board, goal_id: int):
    def plan_steps(steps: list[str]) -> str:
        """Write your plan on the board as a short list of steps (3 to 5)."""
        # TODO: board.add_step(goal_id, s) for each step, then return a short confirmation
        raise NotImplementedError("TODO")

    def tick_step(step_number: int) -> str:
        """Tick one planned step off the board when it is done. Steps are numbered from 1."""
        # TODO: look up the step id from board.steps(goal_id) and call board.tick(...)
        raise NotImplementedError("TODO")

    def write_page(html: str) -> str:
        """Save the complete HTML of your page. It is written to your own folder only."""
        # TODO: write html to SITE_DIR / SLUG / index.html (make the folder first)
        raise NotImplementedError("TODO")

    return [plan_steps, tick_step, write_page]


async def main():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    asyncio.run(main())
