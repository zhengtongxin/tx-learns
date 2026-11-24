"""board.py: the shared task board. The only channel between the coordinator and the builders.

added: the lesson used a board it did not show. This is a small SQLite version: goals, with
steps under each goal, that builders claim, write and tick off.
"""
import sqlite3

from rich.table import Table


class Board:
    def __init__(self, path: str):
        self.path = path
        with self._db() as db:
            db.execute("CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, "
                       "text TEXT, status TEXT DEFAULT 'pending', claimed_by TEXT)")
            db.execute("CREATE TABLE IF NOT EXISTS steps (id INTEGER PRIMARY KEY AUTOINCREMENT, "
                       "goal_id INTEGER, text TEXT, done INTEGER DEFAULT 0)")

    def _db(self):
        # a new short connection each time: several processes write to the same file
        db = sqlite3.connect(self.path, timeout=30)
        db.row_factory = sqlite3.Row
        return db

    def add_goal(self, text: str) -> int:
        with self._db() as db:
            return db.execute("INSERT INTO goals (text) VALUES (?)", (text,)).lastrowid

    def get_goal(self, goal_id: int):
        with self._db() as db:
            return db.execute("SELECT * FROM goals WHERE id=?", (goal_id,)).fetchone()

    def claim(self, goal_id: int, who: str) -> None:
        with self._db() as db:
            db.execute("UPDATE goals SET status='working', claimed_by=? WHERE id=?", (who, goal_id))

    def finish(self, goal_id: int, status: str = "done") -> None:
        with self._db() as db:
            db.execute("UPDATE goals SET status=? WHERE id=?", (status, goal_id))

    def add_step(self, goal_id: int, text: str) -> int:
        with self._db() as db:
            return db.execute("INSERT INTO steps (goal_id, text) VALUES (?, ?)", (goal_id, text)).lastrowid

    def steps(self, goal_id: int) -> list[dict]:
        with self._db() as db:
            return [dict(r) for r in db.execute("SELECT * FROM steps WHERE goal_id=? ORDER BY id", (goal_id,))]

    def tick(self, step_id: int) -> None:
        with self._db() as db:
            db.execute("UPDATE steps SET done=1 WHERE id=?", (step_id,))

    def goals(self) -> list[dict]:
        with self._db() as db:
            return [dict(r) for r in db.execute("SELECT * FROM goals ORDER BY id")]


def render_board(board: Board) -> Table:
    """The live view: one row per goal, filling in as the builders tick steps off."""
    table = Table(title="Fair site: task board")
    for col in ("Goal", "Status", "Steps"):
        table.add_column(col)
    colours = {"pending": "white", "working": "yellow", "done": "green", "failed": "red"}
    for g in board.goals():
        steps = board.steps(g["id"])
        done = sum(s["done"] for s in steps)
        bar = ("#" * done + "." * (len(steps) - done)) or "-"
        c = colours.get(g["status"], "white")
        table.add_row(g["text"], f"[{c}]{g['status']}[/{c}]", f"{bar} {done}/{len(steps)}")
    return table
