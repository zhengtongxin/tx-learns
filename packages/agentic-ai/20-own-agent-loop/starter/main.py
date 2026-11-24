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
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def write_front_page():
    """Always leave a front page, even if some builders failed (the plain fallback)."""
    # TODO: Always leave a front page, even if some builders failed (the plain fal
    # Hint: a plain HTML list of every site/*/index.html that exists: always a front page
    raise NotImplementedError("TODO")


async def main():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    asyncio.run(main())
