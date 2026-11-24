# floor/push_server.py: one tool, same shape.
import os

import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("push")


@mcp.tool()
async def push(message: str) -> str:
    """Send a short note to my phone, e.g. after a trade."""
    # TODO: Send a short note to my phone, e.g. after a trade.
    # Hint: requests.post to the Pushover URL with user, token, message; return "sent" or "failed"
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    mcp.run(transport="stdio")
