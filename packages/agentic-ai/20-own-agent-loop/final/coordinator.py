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
        goal = board.add_goal(f"Build the {booth} page in site/{team.slug(framework)}/")
        team.start(framework, goal)  # subprocess.Popen, output sent to DEVNULL
        return f"{framework} is building {booth}"

    async def wait_for_builders() -> str:
        """Block until every started worker exits or times out. Returns the status."""
        await team.wait_all(timeout=WORKER_TIMEOUT_S)
        return team.status()

    async def inspect_page(framework: str) -> str:
        """Open one finished page in a real browser and report whether it works."""
        return str(await qa.judge(team.slug(framework)))

    def send_back(framework: str, problem: str) -> str:
        """Give one worker a single fix task that describes the problem."""
        return team.fix_once(framework, problem)

    return [start_builder, wait_for_builders, inspect_page, send_back]


def build_coordinator(team: Team, board: Board) -> LlmAgent:
    # added: the lesson's instruction did not name the team or the booths; the agent needs both
    builders = ", ".join(team.workers)
    booths = ", ".join(BOOTHS)
    return LlmAgent(
        name="fair_coordinator", model=COORDINATOR_MODEL,
        instruction=(
            "Build the fair site with your team: start every builder, wait, inspect each page, "
            "send back at most one fix per page, then finish.\n"
            f"Builders: {builders}.\nBooths: {booths}.\n"
            "Give each builder exactly one booth (a different one each) with start_builder. "
            "Use the builder's name when you call inspect_page and send_back. "
            "When you are done, say which pages work and which are still broken."),
        tools=make_tools(team, board))
