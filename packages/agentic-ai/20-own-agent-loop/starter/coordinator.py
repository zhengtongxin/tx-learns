"""coordinator.py: the outer loop is an agent with four tools.

The agent decides (what to start, whether a page is good enough, who to send back).
The tools do the exact mechanics (processes, timeouts, files).
"""
from google.adk.agents import LlmAgent

import qa
from board import Board
from config import BOOTHS, COORDINATOR_MODEL, WORKER_TIMEOUT_S
from team import Team


def make_tools(team: Team, board: Board):
    def start_builder(framework: str, booth: str) -> str:
        """Start one framework's worker on one booth page. Returns immediately."""
        # TODO: add a goal to the board, then team.start(framework, goal); it must return at once
        raise NotImplementedError("TODO")

    async def wait_for_builders() -> str:
        """Block until every started worker exits or times out. Returns the status."""
        # TODO: await team.wait_all(timeout=WORKER_TIMEOUT_S), then return team.status()
        raise NotImplementedError("TODO")

    async def inspect_page(framework: str) -> str:
        """Open one finished page in a real browser and report whether it works."""
        # TODO: return str(await qa.judge(team.slug(framework)))
        raise NotImplementedError("TODO")

    def send_back(framework: str, problem: str) -> str:
        """Give one worker a single fix task that describes the problem."""
        # TODO: return team.fix_once(framework, problem)
        raise NotImplementedError("TODO")

    return [start_builder, wait_for_builders, inspect_page, send_back]


def build_coordinator(team: Team, board: Board) -> LlmAgent:
    # added: the lesson's instruction did not name the team or the booths; the agent needs both
    # TODO: write this function
    # Hint: LlmAgent(name=..., model=COORDINATOR_MODEL, instruction=..., tools=make_tools(team, board)); name the builders and booths in the instruction
    raise NotImplementedError("TODO")
