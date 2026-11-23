# Agent to agent

Fills the planned lesson "Agent-to-agent protocols" under "Framework tour".

## My example for the lesson

My neighbourhood has a famous char kuey teow uncle, but he only fries noodles. He doesn't take drink orders. The kopitiam next door sells drinks, but no food. When a customer at the kopitiam wants CKT, the kopitiam auntie doesn't learn to fry noodles. She **walks over, reads the uncle's signboard** (what he sells, prices, where to order), passes the order, and brings the plate back.

That's A2A (Agent2Agent):

- the uncle is a **remote agent** running in its own process,
- the signboard is his **agent card** (a JSON file at a well-known URL saying his name, his skills and his address),
- the auntie is a **local agent** that treats the uncle like one of her own helpers.

Before A2A, I needed the basics: building a single agent in Google's ADK (Agent Development Kit), with tools, MCP and a loop. My running example is a tiny SQLite "order board": the agent gets one goal ("prepare tomorrow's stock list from orders.txt and write it to stock.txt"), writes its own steps under it, and ticks them off.

## Part 1: Create and run an ADK agent

```bash
pip install "google-adk[a2a,mcp]" python-dotenv requests
# Node + npx for the filesystem MCP server
```

Env var names: `GOOGLE_API_KEY`, `GOOGLE_GENAI_USE_VERTEXAI` (set to `FALSE` to use the plain Gemini API key), plus `PUSHOVER_USER` / `PUSHOVER_TOKEN` for the notify tool.

```python
import os
from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.runners import InMemoryRunner

os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
load_dotenv(override=True)

MODEL = "gemini-2.5-flash"

helper = LlmAgent(
    model=MODEL,
    name="counter_helper",
    instruction="You help a kopitiam owner. Answer in one short sentence.",
)

events = await InMemoryRunner(agent=helper).run_debug("How do you say 'less sugar' in Hokkien?", verbose=True)
```

An `LlmAgent` is just a model plus `instruction`. `run_debug` creates a session, sends a message and prints the trace. It's only for experimenting.

## Part 2: Tools and MCP

A tool is a typed function with a docstring. No decorator is needed, because ADK reads the type hints and the docstring.

```python
import board   # my tiny sqlite helper: add_goal, add_step, list_todos, complete_todo

def show_board() -> list[dict]:
    """List every todo. A goal has parent_id None; a step has its goal's id."""
    return board.list_todos()

def plan_steps(goal_id: int, steps: list[str]) -> dict:
    """Add an ordered list of steps under a goal."""
    return {"step_ids": [board.add_step(goal_id, s) for s in steps]}

def tick(task_id: int, result: str) -> str:
    """Mark a step or goal done with a one-line result."""
    board.complete_todo(task_id, result)
    return "done"
```

MCP tools come from a toolset. I scope the filesystem server to one folder, so the agent can't touch anything else (MCP gets its own topic later on the site; one line is enough here: "a standard plug for tools someone else wrote"):

```python
from pathlib import Path
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters

shop = Path("shop_files").resolve()
files = McpToolset(connection_params=StdioConnectionParams(
    server_params=StdioServerParameters(
        command="npx", args=["-y", "@modelcontextprotocol/server-filesystem", str(shop)], cwd=str(shop)),
    timeout=30,
))

worker = LlmAgent(model=MODEL, name="stock_worker",
                  instruction="Work the pending goal: plan steps, do them with file tools, tick each off, close the goal.",
                  tools=[show_board, plan_steps, tick, files])
```

## Part 3: The real run loop: Runner, session, events

For real code I own the session and iterate events with `run_async`:

```python
from google.genai import types

runner = InMemoryRunner(agent=worker)
session = await runner.session_service.create_session(app_name=runner.app_name, user_id="towkay")

async for ev in runner.run_async(user_id="towkay", session_id=session.id,
                                 new_message=types.UserContent("Please work the pending goal.")):
    for call in ev.get_function_calls():
        print("tool:", call.name, call.args)
    if ev.is_final_response():
        print(ev.content.parts[0].text)
```

`InMemoryRunner` forgets everything when the process stops, and a plain `Runner` with a database session service is what you'd use in production. If I package the agent as a folder (`agent.py` exposing `root_agent`, scaffolded with `adk create my_agent`), `adk web` gives a visual trace where every tool and MCP call lights up. That's the nicest debugging UI I've seen so far.

## Part 4: A2A, exposing one agent and calling it from another

**Server side** (the noodle uncle), in its own process:

```python
# ckt_server.py
from google.adk.agents import LlmAgent
from google.adk.a2a.utils.agent_to_a2a import to_a2a

uncle = LlmAgent(
    model="gemini-2.5-flash",
    name="noodle_uncle",
    description="Takes char kuey teow orders and confirms them with a price.",
    instruction="Confirm the CKT order (spicy level, add cockles or not) and give the price in RM.",
)
a2a_app = to_a2a(uncle, port=8001)   # serves the agent card + A2A endpoint
```

```bash
uvicorn ckt_server:a2a_app --host localhost --port 8001
curl http://localhost:8001/.well-known/agent-card.json    # read the signboard
```

**Client side** (the kopitiam auntie):

```python
from google.adk.agents import LlmAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent, AGENT_CARD_WELL_KNOWN_PATH

uncle = RemoteA2aAgent(
    name="noodle_uncle",
    description="Remote stall that takes char kuey teow orders.",
    agent_card=f"http://localhost:8001{AGENT_CARD_WELL_KNOWN_PATH}",
)

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="kopitiam_auntie",
    instruction="Handle drinks yourself. For any char kuey teow order, delegate to noodle_uncle.",
    sub_agents=[uncle],
)
```

The remote agent looks exactly like a local sub-agent. The difference is that it's another process (or another company's server), possibly written in a different framework.

## What confused me

- **No auto-discovery.** I expected A2A agents to find each other. They don't: the client is pointed at a known card URL. Also, `agent_card=` takes the *full* card URL, so I have to join the host with the well-known path myself, not pass a bare host.
- **The port appears twice.** The port given to `to_a2a(..., port=8001)` is what the card *advertises*. If uvicorn runs on a different `--port`, the card points at the wrong place and calls fail quietly.
- **`adk web` only lists agents in the folder you launch it from**, and an old `adk web` still running on the same port gets in the way. Stop it (Ctrl-C) before starting the A2A demo's own one. ADK also prints a lot of `[EXPERIMENTAL]` warnings, which I filter with `warnings.filterwarnings` so the trace is readable.
