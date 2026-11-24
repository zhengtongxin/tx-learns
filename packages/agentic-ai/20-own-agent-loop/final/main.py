"""main.py: the coordinator runs five builders, checks their pages and finishes on its own.

  python main.py --plan     print the team and booths, spend nothing
  python main.py            run the whole thing
"""
import asyncio
import sys

from dotenv import load_dotenv
from rich.console import Console
from rich.live import Live

import qa
from board import Board, render_board
from config import BOARD_PATH, BOOTHS, COORDINATOR_MAX_LLM_CALLS, SITE_DIR
from coordinator import build_coordinator
from runner import run_once
from team import Team

load_dotenv()

STYLE = """body{font-family:Georgia,serif;max-width:640px;margin:2rem auto;padding:0 1rem;background:#fffaf0;color:#222}
h1{color:#b3401f}button{padding:.5rem 1rem;border-radius:8px;border:2px solid #b3401f;background:#fff;cursor:pointer}
"""  # added: "the same look first": one shared stylesheet the builders link to


def write_shared_look():
    SITE_DIR.mkdir(exist_ok=True)
    (SITE_DIR / "style.css").write_text(STYLE)


def write_front_page():
    """Always leave a front page, even if some builders failed (the plain fallback)."""
    links = "".join(f'<li><a href="{d.name}/index.html">{d.name}</a></li>'
                    for d in sorted(SITE_DIR.iterdir()) if (d / "index.html").exists())
    (SITE_DIR / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><title>School Fair</title>'
        '<link rel="stylesheet" href="style.css"><h1>School Fair</h1>'
        f"<ul>{links or '<li>No booth pages yet</li>'}</ul>")


async def main():
    console = Console()
    board_file = BOARD_PATH
    open(board_file, "w").close()  # added: start from an empty board every run
    board = Board(board_file)
    team = Team(board)
    console.print("Team:", ", ".join(team.workers), "\nBooths:", ", ".join(BOOTHS))
    if "--plan" in sys.argv:
        return

    write_shared_look()
    server = qa.serve_site()
    coordinator = build_coordinator(team, board)
    job = asyncio.create_task(run_once(
        coordinator, "Build the fair site now.", max_llm_calls=COORDINATOR_MAX_LLM_CALLS))
    try:
        with Live(render_board(board), console=console, refresh_per_second=4) as live:
            while not job.done():  # the coordinator's side: redraw until it finishes
                live.update(render_board(board))
                await asyncio.sleep(0.25)
            live.update(render_board(board))
        console.print("\nCoordinator says:", await job)
    finally:
        team.kill_all()  # never leave a worker running
        server.shutdown()
        write_front_page()
    console.print(f"Open {SITE_DIR / 'index.html'} in your browser.")


if __name__ == "__main__":
    asyncio.run(main())
