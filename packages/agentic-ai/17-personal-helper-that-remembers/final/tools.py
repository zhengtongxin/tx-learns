"""tools.py: Kaki's toolbox. Your own tools, ready-made ones, and MCP servers."""
import os
from contextlib import AsyncExitStack, asynccontextmanager

import requests
from dotenv import load_dotenv
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_core.tools import tool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools

load_dotenv(override=True)

wiki = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())


@tool
def ping_phone(text: str) -> str:
    """Send a short push notification to my phone."""
    user, token = os.getenv("PUSHOVER_USER"), os.getenv("PUSHOVER_TOKEN")
    if not (user and token):
        # added: with no Pushover keys, print instead of failing so you can still test the flow
        print(f"[ping skipped, no Pushover keys] {text}")
        return "sent"
    requests.post("https://api.pushover.net/1/messages.json",
                  data={"token": token, "user": user, "message": text}, timeout=10)
    return "sent"


@tool
def ask_human(instructions: str) -> str:
    """Ask me to do something only a human can do (login, captcha), with exact steps."""
    return "The human says it's done. Continue."


def make_search_tool():
    """Web search through Serper, or None when there is no key."""
    # added: skip the search tool when SERPER_API_KEY is missing, so the rest still works
    if not os.getenv("SERPER_API_KEY"):
        return None
    from langchain_community.tools import GoogleSerperRun
    from langchain_community.utilities import GoogleSerperAPIWrapper
    return GoogleSerperRun(api_wrapper=GoogleSerperAPIWrapper())


@asynccontextmanager
async def open_toolbox(workspace: str):
    """Open the MCP servers and yield the full tool list. Closes everything on exit.

    added: the lesson's "one session, one task" fix. This one function opens AND closes the
    sessions in the same asyncio task, because it wraps the whole run.
    """
    workspace = os.path.abspath(workspace)
    os.makedirs(workspace, exist_ok=True)
    mcp_servers = {
        "browser": {"transport": "stdio", "command": "npx", "args": ["@playwright/mcp@latest", "--isolated"]},
        "files": {"transport": "stdio", "command": "npx",
                  "args": ["-y", "@modelcontextprotocol/server-filesystem", workspace]},
    }
    # keep each session open so the browser remembers its tabs
    client = MultiServerMCPClient(mcp_servers)
    async with AsyncExitStack() as stack:
        mcp_tools = []
        for name in mcp_servers:
            session = await stack.enter_async_context(client.session(name))
            mcp_tools += await load_mcp_tools(session)
        search = make_search_tool()
        own = [t for t in (search, wiki, ping_phone, ask_human) if t is not None]
        yield own + mcp_tools
