# floor/market_server.py: prices come from the simulator, so a real provider can replace it later.
from mcp.server.fastmcp import FastMCP

from floor.market import BASE, get_price

mcp = FastMCP("market")


@mcp.tool()
async def lookup_price(symbol: str) -> float:
    """Latest price of a ticker, in S$. Tickers: KOPI, ROTI, TEHT, NASI."""
    if symbol not in BASE:  # added: a clear error instead of a crash
        raise ValueError(f"Unknown ticker {symbol}. Use one of: {', '.join(BASE)}")
    return get_price(symbol)


if __name__ == "__main__":
    mcp.run(transport="stdio")
