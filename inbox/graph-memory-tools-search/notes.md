# Graph memory, tools and search

Fills the planned lesson "Memory, tools and web search in a graph" under "Graphs and state".

## My example for the lesson

My cousin runs a small tuition centre above a row of shops in Kajang, and she wants to start selling breakfast to parents in the mornings. Before spending money she wants a short briefing: which breakfast items sell best near schools, what the nearby competition charges, and a recommendation.

That one job has two very different sizes:

- **Small jobs** ("what does a kopi peng cost nearby?") need one agent with a couple of tools and some memory. That's `create_agent`.
- **The big job** (plan the research, search a lot, write a file, maybe split work between helpers) is where a **deep agent** helps: it plans with a todo list, writes files and delegates to sub-agents.

## Part 1: create_agent, the one-line tool loop

Everything I wired by hand with nodes and `tools_condition` comes ready-made in one function. The model is given as a `"provider:model"` string.

```bash
pip install langchain langchain-openai langgraph langchain-community langchain-mcp-adapters deepagents
```

Env var names: `OPENAI_API_KEY`, `SERPER_API_KEY`.

```python
from langchain.agents import create_agent
from langchain_core.tools import tool

@tool
def stall_price(item: str) -> str:
    """Typical price in RM for a breakfast item near schools in Kajang."""
    return {"nasi lemak": "RM3.50", "kuih": "RM0.80 each", "milo ais": "RM2.80"}.get(item.lower(), "not sure")

@tool
def footfall(hour: int) -> str:
    """Rough number of parents passing the shop at a given hour (24h)."""
    return "about 120" if 7 <= hour <= 8 else "under 30"

helper = create_agent(
    model="openai:gpt-4o-mini",
    tools=[stall_price, footfall],
    system_prompt="You help a small shop owner plan a breakfast corner. Use your tools for numbers.",
)
out = helper.invoke({"messages": [{"role": "user", "content": "Is 7:30am busy, and what does nasi lemak go for?"}]})
print(out["messages"][-1].content)
```

`helper.get_graph().draw_mermaid_png()` shows it really is a LangGraph graph (model node ↔ tools node). Every `invoke` also has an async twin, `ainvoke`, and some tools (MCP ones) *only* work with the async one.

## Part 2: Memory, structured output, middleware

Memory works the same way as in graphs: a checkpointer plus a `thread_id`.

```python
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel, Field

chatty = create_agent(model="openai:gpt-4o-mini", tools=[stall_price], checkpointer=MemorySaver())
cfg = {"configurable": {"thread_id": "cousin"}}
chatty.invoke({"messages": [{"role": "user", "content": "My budget is RM800 for equipment."}]}, cfg)

class Plan(BaseModel):
    items: list[str] = Field(description="Breakfast items to sell")
    est_daily_sales: str = Field(description="Rough daily sales estimate in RM")

planner = create_agent(model="openai:gpt-4o-mini", tools=[stall_price, footfall], response_format=Plan)
plan = planner.invoke({"messages": [{"role": "user", "content": "Plan the menu."}]})["structured_response"]
```

**Middleware** is code that runs at fixed points in the agent loop, like before the model call or around each tool call. This one prints every tool call, which is my favourite debugging trick:

```python
from langchain.agents.middleware import wrap_tool_call

@wrap_tool_call
def spy(request, handler):
    print("tool ->", request.tool_call["name"], request.tool_call["args"])
    return handler(request)

watched = create_agent(model="openai:gpt-4o-mini", tools=[stall_price], middleware=[spy])
```

There are ready-made ones too: summarisation for long chats, PII redaction, call limits and retries.

## Part 3: Tools from an MCP server (a real browser)

Tools don't have to be my own Python functions. With `langchain-mcp-adapters`, I can load the tools an MCP server offers. The Playwright server gives an agent a real browser. It needs Node (v22-ish) and `npx`. (MCP gets its own topic later on the site; here one line is enough: "a standard plug that lets an agent use tools someone else wrote".)

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "browser": {"transport": "stdio", "command": "npx",
                "args": ["-y", "@playwright/mcp@latest", "--isolated"]},
})
browser_tools = await client.get_tools()
surfer = create_agent(model="openai:gpt-4o", tools=browser_tools,
                      system_prompt="Browse to answer. Report briefly.")
res = await surfer.ainvoke({"messages": [{"role": "user",
      "content": "Open a food delivery site and list three breakfast places in Kajang."}]})
```

## Part 4: Deep agents, with web search and sub-agents

`deepagents` wraps `create_agent` with a harness: a todo/planning tool, file tools (`write_file`, `read_file`...), and a `task` tool for delegating to sub-agents. `FilesystemBackend(..., virtual_mode=True)` keeps all file writes inside one folder.

```python
import os
from langchain_openai import ChatOpenAI
from langchain_community.tools import GoogleSerperRun
from langchain_community.utilities import GoogleSerperAPIWrapper
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend

box = os.path.abspath("workspace"); os.makedirs(box, exist_ok=True)
search = GoogleSerperRun(api_wrapper=GoogleSerperAPIWrapper())

competitor_scout = {
    "name": "competitor-scout",
    "description": "Looks up one nearby breakfast competitor and returns three facts: menu, prices, hours.",
    "system_prompt": "Research the single shop you are given with the search tool. Return three short facts.",
}

lead = create_deep_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[search],
    subagents=[competitor_scout],
    system_prompt="Plan with your todos, delegate each competitor to competitor-scout, "
                  "then write a one-page markdown briefing with a recommendation.",
    backend=FilesystemBackend(root_dir=box, virtual_mode=True),
)
lead.invoke({"messages": [{"role": "user", "content":
    "Should a tuition centre in Kajang sell breakfast to parents? Write breakfast.md."}]})
```

Each sub-agent starts with a **fresh context**, so the lead's context stays small. Sub-agents can also have their own tools and **skills**: a skill is a folder with a `SKILL.md` (a name and description in frontmatter, instructions below). Only the name and description sit in the prompt, and the full file is read when it's needed.

## What confused me

- **Sync vs async tools.** MCP tools are async. Calling `agent.invoke(...)` with them fails, and you need `await agent.ainvoke(...)`. Once one async tool is in the mix, I switch the whole call to async.
- **Windows plus Jupyter plus stdio MCP.** On Windows, the notebook kernel's stderr isn't a real file, so launching a stdio MCP server fails. The fix is to patch the adapter's `stdio_client` to send `errlog` to `subprocess.DEVNULL`. Mac/Linux don't need it.
- **Deep agent file paths are "virtual".** With `virtual_mode=True` the agent writes to paths like `/breakfast.md`, which map into my workspace folder, not my real root. I was confused until I looked in the folder. Also, it's overkill for a two-tool question: `create_agent` is cheaper and faster for that.
