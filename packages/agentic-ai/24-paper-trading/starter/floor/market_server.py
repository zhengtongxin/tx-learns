# floor/market_server.py: prices come from the simulator, so a real provider can replace it later.
from mcp.server.fastmcp import FastMCP

from floor.market import BASE, get_price

mcp = FastMCP("market")


@mcp.tool()
async def lookup_price(symbol: str) -> float:
    """Latest price of a ticker, in S$. Tickers: KOPI, ROTI, TEHT, NASI."""
    # TODO: Latest price of a ticker, in S$. Tickers: KOPI, ROTI, TEHT, NASI.
    # Hint: return get_price(symbol) (and reject unknown tickers clearly)
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    mcp.run(transport="stdio")
