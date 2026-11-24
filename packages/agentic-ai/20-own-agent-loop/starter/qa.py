"""qa.py: a fresh inspector with a real browser for every page."""
import functools
import http.server
import threading

from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters

from config import INSPECTOR_MAX_LLM_CALLS, INSPECTOR_MODEL, MCP_TIMEOUT_S, SERVER_PORT, SITE_DIR
from runner import run_once


def serve_site() -> http.server.ThreadingHTTPServer:
    """Serve the site folder on localhost so the browser can open the pages.

    added: a plain http server, because some browser tools block file:// pages.
    """
    # TODO: Serve the site folder on localhost so the browser can open the pages.
    # Hint: ThreadingHTTPServer on 127.0.0.1:SERVER_PORT serving SITE_DIR in a daemon thread
    raise NotImplementedError("TODO")


async def judge(slug: str) -> dict:
    """Open one finished page in a real browser and report whether it works."""
    # TODO: Open one finished page in a real browser and report whether it works.
    # Hint: report() records the verdict; a fresh LlmAgent with McpToolset(Playwright) and tools=[browser, report]; close the browser in finally; no verdict means failing
    raise NotImplementedError("TODO")
