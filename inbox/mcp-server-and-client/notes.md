# An MCP server and client

Fills the planned lesson "Build an MCP server and client" under "MCP".

## My example for the lesson

The mamak near my office has a "buku 555" (that little notebook) for regulars' credit. Uncle writes down each regular's tab: what they owe, what they've ordered, and a note like "Mr Tan: only teh-O, no sugar".

I turned that notebook into a tiny Python class, `Tab`, and then wrapped it as **my own MCP server**. Now *any* agent, in any framework, can ask "what does Mr Tan owe?" or "add two roti telur to Mr Tan's tab". And a plain Python script can read Mr Tan's tab as a **resource** without any LLM involved.

## Part 1: Write the server with FastMCP

The official `mcp` package includes `FastMCP`. Decorate functions and they become tools. The **docstring and type hints are what the model sees**, so I write them carefully.

```bash
pip install "mcp[cli]<2" openai-agents python-dotenv
```

Env var names: `OPENAI_API_KEY`.

```python
# tab_server.py
from mcp.server.fastmcp import FastMCP
from tabs import Tab          # my plain Python class: balance, items, note, add(), pay()

mcp = FastMCP("tab_book")

@mcp.tool()
async def get_balance(name: str) -> float:
    """How much this regular currently owes, in RM.

    Args:
        name: the regular's name as written in the book
    """
    return Tab.get(name).balance

@mcp.tool()
async def add_order(name: str, item: str, qty: int) -> float:
    """Add an order to a regular's tab and return the new balance.

    Args:
        name: the regular's name
        item: menu item, e.g. 'roti telur'
        qty: how many
    """
    return Tab.get(name).add(item, qty)

@mcp.tool()
async def settle(name: str, amount: float) -> float:
    """Record a cash payment and return what is still owed."""
    return Tab.get(name).pay(amount)

@mcp.resource("tabs://book/{name}")
async def tab_page(name: str) -> str:
    """The full page for one regular: items, balance and note, as JSON."""
    return Tab.get(name.lower()).report()

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**Tools** are actions the model can call. **Resources** are read-only data addressed by a URI, which the *app* decides to fetch (handy for pasting context into a prompt).

## Part 2: Use it from an agent

The agent framework launches my server as a subprocess, exactly like a third-party one:

```python
from agents import Agent, Runner, trace
from agents.mcp import MCPServerStdio

params = {"command": "uv", "args": ["run", "tab_server.py"]}

async with MCPServerStdio(params=params, client_session_timeout_seconds=30) as tab_book:
    print([t.name for t in await tab_book.list_tools()])
    agent = Agent(name="cashier",
                  instructions="You manage regulars' tabs. Use the tab tools; never guess numbers.",
                  model="gpt-4o-mini", mcp_servers=[tab_book])
    with trace("cashier"):
        res = await Runner.run(agent, "Mr Tan had 2 roti telur and a teh-O. Add it, then tell me his balance.")
print(res.final_output)
```

## Part 3: Write a raw client (no agent)

Underneath, a client is just: open the transport, open a session, `initialize()`, then call. This is the same thing the agent framework does for me.

```python
# tab_client.py
import mcp
from mcp import StdioServerParameters
from mcp.client.stdio import stdio_client

params = StdioServerParameters(command="uv", args=["run", "tab_server.py"], env=None)

async def read_tab(name: str) -> str:
    async with stdio_client(params) as (read, write):
        async with mcp.ClientSession(read, write) as session:
            await session.initialize()
            res = await session.read_resource(f"tabs://book/{name}")
            return res.contents[0].text

async def list_tool_names() -> list[str]:
    async with stdio_client(params) as (read, write):
        async with mcp.ClientSession(read, write) as session:
            await session.initialize()
            return [t.name for t in (await session.list_tools()).tools]
```

I use `read_tab` to put Mr Tan's page straight into a prompt ("here is the customer's tab: ..."), and that costs no tool call at all.

## Part 4: Turning MCP tools into plain function tools

Sometimes I want the MCP tools *without* keeping a server object around in the agent, for example to mix them into a framework that only takes plain functions. With the raw session I can call any tool:

```python
async def call_tool(tool: str, args: dict):
    async with stdio_client(params) as (read, write):
        async with mcp.ClientSession(read, write) as session:
            await session.initialize()
            return await session.call_tool(tool, args)

# e.g. wrap: async def get_balance(name: str) -> float: return (await call_tool("get_balance", {"name": name})).content[0].text
```

That's it. A server is decorated functions plus `mcp.run()`, and a client is a session plus `list_tools`, `call_tool` and `read_resource`.

## What confused me

- **`mcp<2` matters.** `from mcp.server.fastmcp import FastMCP` is the classic import, and the mcp SDK's 2.0 release removed that module. Some third-party servers also import it without capping their dependency, so with `uvx` I add `--with "mcp<2"` to keep them running.
- **Run the server from the right folder.** If the server imports my local `tabs.py` package, the subprocess needs the right working directory (`cwd=` in the params, or `uv run -m package.module` from the project root). Otherwise it dies on import, and all I see is a timeout.
- **Resource names and case.** My URI template is `tabs://book/{name}` and I lowercase inside the handler. Without that, "Tan" and "tan" would be different pages. Also, the Windows-in-Jupyter `errlog=subprocess.DEVNULL` trick is needed for the raw `stdio_client` too, not just inside the agent SDK.
