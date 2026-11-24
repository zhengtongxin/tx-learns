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
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    @property
    def pending(self) -> list[subprocess.Popen]:
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def slug(self, framework: str) -> str:
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def start(self, framework: str, goal_id: int) -> None:
        """Start one worker. Returns at once, so several run in parallel."""
        # TODO: Start one worker. Returns at once, so several run in parallel.
        # Hint: subprocess.Popen([sys.executable, script, str(goal_id), board_path], stdout/stderr=DEVNULL, start_new_session=True); keep it in self.procs
        raise NotImplementedError("TODO")

    async def wait_all(self, timeout: int = 300) -> None:
        """Wait until every started worker exits, or stop them all when time runs out."""
        # TODO: Wait until every started worker exits, or stop them all when time runs
        # Hint: poll p.poll() every 0.25 s with asyncio.sleep; when the deadline passes, kill_all()
        raise NotImplementedError("TODO")

    def kill_all(self) -> None:
        """Kill each worker's whole process tree, not just the top process."""
        # TODO: Kill each worker's whole process tree, not just the top process.
        # Hint: os.killpg(p.pid, signal.SIGKILL) for each worker still running
        raise NotImplementedError("TODO")

    def status(self) -> str:
        # TODO: write this function
        # Hint: one line per worker: running / exited code / timed out, and whether its page exists
        raise NotImplementedError("TODO")

    def fix_once(self, framework: str, problem: str) -> str:
        """Give one worker a single fix task. A second request for the same worker is refused."""
        # TODO: Give one worker a single fix task. A second request for the same worke
        # Hint: refuse a second fix for the same worker; otherwise add a fix goal and start the worker on it
        raise NotImplementedError("TODO")
