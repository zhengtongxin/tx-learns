"""team.py: starts the builders, waits for them, and sends one back at most once.

added: the lesson called this helper `team` without showing it.
"""
import asyncio
import os
import re
import signal
import subprocess
import sys
import time

from board import Board
from config import ROOT, SITE_DIR, WORKERS


class Team:
    def __init__(self, board: Board):
        self.board = board
        # a slot whose worker file is missing is simply not on the team
        self.workers = {name: path for name, path in WORKERS.items() if (ROOT / path).exists()}
        self.procs: dict[str, subprocess.Popen] = {}
        self.fixed: set[str] = set()   # frameworks already sent back once
        self.timed_out: set[str] = set()

    @property
    def pending(self) -> list[subprocess.Popen]:
        return list(self.procs.values())

    def slug(self, framework: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", framework.lower()).strip("-")

    def start(self, framework: str, goal_id: int) -> None:
        """Start one worker. Returns at once, so several run in parallel."""
        script = self.workers.get(framework)
        if script is None:
            raise ValueError(f"{framework} is not on the team. Team: {', '.join(self.workers)}")
        env = dict(os.environ, SITE_SLUG=self.slug(framework))
        # DEVNULL: workers print banners that would tear the live view; they report through the board
        self.procs[framework] = subprocess.Popen(
            [sys.executable, str(ROOT / script), str(goal_id), self.board.path],
            cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True)  # own process group, so the whole tree can be stopped

    async def wait_all(self, timeout: int = 300) -> None:
        """Wait until every started worker exits, or stop them all when time runs out."""
        deadline = time.time() + timeout
        while any(p.poll() is None for p in self.procs.values()):
            if time.time() > deadline:
                for name, p in self.procs.items():
                    if p.poll() is None:
                        self.timed_out.add(name)
                self.kill_all()
                return
            await asyncio.sleep(0.25)

    def kill_all(self) -> None:
        """Kill each worker's whole process tree, not just the top process."""
        for p in self.procs.values():
            if p.poll() is None:
                try:
                    os.killpg(p.pid, signal.SIGKILL)   # added: on Windows use p.kill() instead
                except (ProcessLookupError, AttributeError, OSError):
                    p.kill()

    def status(self) -> str:
        lines = []
        for name, p in self.procs.items():
            page = SITE_DIR / self.slug(name) / "index.html"
            state = ("timed out" if name in self.timed_out
                     else "running" if p.poll() is None else f"exited {p.returncode}")
            lines.append(f"{name}: {state}, page {'exists' if page.exists() else 'missing'}")
        return "\n".join(lines) or "nobody started yet"

    def fix_once(self, framework: str, problem: str) -> str:
        """Give one worker a single fix task. A second request for the same worker is refused."""
        if framework not in self.procs:
            return f"{framework} has not been started."
        if framework in self.fixed:
            return f"{framework} was already sent back once. Leave it as it is."
        self.fixed.add(framework)
        goal = self.board.add_goal(
            f"Fix site/{self.slug(framework)}/index.html. Problem found by the inspector: {problem}")
        self.start(framework, goal)
        return f"{framework} is fixing: {problem}"
