"""floor/accounts_server.py: my own FastMCP server. It holds cash and shares for each uncle."""
import json

from mcp.server.fastmcp import FastMCP

from floor.accounts import Account
from floor.market import get_price

mcp = FastMCP("accounts")


@mcp.tool()
async def get_balance(name: str) -> str:
    """Cash, total value and profit so far for one uncle, in S$."""
    # TODO: Cash, total value and profit so far for one uncle, in S$.
    # Hint: Account.get(name).summary() and return the cash, value and profit as JSON text
    raise NotImplementedError("TODO")


@mcp.tool()
async def get_holdings(name: str) -> str:
    """The shares one uncle holds, as JSON {symbol: quantity}."""
    # TODO: The shares one uncle holds, as JSON {symbol: quantity}.
    # Hint: return json.dumps(Account.get(name).holdings())
    raise NotImplementedError("TODO")


@mcp.tool()
async def get_transactions(name: str) -> str:
    """The most recent trades of one uncle, newest first. Use it to review how past trades performed."""
    # added: the lesson says uncles review past trades, so they need a tool to read them
    # TODO: The most recent trades of one uncle, newest first. Use it to review ho
    # Hint: return json.dumps(Account.get(name).transactions())
    raise NotImplementedError("TODO")


@mcp.tool()
async def buy_shares(name: str, symbol: str, qty: int) -> str:
    """Buy shares at the current price from this account's cash. Fails if cash is short."""
    # TODO: Buy shares at the current price from this account's cash. Fails if cas
    # Hint: return Account.get(name).buy(symbol, qty, get_price(symbol))
    raise NotImplementedError("TODO")


@mcp.tool()
async def sell_shares(name: str, symbol: str, qty: int) -> str:
    """Sell shares you hold at the current price."""
    # TODO: Sell shares you hold at the current price.
    # Hint: return Account.get(name).sell(symbol, qty, get_price(symbol))
    raise NotImplementedError("TODO")


@mcp.tool()
async def change_strategy(name: str, new_strategy: str) -> str:
    """Replace this uncle's written strategy. Use it only after reviewing real results."""
    # TODO: Replace this uncle's written strategy. Use it only after reviewing rea
    # Hint: return Account.get(name).set_strategy(new_strategy)
    raise NotImplementedError("TODO")


@mcp.resource("strategy://{name}")
async def strategy_page(name: str) -> str:
    """The written strategy of one uncle."""
    # TODO: The written strategy of one uncle.
    # Hint: return Account.get(name).strategy
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    mcp.run(transport="stdio")
