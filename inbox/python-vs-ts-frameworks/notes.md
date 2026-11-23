# Python vs TypeScript frameworks

Fills the planned lesson "Comparing Python and JS/TS frameworks" under "Framework tour".

## My example for the lesson

Five different hawkers can all make roti canai. One uses a gas stove, one charcoal, one an electric griddle, and one flips the dough differently. But the **recipe steps are the same**: make dough, stretch, fold, fry, serve with dhal. Once you know the steps, you can work at any stall.

Agent frameworks feel the same. I built one identical "worker" in five frameworks. Its job is to take a goal from a shared SQLite **order board** ("read today's orders.txt, total the roti and teh per table, write bill.txt"), plan its own steps on the board, do them with file tools, and tick each one off.

The same five steps every time:

1. create the agent (model + system prompt),
2. run it,
3. add tools (typed functions),
4. add MCP (the filesystem server, scoped to one folder),
5. put it in a loop with a goal.

## Part 1: Strands and Pydantic AI (Python)

```bash
pip install "strands-agents[openai]" "pydantic-ai-slim[mcp,openai]" mcp fastmcp python-dotenv
```

Env var names: `OPENAI_API_KEY`.

**Strands**: `Agent(model, system_prompt, tools)`, with tools marked by `@tool`:

```python
import os, subprocess
from strands import Agent, tool
from strands.models.openai import OpenAIModel
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

model = OpenAIModel(client_args={"api_key": os.environ["OPENAI_API_KEY"]}, model_id="gpt-4o-mini")

@tool
def show_board() -> list[dict]:
    """List all todos on the order board."""
    return board.list_todos()

files = MCPClient(lambda: stdio_client(
    StdioServerParameters(command="npx", args=["-y", "@modelcontextprotocol/server-filesystem", SHOP], cwd=SHOP),
    errlog=subprocess.DEVNULL))

worker = Agent(model=model, system_prompt="Work the pending goal on the board.", tools=[show_board, files])
await worker.invoke_async("Please work the pending goal.")
```

Its headline feature is portability: swap `OpenAIModel` for another provider class and nothing else changes.

**Pydantic AI**: a model string like `"openai-chat:gpt-4o-mini"`, `instructions=`, plain functions as tools, and MCP servers passed as `toolsets=`:

```python
from pathlib import Path
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPToolset
from fastmcp.client.transports import StdioTransport

files = MCPToolset(StdioTransport(command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", SHOP], cwd=SHOP, log_file=Path(os.devnull)),
        init_timeout=60)

worker = Agent("openai-chat:gpt-4o-mini", instructions="Work the pending goal.",
               tools=[show_board], toolsets=[files])
async with worker:                      # opens the MCP connection
    res = await worker.run("Please work the pending goal.")
print(res.output)
```

Its special strength is **typed, validated output**: pass `output_type=MyPydanticModel` and you get a validated object back.

## Part 2: Microsoft Agent Framework and Agno (Python)

```bash
pip install agent-framework-core agent-framework-openai "agno[mcp]"
```

**Microsoft Agent Framework** (the merge of two older Microsoft agent projects): a chat *client* plus `instructions`. It's async-first.

```python
from agent_framework import Agent, MCPStdioTool
from agent_framework.openai import OpenAIChatClient

client = OpenAIChatClient(model="gpt-4o-mini")
files = MCPStdioTool(name="files", command="npx",
                     args=["-y", "@modelcontextprotocol/server-filesystem", SHOP])
worker = Agent(client=client, instructions="Work the pending goal.", tools=[show_board, files])
async with files:
    res = await worker.run("Please work the pending goal.")
print(res.text)
```

Its real selling point is underneath: a graph **workflow engine** with checkpointing and human approval, plus the same API in .NET.

**Agno** is very lightweight. Creating an agent takes microseconds, which matters if a server spins up a fresh agent per request.

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools
from mcp import StdioServerParameters

srv = StdioServerParameters(command="npx", args=["-y", "@modelcontextprotocol/server-filesystem", SHOP], cwd=SHOP)
async with MCPTools(server_params=srv, timeout_seconds=60) as files:
    worker = Agent(model=OpenAIChat(id="gpt-4o-mini"), instructions="Work the pending goal.",
                   tools=[show_board, files])
    res = await worker.arun(input="Please work the pending goal.")
print(res.content)
```

## Part 3: Mastra (TypeScript)

Same steps, different language. Mastra sits on the Vercel AI SDK, so models are `"provider/model"` strings and tool inputs are **zod** schemas.

```bash
npm install @mastra/core @mastra/mcp @ai-sdk/openai zod dotenv
npm install -D tsx typescript @types/node
# Node 24: the board uses the built-in node:sqlite
```

Env var names: `OPENAI_API_KEY`.

```ts
import "dotenv/config";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { MCPClient } from "@mastra/mcp";
import { z } from "zod";
import { listTodos } from "./board.ts";

const showBoard = createTool({
  id: "show_board",
  description: "List all todos on the order board.",
  inputSchema: z.object({}),
  execute: async () => ({ todos: listTodos() }),
});

const mcp = new MCPClient({
  servers: { files: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", SHOP] } },
});

const worker = new Agent({
  id: "bill-worker",
  name: "Bill Worker",
  instructions: "Work the pending goal on the board.",
  model: "openai/gpt-4o-mini",
  tools: { showBoard, ...(await mcp.listTools()) },
});

const reply = await worker.generate("Please work the pending goal.", { maxSteps: 30 });
console.log(reply.text);
process.exit(0);
```

I run each step file with `node --import tsx step.ts`.

## Part 4: My comparison table

| | Agent built from | Run call | Tools | MCP |
|---|---|---|---|---|
| Google ADK | `LlmAgent(model, instruction)` | Runner `run_async` | plain functions | `McpToolset` |
| Strands | `Agent(model, system_prompt)` | `invoke_async` | `@tool` | `MCPClient` |
| Pydantic AI | `Agent("prov:model", instructions)` | `run` → `.output` | plain functions | `toolsets=[MCPToolset]` |
| MS Agent Framework | `Agent(client, instructions)` | `run` → `.text` | plain functions | `MCPStdioTool` |
| Agno | `Agent(model, instructions)` | `arun` → `.content` | plain functions | `MCPTools` |
| Mastra (TS) | `new Agent({model, instructions})` | `generate` → `.text` | `createTool` + zod | `MCPClient.listTools()` |

My takeaway is that once the five steps are in my head, switching frameworks is mostly renaming things. I choose by the *extra* each one offers: ADK for its dev UI and A2A, Pydantic AI for typed output, Strands for swapping providers, MS AF for durable workflows, Agno for speed, and Mastra if the app is TypeScript.

## What confused me

- **MCP server stderr and the working directory.** The filesystem server prints a banner on stderr. Inside Jupyter on Windows there's no real stderr, so the launch fails. Each framework hides this differently: Strands accepts `errlog=`, Pydantic AI `log_file=`, Agno needs its `stdio_client` patched, and MS AF needs a small subclass. Setting `cwd=` to the workspace is what makes relative names like `orders.txt` resolve.
- **The MCP context-manager dance.** Pydantic AI needs `async with agent:`, while Agno and MS AF need `async with` on the tool. If you forget, the tools aren't connected, and the error doesn't make that obvious.
- **Mastra won't exit.** It keeps its model connection pool open, so the script hangs after printing. I end every step with `process.exit(0)`. It also moves fast, so I pin `@mastra/core` and don't trust old blog posts.
