# Why MCP

Fills the planned lesson "Why MCP exists" under "MCP".

## My example for the lesson

Every kopitiam stall used to take payment its own way: one had a DuitNow QR, one wanted exact cash, one had a card terminal from a bank I'd never heard of. Then most stalls switched to the **same QR standard**, and now any customer's banking app can pay any stall, without the stall owner caring which bank the customer uses.

MCP (Model Context Protocol) is that shared QR standard, but for agent tools:

- the **stall** is an MCP **server**: a separate program offering tools (and resources and prompts),
- the **customer's app** is the MCP **client** inside my agent framework,
- the **standard** means I don't write glue code for each tool. Someone writes a "browser" or "files" server once, and every framework can use it.

MCP isn't magic. It's still just tools. What's new is that the tools live in *someone else's program*, and I plug them in the same way every time.

## Part 1: Plug in a ready-made local server

I use the OpenAI Agents SDK as the client (lessons 07-11 on the site already use it). A local server is launched as a subprocess and talks over **stdio**.

```bash
pip install openai-agents python-dotenv
# uv/uvx for Python servers, Node + npx for JS servers
```

Env var names: `OPENAI_API_KEY`.

```python
from agents import Agent, Runner, trace
from agents.mcp import MCPServerStdio

fetch = {"command": "uvx", "args": ["mcp-server-fetch"]}

async with MCPServerStdio(params=fetch, client_session_timeout_seconds=60) as server:
    tools = await server.list_tools()
for t in tools:
    print(t.name, "-", t.description[:80])
    print(t.inputSchema)     # the JSON schema the model sees
```

Listing the tools first is a good habit. The description and input schema are exactly what the LLM reads.

## Part 2: Two JavaScript servers and one agent

Playwright gives the agent a real browser, and the filesystem server gives it read/write access to **one folder only**.

```python
import os
box = os.path.abspath("sandbox"); os.makedirs(box, exist_ok=True)

browser = {"command": "npx", "args": ["@playwright/mcp@latest"]}
files   = {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", box]}

RULES = """You browse the web to get things done. Close cookie banners and pop-ups.
If one site is useless, try another. Only write files inside sandbox/."""

async with MCPServerStdio(params=browser, client_session_timeout_seconds=60) as b, \
           MCPServerStdio(params=files, client_session_timeout_seconds=60) as f:
    agent = Agent(name="recipe_hunter", instructions=RULES, model="gpt-4o-mini", mcp_servers=[b, f])
    with trace("recipe_hunter"):
        res = await Runner.run(agent, "Find a good Penang asam laksa recipe and save a markdown summary to sandbox/laksa.md")
print(res.final_output)
```

The agent decides when to browse and when to write. I never wrote a single browser or file function.

## Part 3: A remote server (streamable HTTP)

Not every server runs on my machine. A **remote** server is just a URL, with nothing to install. This one serves up-to-date library docs:

```python
from agents.mcp import MCPServerStreamableHttp

q = "In the latest version of the OpenAI Agents SDK, how do I filter which MCP tools an agent can see?"

async with MCPServerStreamableHttp(name="docs", params={"url": "https://mcp.context7.com/mcp", "timeout": 60}) as docs:
    agent = Agent(name="docs_expert", instructions="Answer using the docs tools. Say so if unsure.",
                  model="gpt-4o-mini", mcp_servers=[docs])
    print((await Runner.run(agent, q)).final_output)
```

Asking the same question *without* the server is a good comparison. The bare model often guesses at new features, and with live docs it doesn't need to.

## Part 4: When to use MCP

- **Use it** to plug in tools other people maintain (browser, files, search, a SaaS product's official server), or to share my tools across several frameworks or apps.
- **Don't bother** for one small function used by one agent. A plain `@function_tool` is simpler.
- **Be careful**: a server is code running on my machine with my permissions. I only use servers from sources I trust, scope file servers to one folder, and check what a server's tools can do before giving them to an agent. There are MCP marketplaces listing thousands of servers, which is exactly why caution matters.

Local (stdio) vs remote (HTTP):

| | Local stdio | Remote HTTP |
|---|---|---|
| Runs | subprocess on my machine | someone's server |
| Setup | `command` + `args` | `url` |
| Good for | files, browser, my own code | hosted services, docs, SaaS |

## What confused me

- **The Windows `fileno` crash.** In a Jupyter kernel on Windows, a stdio server's stderr has no real file handle, so the launch dies with `io.UnsupportedOperation: fileno`. The fix is to wrap the SDK's `stdio_client` with `functools.partial(..., errlog=subprocess.DEVNULL)` before creating servers. On Windows, an `npx` path with spaces (`C:\Program Files\...`) can also break the launch.
- **Timeouts on first run.** `npx`/`uvx` download the server the first time, which can take longer than the default session timeout, so the first call "hangs" and fails. I set `client_session_timeout_seconds=60` everywhere.
- **The server lives only inside `async with`.** Once the block ends, the subprocess is gone. I have to create *and run* the agent inside the block, not just list tools there and use them later.
