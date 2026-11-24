# copilot_log.py: every step, and each handler's own conversation (Step 4).
import sqlite3

db = sqlite3.connect("copilot.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS turns (handler TEXT, kind TEXT, text TEXT)")


def log_turn(handler, kind, text):                 # kind: user, assistant or step
    db.execute("INSERT INTO turns VALUES (?, ?, ?)", (handler, kind, text))
    db.commit()


def history(handler, limit=20):
    rows = db.execute("SELECT kind, text FROM turns WHERE handler = ? AND kind IN ('user', 'assistant') "
                      "ORDER BY rowid DESC LIMIT ?", (handler, limit)).fetchall()
    return [{"role": kind, "content": text} for kind, text in reversed(rows)]


def steps(handler, limit=20):
    rows = db.execute("SELECT text FROM turns WHERE handler = ? AND kind = 'step' ORDER BY rowid DESC LIMIT ?", (handler, limit)).fetchall()
    return [r[0] for r in reversed(rows)]
