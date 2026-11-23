# Many MCP servers

Fills the planned lesson "Many MCP servers, local and remote" under "MCP".

## My example for the lesson

A good kopitiam auntie is great at her job because of **context**, not because she's clever:

- **Memory**: she remembers Uncle Lim takes kopi-C kurang manis and always sits by the fan.
- **Fresh news**: she hears this morning that the road outside is closed for a marathon, so fewer customers will come.
- **Her own notes**: she keeps a little book of supplier prices she's collected over months and flips back to it.
- **Live systems**: she checks the e-wallet terminal to see if today's payments went through.

Agents are the same. "Context engineering" means choosing what the model gets to see. Each of those four kinds of context can be its own MCP server, and one agent can use several at once.

## Part 1: Long-term memory (knowledge graph server)

The official memory server stores **entities**, **observations** about them and **relations** between them, in a JSON file that survives between runs.

```bash
pip install openai-agents python-dotenv
# Node + npx, uv/uvx
```

Env var names: `OPENAI_API_KEY`, `TAVILY_API_KEY`, and the server-side settings `MEMORY_FILE_PATH`, `QDRANT_LOCAL_PATH`, `COLLECTION_NAME`.

```python
import os
from agents import Agent, Runner, trace
from agents.mcp import MCPServerStdio

memory = {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"],
          "env": {"MEMORY_FILE_PATH": os.path.abspath("memory/regulars.json")}}

RULES = "Use your entity tools as long-term memory: store facts about people and recall them later."

async with MCPServerStdio(params=memory, client_session_timeout_seconds=60) as mem:
    a = Agent(name="auntie", instructions=RULES, model="gpt-4o-mini", mcp_servers=[mem])
    await Runner.run(a, "I'm Lim. Kopi-C kurang manis, and I like the table by the fan.")

# ...later, a brand new run...
async with MCPServerStdio(params=memory, client_session_timeout_seconds=60) as mem:
    a = Agent(name="auntie", instructions=RULES, model="gpt-4o-mini", mcp_servers=[mem])
    print((await Runner.run(a, "I'm Lim. The usual?")).final_output)
```

## Part 2: Web search, filtered to one tool

A search MCP server keeps the agent current. Many servers expose lots of tools (search, extract, crawl...), and more tools means more confusion and more tokens. The SDK lets me **filter** them:

```python
from datetime import date
from agents.mcp import create_static_tool_filter

search = {"command": "npx", "args": ["-y", "tavily-mcp@latest"],
          "env": {"TAVILY_API_KEY": os.getenv("TAVILY_API_KEY")}}
only_search = create_static_tool_filter(allowed_tool_names=["tavily_search"])

async with MCPServerStdio(params=search, client_session_timeout_seconds=60, tool_filter=only_search) as s:
    a = Agent(name="news", instructions="Search the web and summarise briefly.", model="gpt-4o-mini", mcp_servers=[s])
    print((await Runner.run(a, f"Any road closures in Petaling Jaya this weekend? Today is {date.today()}.")).final_output)
```

Note that the API key goes to the **server** through its `env`, not to the agent.

## Part 3: Agentic RAG (the agent builds its own notebook)

Normal RAG (retrieval-augmented generation: look things up, then answer) loads documents into a vector store up front. In **agentic RAG** the agent itself decides what to store and when to search. Here a Qdrant MCP server runs locally on disk:

```python
from pathlib import Path

vectors = {"command": "uvx", "args": ["mcp-server-qdrant"],
           "env": {"QDRANT_LOCAL_PATH": str(Path("memory/qdrant")), "COLLECTION_NAME": "suppliers"}}

NOTES = """You research suppliers on the web and keep a knowledge base.
Store anything worth keeping. When asked what you know, search the knowledge base and answer from it."""

# Run 1: search + store
async with MCPServerStdio(params=search, tool_filter=only_search, client_session_timeout_seconds=60) as s, \
           MCPServerStdio(params=vectors, client_session_timeout_seconds=120) as v:
    a = Agent(name="buyer", instructions=NOTES, model="gpt-4o-mini", mcp_servers=[s, v])
    await Runner.run(a, "Find current wholesale prices for condensed milk in the Klang Valley and remember them.")

# Run 2: no web, only the knowledge base
async with MCPServerStdio(params=vectors, client_session_timeout_seconds=120) as v:
    a = Agent(name="buyer", instructions=NOTES, model="gpt-4o-mini", mcp_servers=[v])
    print((await Runner.run(a, "From your notes: what does condensed milk cost wholesale?")).final_output)
```

Run 2 has no internet, so anything it answers came from what run 1 stored. That makes it easy to see the "retrieval" half working.

## Part 4: Live integrations, local vs remote

The fourth kind of context is a live system: payments, inventory, market data, a CRM. Many companies now publish an official MCP server. Two ways to plug one in:

- **Local stdio**: run their package on my machine with `uvx`/`npx` plus an API key in `env` (for example `uvx --from git+https://...@vX.Y mcp_xxx`). I control the version, and it runs with my permissions.
- **Remote HTTP**: `MCPServerStreamableHttp(params={"url": ...})`. There's nothing to install, the provider hosts it, and I trust their uptime and their auth.

I also make the code degrade gracefully: if the integration's key isn't set, I skip that server (or use a local stub) so the rest of the agent still works.

```python
servers = [mem_server, search_server]
if os.getenv("PAYMENTS_API_KEY"):
    servers.append(payments_server)
```

The trace view of the agent SDK shows which server each tool call went to, which is how I check the agent used the context I meant it to.

## What confused me

- **Too many tools.** Connecting four servers can give the model 30+ tools, and it starts picking odd ones (crawl instead of search). `create_static_tool_filter` plus a sentence in the instructions about *when* to use each source fixed most of that.
- **Third-party servers pinning nothing.** One market-data server imported an API that the mcp SDK 2.0 removed, and it doesn't cap its dependency, so a fresh `uvx` run broke. Pinning with `uvx --with "mcp<2"` and a git tag (`@v0.10.0`) made it reproducible.
- **Slow cold starts.** The vector server downloads an embedding model the first time, so I give it a 120-second session timeout. Memory and vectors are plain files (`memory/*.json`, `memory/qdrant`), so deleting the folder is a full reset.
