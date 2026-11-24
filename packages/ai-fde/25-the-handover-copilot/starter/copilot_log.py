# copilot_log.py: every step, and each handler's own conversation (Step 4).
import sqlite3

db = sqlite3.connect("copilot.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS turns (handler TEXT, kind TEXT, text TEXT)")


def log_turn(handler, kind, text):                 # kind: user, assistant or step
    # TODO: insert one row for this handler and commit
    raise NotImplementedError("TODO: log_turn")


def history(handler, limit=20):
    # TODO: the last turns of kind user or assistant for THIS handler, oldest first, as {role, content}
    raise NotImplementedError("TODO: history")


def steps(handler, limit=20):
    # TODO: the last step rows for THIS handler, oldest first
    raise NotImplementedError("TODO: steps")
