"""floor/api.py: a thin, read-only API for the dashboard. Nothing here can trade."""
from fastapi import FastAPI, HTTPException

from floor.accounts import STRATEGIES, Account
from floor.db import read_history, read_logs

app = FastAPI(title="Paper trading floor")


def _check(name: str) -> str:
    if name not in STRATEGIES:
        raise HTTPException(status_code=404, detail="no such uncle")
    return name


@app.get("/api/roster")
def roster():
    return list(STRATEGIES)


@app.get("/api/portfolio/{name}")
def portfolio(name: str):
    return Account.get(_check(name)).summary()  # value, cash, holdings; nothing here can trade


@app.get("/api/transactions/{name}")
def transactions(name: str):
    return Account.get(_check(name)).transactions()


@app.get("/api/history/{name}")
def history(name: str):
    return read_history(_check(name))


@app.get("/api/logs")
def logs(limit: int = 100):
    return read_logs(min(limit, 500))
