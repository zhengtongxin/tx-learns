"""main.py: run the same team three ways.

  python main.py code      your Python is the boss (Step 2)
  python main.py manager   a Coordinator agent is the boss, writers as tools (Step 4)
  python main.py handoff   the Coordinator hands off to the Mailroom (Step 5)
"""
import asyncio
import sys

from agents import Runner, trace
from dotenv import load_dotenv

from mail import send_message
from team import coordinator, coordinator_handoff, picker, writers

load_dotenv(override=True)


async def by_code():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


async def by_manager():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


async def by_handoff():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


MODES = {"code": by_code, "manager": by_manager, "handoff": by_handoff}


def main():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    main()
