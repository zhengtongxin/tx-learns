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
    with trace("Coding club outreach"):
        # three writers at the same time, then one picker
        drafts = await asyncio.gather(*(Runner.run(w, "Write the invitation email") for w in writers))
        joined = "Drafts:\n\n" + "\n\n---\n\n".join(d.final_output for d in drafts)
        best = await Runner.run(picker, joined)
        send_message("A new Saturday coding club", best.final_output)


async def by_manager():
    with trace("Coding club, manager version"):
        result = await Runner.run(coordinator, "Send the coding club invitation to parents")
    print(result.final_output)


async def by_handoff():
    with trace("Coding club, handoff version"):
        result = await Runner.run(coordinator_handoff, "Send the coding club invitation")
    print("Last agent:", result.last_agent.name)  # Mailroom if the handoff happened
    print(result.final_output)


MODES = {"code": by_code, "manager": by_manager, "handoff": by_handoff}


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "code"
    if mode not in MODES:
        raise SystemExit(f"Unknown mode {mode!r}. Choose one of: {', '.join(MODES)}")
    asyncio.run(MODES[mode]())  # in a .py file the await lives inside an async function


if __name__ == "__main__":
    main()
