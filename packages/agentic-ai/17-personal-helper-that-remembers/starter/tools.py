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
    # TODO: Send a short push notification to my phone.
    # Hint: requests.post to the Pushover URL with token, user and message; return "sent"
    raise NotImplementedError("TODO")


@tool
def ask_human(instructions: str) -> str:
    """Ask me to do something only a human can do (login, captcha), with exact steps."""
    # TODO: Ask me to do something only a human can do (login, captcha), with exac
    # Hint: return a fixed string such as "The human says it's done. Continue."
    raise NotImplementedError("TODO")


def make_search_tool():
    """Web search through Serper, or None when there is no key."""
    # added: skip the search tool when SERPER_API_KEY is missing, so the rest still works
    # TODO: Web search through Serper, or None when there is no key.
    # Hint: GoogleSerperRun(api_wrapper=GoogleSerperAPIWrapper()), or None without a key
    raise NotImplementedError("TODO")


@asynccontextmanager
async def open_toolbox(workspace: str):
    """Open the MCP servers and yield the full tool list. Closes everything on exit.

    added: the lesson's "one session, one task" fix. This one function opens AND closes the
    sessions in the same asyncio task, because it wraps the whole run.
    """
    # TODO: Open the MCP servers and yield the full tool list. Closes everything o
    # Hint: MultiServerMCPClient + AsyncExitStack: for each server, enter client.session(name) and load_mcp_tools(session); yield own tools + MCP tools
    raise NotImplementedError("TODO")
