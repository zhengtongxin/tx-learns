"""worker.py: Kaki, one agent with a stack of middleware."""
from datetime import datetime

from langchain.agents import create_agent
from langchain.agents.middleware import (
    HumanInTheLoopMiddleware, ModelCallLimitMiddleware, PIIMiddleware, TodoListMiddleware,
)
from langgraph.checkpoint.memory import InMemorySaver

MODEL = "openai:gpt-5.4-mini"  # the model name the lesson uses

RUNNER_PROMPT = """You are Kaki, a practical helper who runs errands for me.
Read pages with the browser (snapshot first, click only when needed), search when useful,
and save anything you produce into the workspace. If a page needs a login or captcha,
call ask_human with exact steps. Stop when the 'done means' line is satisfied."""


def build_worker(all_tools):
    # added: a function, because the tools only exist once the MCP sessions are open
    # TODO: write this function
    # Hint: create_agent(model=..., tools=all_tools, system_prompt=..., middleware=[TodoList, PII x2, ModelCallLimit(run_limit=30), HumanInTheLoop(interrupt_on={...})], checkpointer=InMemorySaver())
    raise NotImplementedError("TODO")
