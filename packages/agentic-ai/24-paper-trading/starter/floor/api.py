"""floor/api.py: a thin, read-only API for the dashboard. Nothing here can trade."""
from fastapi import FastAPI, HTTPException

from floor.accounts import STRATEGIES, Account
from floor.db import read_history, read_logs

app = FastAPI(title="Paper trading floor")


def _check(name: str) -> str:
    # TODO: write this function
    # Hint: raise a 404 for an unknown uncle name
    raise NotImplementedError("TODO")


@app.get("/api/roster")
def roster():
    # TODO: write this function
    # Hint: return the list of uncle names
    raise NotImplementedError("TODO")


@app.get("/api/portfolio/{name}")
def portfolio(name: str):
    # TODO: write this function
    # Hint: return Account.get(_check(name)).summary()
    raise NotImplementedError("TODO")


@app.get("/api/transactions/{name}")
def transactions(name: str):
    # TODO: write this function
    # Hint: return the uncle's recent trades
    raise NotImplementedError("TODO")


@app.get("/api/history/{name}")
def history(name: str):
    # TODO: write this function
    # Hint: return read_history(_check(name))
    raise NotImplementedError("TODO")


@app.get("/api/logs")
def logs(limit: int = 100):
    # TODO: write this function
    # Hint: return read_logs(...)
    raise NotImplementedError("TODO")
