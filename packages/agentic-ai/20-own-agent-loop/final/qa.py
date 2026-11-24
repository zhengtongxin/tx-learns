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
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    handler = functools.partial(Quiet, directory=str(SITE_DIR))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", SERVER_PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


async def judge(slug: str) -> dict:
    """Open one finished page in a real browser and report whether it works."""
    page = SITE_DIR / slug / "index.html"
    if not page.exists():
        return {"works": False, "note": "no page was written"}  # added: no need to spend model calls
    uri = f"http://127.0.0.1:{SERVER_PORT}/{slug}/index.html"
    verdict = {}

    def report(works: bool, note: str) -> dict:
        """Record whether the page loads and the widget works, with one short note."""
        verdict.update(works=works, note=note)
        return {"ok": True}

    browser = McpToolset(connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="npx", args=["-y", "@playwright/mcp@latest", "--browser", "chrome", "--isolated"]),
        timeout=MCP_TIMEOUT_S))  # the first browser call starts slowly
    inspector = LlmAgent(
        name="inspector", model=INSPECTOR_MODEL,
        instruction=f"Open {uri}, try the widget, check the console, then call report.",
        tools=[browser, report])
    try:
        await run_once(inspector, f"Inspect {uri}", max_llm_calls=INSPECTOR_MAX_LLM_CALLS)
    finally:
        await browser.close()
    return verdict or {"works": False, "note": "no verdict"}  # nobody reported: counts as failing
