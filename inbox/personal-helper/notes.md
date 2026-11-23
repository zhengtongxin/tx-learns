# A personal helper agent

Fills the planned lesson "Project: a personal helper that remembers" under "Graphs and state".

## My example for the lesson

My helper is called **Kaki** (like "my kaki", my buddy). I give it an errand *and* a definition of done:

> Errand: "Find three kopitiams within 2 km of SS2 that open before 7am and sell half-boiled eggs. Write them to `kopi.md` and ping my phone with the best one."
> Done means: "kopi.md lists three named places with opening time and address, and one notification was sent."

Kaki is two parts, like a shop with a worker and a supervisor:

- the **worker** (the runner who goes out and does the errand: browser, search, files),
- the **checker** (the supervisor who reads the worker's report against the "done means" line and says *accept*, *try again* with feedback, or *ask the boss*).

And before anything leaves the shop, like pinging my phone, the worker has to **ask me first**. Kaki remembers the errand across turns through a checkpointer and a `thread_id` (from the "Agents as graphs" lesson).

## Part 1: The worker, one create_agent with a stack of middleware

```bash
pip install langchain langchain-openai langgraph langchain-community langchain-mcp-adapters wikipedia gradio python-dotenv
# plus Node + npx for the browser and filesystem MCP servers
```

Env var names: `OPENAI_API_KEY`, `SERPER_API_KEY`, `PUSHOVER_USER`, `PUSHOVER_TOKEN`.

```python
from datetime import datetime
from langchain.agents import create_agent
from langchain.agents.middleware import (
    HumanInTheLoopMiddleware, ModelCallLimitMiddleware, PIIMiddleware, TodoListMiddleware,
)
from langgraph.checkpoint.memory import InMemorySaver

RUNNER_PROMPT = """You are Kaki, a practical helper who runs errands for me.
Use the browser to read pages (snapshot first, click only when needed), search when useful,
and save anything you produce into the workspace. If a page needs a login or captcha,
call ask_human with exact steps. Stop when the 'done means' line is satisfied."""

worker = create_agent(
    model="openai:gpt-4o-mini",
    tools=all_tools,   # see Part 3
    system_prompt=f"{RUNNER_PROMPT}\nToday is {datetime.now():%A %d %B %Y}.",
    middleware=[
        TodoListMiddleware(),                         # keeps a visible plan
        PIIMiddleware("email"),                       # redact emails
        PIIMiddleware("credit_card", apply_to_tool_results=True),
        ModelCallLimitMiddleware(run_limit=30),       # stop runaway cost
        HumanInTheLoopMiddleware(interrupt_on={"ping_phone": True, "ask_human": True}),
    ],
    checkpointer=InMemorySaver(),
)
```

I also add a small custom middleware that catches tool exceptions and returns them as a `ToolMessage` ("that failed: ..., try another way"), so one flaky browser click doesn't crash the whole run.

## Part 2: Human-in-the-loop

With `HumanInTheLoopMiddleware`, the run **pauses** before a listed tool. The result contains `__interrupt__`, and I resume with a `Command` that holds one decision per paused call:

```python
from langgraph.types import Command

cfg = {"configurable": {"thread_id": "errand-1"}}
res = await worker.ainvoke({"messages": [{"role": "user", "content": errand}]}, cfg)

if "__interrupt__" in res:
    req = res["__interrupt__"][0].value["action_requests"][0]
    print("Kaki wants to:", req["description"])
    res = await worker.ainvoke(Command(resume={"decisions": [{"type": "approve"}]}), cfg)
    # or: {"type": "reject", "message": "Don't ping me after 10pm"}
    # or: {"type": "edit", ...} to change the arguments first
```

A rejection doesn't end the run. The worker sees my message and carries on, which feels very natural.

## Part 3: Tools (my own + ready-made + MCP)

```python
import os, requests
from langchain_core.tools import tool
from langchain_community.tools import GoogleSerperRun, WikipediaQueryRun
from langchain_community.utilities import GoogleSerperAPIWrapper, WikipediaAPIWrapper

search = GoogleSerperRun(api_wrapper=GoogleSerperAPIWrapper())
wiki = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

@tool
def ping_phone(text: str) -> str:
    """Send a short push notification to my phone."""
    requests.post("https://api.pushover.net/1/messages.json",
                  data={"token": os.getenv("PUSHOVER_TOKEN"), "user": os.getenv("PUSHOVER_USER"), "message": text})
    return "sent"

@tool
def ask_human(instructions: str) -> str:
    """Ask me to do something only a human can do (login, captcha), with exact steps."""
    return "The human says it's done. Continue."

mcp_servers = {
    "browser": {"transport": "stdio", "command": "npx", "args": ["@playwright/mcp@latest", "--isolated"]},
    "files":   {"transport": "stdio", "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "/abs/path/to/workspace"]},
}
```

The browser has to keep its state (open tabs, cookies) between tool calls, so I hold **persistent MCP sessions** open with `client.session(name)` plus `load_mcp_tools(session)`, instead of the default open-per-call behaviour.

## Part 4: The checker loop (my own Python around the agent)

The checker is just a structured-output LLM. The loop is plain Python, not a graph:

```python
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

class Verdict(BaseModel):
    feedback: str = Field(description="Short, concrete feedback")
    done: bool = Field(description="Has the 'done means' line been met?")
    need_human: bool = Field(description="Is the worker stuck or asking a question?")

checker = ChatOpenAI(model="gpt-4o-mini").with_structured_output(Verdict)

async def run_errand(errand: str, done_means: str, cfg: dict, tries: int = 3):
    msg = {"messages": [{"role": "user", "content": f"{errand}\n\nDone means: {done_means}"}]}
    for _ in range(tries):
        res = await worker.ainvoke(msg, cfg)
        if "__interrupt__" in res:
            return res                      # let the UI show an Approve button
        reply = res["messages"][-1].content
        used = [c["name"] for m in res["messages"] for c in (getattr(m, "tool_calls", None) or [])]
        v = await checker.ainvoke(
            f"Errand: {errand}\nDone means: {done_means}\nTools used: {used}\nReply: {reply}\n"
            "Judge using the tool calls as evidence.")
        if v.done or v.need_human:
            return reply, v.feedback
        msg = {"messages": [{"role": "user", "content": f"Not done yet. Feedback: {v.feedback}. Keep going."}]}
    return reply, "gave up after max tries"
```

Giving the checker the **list of tools actually called** matters. Otherwise the worker can just *say* "notification sent" without calling the tool. A small Gradio app (`gr.Blocks` with an errand box, a "done means" box, the live todo list and an Approve button) makes it feel like a real product.

## What confused me

- **stdio MCP sessions and asyncio tasks.** A stdio session has to be opened and closed in the *same* asyncio task. Opening it in one place and closing it from somewhere else (say, a Gradio callback) leads to confusing cancel-scope errors. The fix is one background task that owns the sessions, opens them, waits on an `Event`, and unwinds when told to stop.
- **Approving several paused calls.** If the worker pauses on two tools at once, the resume needs *two* decisions (`[{"type": "approve"}] * n`). Sending one just isn't enough.
- **Infinite polishing.** Without `MAX_TRIES` and `ModelCallLimitMiddleware`, a strict checker plus an eager worker can loop for a long time and cost real money. I keep both limits on.
