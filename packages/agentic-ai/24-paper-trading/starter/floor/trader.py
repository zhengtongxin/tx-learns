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
    # TODO: write this function
    # Hint: f"{STRATEGIES[name]} Trade only KOPI, ROTI, TEHT, NASI. Never guess prices. {STRATEGY_NOTE}"
    raise NotImplementedError("TODO")


async def build_message(name):
    # TODO: write this function
    # Hint: tell the uncle his name and ask him to check, trade if worthwhile, then push a short note
    raise NotImplementedError("TODO")


def make_trace_id(tag):  # "trace_" + 32 chars; the name rides in front
    # TODO: write this function
    # Hint: "trace_" + (tag + "0" + secrets.token_hex(16))[:32]: the name rides in front
    raise NotImplementedError("TODO")


only_search = create_static_tool_filter(allowed_tool_names=["tavily_search"])


def _server(command, args, env=None):
    # TODO: write this function
    # Hint: MCPServerStdio(params, client_session_timeout_seconds=120)
    raise NotImplementedError("TODO")


def trader_servers():
    # added: `python -m` with the same Python, so you do not need uv. Keys the servers need are
    # passed in env, because stdio servers do not inherit your whole environment.
    # TODO: write this function
    # Hint: three servers: accounts, push, market, each started with python -m floor.<name>
    raise NotImplementedError("TODO")


def researcher_servers(name):
    # TODO: write this function
    # Hint: fetch, filtered Tavily search (only tavily_search) and memory with a per-uncle file
    raise NotImplementedError("TODO")


async def run_uncle(name: str, model: str | None = None):
    # TODO: write this function
    # Hint: AsyncExitStack opens all servers; build researcher + uncle (researcher.as_tool); Runner.run inside trace(...) with max_turns=30
    raise NotImplementedError("TODO")
