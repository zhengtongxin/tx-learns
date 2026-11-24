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
    return create_agent(
        model=MODEL,
        tools=all_tools,
        system_prompt=f"{RUNNER_PROMPT}\nToday is {datetime.now():%A %d %B %Y}.",
        middleware=[
            TodoListMiddleware(),                    # keeps a visible plan
            PIIMiddleware("email"),                  # redact emails
            PIIMiddleware("credit_card", apply_to_tool_results=True),
            ModelCallLimitMiddleware(run_limit=30),  # stop runaway cost
            HumanInTheLoopMiddleware(interrupt_on={"ping_phone": True, "ask_human": True}),
        ],
        checkpointer=InMemorySaver(),
    )
