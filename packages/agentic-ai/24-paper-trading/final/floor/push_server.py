# floor/push_server.py: one tool, same shape.
import os

import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("push")


@mcp.tool()
async def push(message: str) -> str:
    """Send a short note to my phone, e.g. after a trade."""
    user, token = os.getenv("PUSHOVER_USER"), os.getenv("PUSHOVER_TOKEN")
    if not (user and token):
        return "skipped: no push keys set"  # added: play money, so no keys is fine
    r = requests.post("https://api.pushover.net/1/messages.json",
                      data={"user": user, "token": token, "message": message}, timeout=10)
    return "sent" if r.ok else "failed"


if __name__ == "__main__":
    mcp.run(transport="stdio")
