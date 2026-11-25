"""floor/accounts.py: the plain ledger class. Cash, shares and a written strategy per uncle.

added: the lesson said "Account is a plain ledger class, like Tab before" and did not show it.
Everything is play money. Nothing here talks to a real broker.
"""
import time

from floor.db import conn
from floor.market import BASE, get_price

START_CASH = 10_000.0

STRATEGIES = {
    "Wong": "Buy only solid, boring companies and hold them.",
    "Muthu": "Chase whatever is in the news.",
    "AhKow": "Trade on chart patterns.",
    "Hamid": "Buy what everyone else is selling.",
}


class Account:
    def __init__(self, name: str):
        self.name = name

    @classmethod
    def get(cls, name: str) -> "Account":
        if name not in STRATEGIES:
            raise ValueError(f"Unknown uncle {name!r}. Known: {', '.join(STRATEGIES)}")
        with conn() as db:
            db.execute("INSERT OR IGNORE INTO accounts (name, cash, strategy) VALUES (?, ?, ?)",
                       (name, START_CASH, STRATEGIES[name]))
        return cls(name)

    @property
    def cash(self) -> float:
        with conn() as db:
            return db.execute("SELECT cash FROM accounts WHERE name=?", (self.name,)).fetchone()["cash"]

    @property
    def strategy(self) -> str:
        with conn() as db:
            return db.execute("SELECT strategy FROM accounts WHERE name=?", (self.name,)).fetchone()["strategy"]

    def holdings(self) -> dict[str, int]:
        with conn() as db:
            rows = db.execute("SELECT symbol, qty FROM holdings WHERE name=? AND qty>0", (self.name,)).fetchall()
        return {r["symbol"]: r["qty"] for r in rows}

    def buy(self, symbol: str, qty: int, price: float) -> str:
        if symbol not in BASE:
            return f"Unknown ticker {symbol}. Trade only: {', '.join(BASE)}."
        if qty <= 0:
            return "Quantity must be a positive whole number."
        cost = round(price * qty, 2)
        with conn() as db:
            cash = db.execute("SELECT cash FROM accounts WHERE name=?", (self.name,)).fetchone()["cash"]
            if cost > cash:
                return f"Not enough cash: this costs S${cost:.2f} but you have S${cash:.2f}."
            db.execute("UPDATE accounts SET cash=cash-? WHERE name=?", (cost, self.name))
            db.execute("INSERT INTO holdings (name, symbol, qty) VALUES (?, ?, ?) "
                       "ON CONFLICT(name, symbol) DO UPDATE SET qty=qty+excluded.qty", (self.name, symbol, qty))
            db.execute("INSERT INTO transactions (ts, name, side, symbol, qty, price) VALUES (?, ?, 'buy', ?, ?, ?)",
                       (time.time(), self.name, symbol, qty, price))
        return f"Bought {qty} {symbol} at S${price:.2f}. Cash left: S${cash - cost:.2f}."

    def sell(self, symbol: str, qty: int, price: float) -> str:
        if qty <= 0:
            return "Quantity must be a positive whole number."
        have = self.holdings().get(symbol, 0)
        if qty > have:
            return f"You only hold {have} {symbol}."
        proceeds = round(price * qty, 2)
        with conn() as db:
            db.execute("UPDATE accounts SET cash=cash+? WHERE name=?", (proceeds, self.name))
            db.execute("UPDATE holdings SET qty=qty-? WHERE name=? AND symbol=?", (qty, self.name, symbol))
            db.execute("INSERT INTO transactions (ts, name, side, symbol, qty, price) VALUES (?, ?, 'sell', ?, ?, ?)",
                       (time.time(), self.name, symbol, qty, price))
        return f"Sold {qty} {symbol} at S${price:.2f}."

    def set_strategy(self, new_strategy: str) -> str:
        with conn() as db:
            db.execute("UPDATE accounts SET strategy=? WHERE name=?", (new_strategy, self.name))
        return "Strategy updated."

    def transactions(self, limit: int = 50) -> list[dict]:
        with conn() as db:
            rows = db.execute("SELECT ts, side, symbol, qty, price FROM transactions WHERE name=? "
                              "ORDER BY id DESC LIMIT ?", (self.name, limit)).fetchall()
        return [dict(r) for r in rows]

    def summary(self) -> dict:
        """Value, cash, holdings and profit. Read-only: nothing here can trade."""
        held = self.holdings()
        shares_value = sum(get_price(s) * q for s, q in held.items())
        value = round(self.cash + shares_value, 2)
        return {"name": self.name, "value": value, "cash": round(self.cash, 2), "holdings": held,
                "profit": round(value - START_CASH, 2), "strategy": self.strategy}
