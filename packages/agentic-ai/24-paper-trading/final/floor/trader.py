"""floor/trader.py: one uncle (a trader agent) and his researcher (an agent used as a tool)."""
import os
import secrets
import sys
from contextlib import AsyncExitStack

from agents import Agent, Runner, trace
from agents.mcp import MCPServerStdio, create_static_tool_filter

from floor.accounts import STRATEGIES
from floor.db import DB_PATH, ROOT

STRATEGY_NOTE = ("Look at how your past trades actually performed, "
                 "and update your strategy if the results say you should.")
RESEARCH_RULES = "Research the ticker you are asked about: news first, then context. Reply in three lines."


def trader_rules(name):
    return f"{STRATEGIES[name]} Trade only KOPI, ROTI, TEHT, NASI. Never guess prices. {STRATEGY_NOTE}"


async def build_message(name):
    return f"You are {name}. Check your account and strategy, trade if it is worthwhile, then push a short note."


def make_trace_id(tag):  # "trace_" + 32 chars; the name rides in front
    return "trace_" + (tag + "0" + secrets.token_hex(16))[:32]


only_search = create_static_tool_filter(allowed_tool_names=["tavily_search"])


def _server(command, args, env=None):
    params = {"command": command, "args": args, "cwd": str(ROOT)}
    if env:
        params["env"] = env
    return MCPServerStdio(params, client_session_timeout_seconds=120)  # slow first starts need time


def trader_servers():
    # added: `python -m` with the same Python, so you do not need uv. Keys the servers need are
    # passed in env, because stdio servers do not inherit your whole environment.
    shared = {"FLOOR_DB": DB_PATH}
    push_env = dict(shared, PUSHOVER_USER=os.getenv("PUSHOVER_USER", ""), PUSHOVER_TOKEN=os.getenv("PUSHOVER_TOKEN", ""))
    return [_server(sys.executable, ["-m", "floor.accounts_server"], shared),
            _server(sys.executable, ["-m", "floor.push_server"], push_env),
            _server(sys.executable, ["-m", "floor.market_server"], shared)]


def researcher_servers(name):
    servers = [_server("uvx", ["mcp-server-fetch"])]
    if os.getenv("TAVILY_API_KEY"):  # added: no key, no search server; the researcher still has fetch and memory
        servers.append(MCPServerStdio(
            {"command": "npx", "args": ["-y", "tavily-mcp@latest"], "env": {"TAVILY_API_KEY": os.getenv("TAVILY_API_KEY")}},
            tool_filter=only_search, client_session_timeout_seconds=120))
    os.makedirs("memory", exist_ok=True)
    servers.append(_server("npx", ["-y", "@modelcontextprotocol/server-memory"],
                           {"MEMORY_FILE_PATH": os.path.abspath(f"memory/{name.lower()}.json")}))
    return servers


async def run_uncle(name: str, model: str | None = None):
    model = model or os.getenv("TRADER_MODEL", "gpt-4o-mini")  # small model by default: it costs less
    async with AsyncExitStack() as stack:  # opens many servers in a loop and closes them all, even on failure
        t_srv = [await stack.enter_async_context(s) for s in trader_servers()]
        r_srv = [await stack.enter_async_context(s) for s in researcher_servers(name)]
        researcher = Agent(name="Researcher", instructions=RESEARCH_RULES, model=model, mcp_servers=r_srv)
        uncle = Agent(name=name, instructions=trader_rules(name), model=model, mcp_servers=t_srv,
                      tools=[researcher.as_tool(tool_name="Researcher",
                                                tool_description="Research news and prices for a ticker")])
        with trace(f"{name}-trading", trace_id=make_trace_id(name.lower())):
            await Runner.run(uncle, await build_message(name), max_turns=30)  # max_turns stops a runaway run
