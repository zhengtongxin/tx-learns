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
        for s in steps:
            board.add_step(goal_id, s)
        return "planned: " + "; ".join(f"{i + 1}. {s}" for i, s in enumerate(steps))

    def tick_step(step_number: int) -> str:
        """Tick one planned step off the board when it is done. Steps are numbered from 1."""
        steps = board.steps(goal_id)
        if not 1 <= step_number <= len(steps):
            return f"no step {step_number}"
        board.tick(steps[step_number - 1]["id"])
        return f"ticked step {step_number}"

    def write_page(html: str) -> str:
        """Save the complete HTML of your page. It is written to your own folder only."""
        folder = SITE_DIR / SLUG
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "index.html").write_text(html)
        return f"saved {len(html)} characters to site/{SLUG}/index.html"

    return [plan_steps, tick_step, write_page]


async def main():
    board = Board(BOARD)
    goal_id = TASK_ID if TASK_ID is not None else board.add_goal(f"Build the pancake page in site/{SLUG}/")
    goal = board.get_goal(goal_id)
    board.claim(goal_id, SLUG)
    agent = LlmAgent(
        name=f"builder_{SLUG.replace('-', '_')}", model=WORKER_MODEL,
        instruction=(
            "You build one small web page for a school fair booth. "
            "1) Call plan_steps with 3 to 5 steps. "
            "2) Write ONE complete HTML file with write_page: a heading, two sentences about the booth, "
            "and one small working widget in inline JavaScript (a counter, a spinner, a quiz). "
            "Link the shared look with <link rel=\"stylesheet\" href=\"../style.css\"> and add no other files. "
            "3) Call tick_step for each step as you finish it. Then stop."),
        tools=make_tools(board, goal_id))
    try:
        await run_once(agent, f"Your goal: {goal['text']}", max_llm_calls=WORKER_MAX_LLM_CALLS)
        board.finish(goal_id, "done")
    except Exception:
        board.finish(goal_id, "failed")
        raise


if __name__ == "__main__":
    asyncio.run(main())
