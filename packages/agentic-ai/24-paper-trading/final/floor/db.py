"""floor/db.py: one small SQLite file for accounts, trades, values and the live log.

added: the lesson called this a "small helper that inserts a row into SQLite" and did not show it.
"""
import os
import sqlite3
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = os.getenv("FLOOR_DB", str(ROOT / "floor.db"))


def conn() -> sqlite3.Connection:
    # a new short connection each time: the servers, the floor and the API are separate processes
    db = sqlite3.connect(DB_PATH, timeout=30)
    db.row_factory = sqlite3.Row
    db.executescript("""
        CREATE TABLE IF NOT EXISTS accounts (name TEXT PRIMARY KEY, cash REAL, strategy TEXT);
        CREATE TABLE IF NOT EXISTS holdings (name TEXT, symbol TEXT, qty INTEGER, PRIMARY KEY (name, symbol));
        CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, name TEXT,
                                                 side TEXT, symbol TEXT, qty INTEGER, price REAL);
        CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, who TEXT, type TEXT, message TEXT);
        CREATE TABLE IF NOT EXISTS values_history (id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, name TEXT, value REAL);
    """)
    return db


def write_log(who: str, kind: str, message: str) -> None:
    with conn() as db:
        db.execute("INSERT INTO logs (ts, who, type, message) VALUES (?, ?, ?, ?)", (time.time(), who, kind, message))


def read_logs(limit: int = 100) -> list[dict]:
    with conn() as db:
        rows = db.execute("SELECT * FROM logs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def record_value(name: str, value: float) -> None:
    with conn() as db:
        db.execute("INSERT INTO values_history (ts, name, value) VALUES (?, ?, ?)", (time.time(), name, value))


def read_history(name: str, limit: int = 200) -> list[dict]:
    with conn() as db:
        rows = db.execute("SELECT ts, value FROM values_history WHERE name=? ORDER BY id DESC LIMIT ?",
                          (name, limit)).fetchall()
    return [dict(r) for r in reversed(rows)]
