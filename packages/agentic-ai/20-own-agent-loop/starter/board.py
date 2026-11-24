"""board.py: the shared task board. The only channel between the coordinator and the builders.

added: the lesson used a board it did not show. This is a small SQLite version: goals, with
steps under each goal, that builders claim, write and tick off.
"""
import sqlite3

from rich.table import Table


class Board:
    def __init__(self, path: str):
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def _db(self):
        # a new short connection each time: several processes write to the same file
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def add_goal(self, text: str) -> int:
        # TODO: write this function
        # Hint: INSERT into goals and return lastrowid
        raise NotImplementedError("TODO")

    def get_goal(self, goal_id: int):
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def claim(self, goal_id: int, who: str) -> None:
        # TODO: write this function
        # Hint: UPDATE the goal: status working, claimed_by who
        raise NotImplementedError("TODO")

    def finish(self, goal_id: int, status: str = "done") -> None:
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def add_step(self, goal_id: int, text: str) -> int:
        # TODO: write this function
        # Hint: INSERT into steps and return lastrowid
        raise NotImplementedError("TODO")

    def steps(self, goal_id: int) -> list[dict]:
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")

    def tick(self, step_id: int) -> None:
        # TODO: write this function
        # Hint: UPDATE steps SET done=1
        raise NotImplementedError("TODO")

    def goals(self) -> list[dict]:
        # TODO: write this function
        # Hint: see the lesson step that builds this, then compare with final/.
        raise NotImplementedError("TODO")


def render_board(board: Board) -> Table:
    """The live view: one row per goal, filling in as the builders tick steps off."""
    # TODO: The live view: one row per goal, filling in as the builders tick steps
    # Hint: a rich Table: one row per goal with status colour and a done/total step bar
    raise NotImplementedError("TODO")
