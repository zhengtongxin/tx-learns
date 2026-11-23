# Paper trading

Fills the planned lesson "Project: a paper-trading simulation" under "MCP".

## My example for the lesson

Every morning at my kopitiam, four uncles argue about stocks over roti bakar. Uncle Wong only buys "solid, boring" companies, Uncle Muthu chases whatever is in the news, Uncle Ah Kow trades on chart patterns, and Uncle Hamid buys what everyone else is selling. None of them ever proves who is right.

So I built a **paper trading floor**: four agent "uncles", each with RM10,000 of *pretend* money, a written strategy, and the same tools. They trade a small made-up list of tickers (`KOPI`, `ROTI`, `TEHT`, `NASI`) priced by a simulator, on a timer. A dashboard shows who's winning. It's play money only, a way to watch autonomous agents and the feedback loop, not to make real trades.

## Part 1: The architecture, all MCP

```bash
pip install openai-agents "mcp[cli]<2" gradio fastapi uvicorn python-dotenv
# Node + npx, uv/uvx; frontend: npm install (Vite + TypeScript)
```

Env var names: `OPENAI_API_KEY`, `TAVILY_API_KEY`, `PUSHOVER_USER`, `PUSHOVER_TOKEN`, optional `MARKET_DATA_API_KEY` for live prices, `RUN_EVERY_N_MINUTES`.

Each uncle is an agent whose tools come from MCP servers:

- **accounts server** (my own FastMCP): `get_balance`, `get_holdings`, `buy_shares`, `sell_shares`, `change_strategy`, plus resources `accounts://{name}` and `strategy://{name}`,
- **market server**: `lookup_price(symbol)`, either from a simulator or a real data provider's MCP server if a key is set,
- **push server**: a one-tool server that pings my phone after each trade.

Each uncle also has a **researcher**, another agent with its own servers (fetch, filtered web search, knowledge-graph memory), handed to the trader **as a tool** (the agents-as-tools pattern from the Agent SDKs topic):

```python
from agents import Agent, Runner, trace
from agents.mcp import MCPServerStdio
from contextlib import AsyncExitStack

def trader_servers():
    p = [{"command": "uv", "args": ["run", "-m", "floor.accounts_server"]},
         {"command": "uv", "args": ["run", "-m", "floor.push_server"]},
         {"command": "uv", "args": ["run", "-m", "floor.market_server"]}]
    return [MCPServerStdio(x, client_session_timeout_seconds=120) for x in p]

async def run_uncle(name: str, model: str = "gpt-4o-mini"):
    async with AsyncExitStack() as stack:
        t_srv = [await stack.enter_async_context(s) for s in trader_servers()]
        r_srv = [await stack.enter_async_context(s) for s in researcher_servers(name)]
        researcher = Agent(name="Researcher", instructions=RESEARCH_RULES, model=model, mcp_servers=r_srv)
        uncle = Agent(name=name, instructions=trader_rules(name), model=model, mcp_servers=t_srv,
                      tools=[researcher.as_tool(tool_name="Researcher",
                                                tool_description="Research news and prices for a ticker")])
        with trace(f"{name}-trading", trace_id=make_trace_id(name.lower())):
            await Runner.run(uncle, await build_message(name), max_turns=30)
```

## Part 2: The market server with a simulator fallback

Without a market data key, prices come from a deterministic simulator. It uses smooth noise over time, so prices look believable and two calls a second apart don't jump wildly:

```python
# floor/market_server.py
import os
from mcp.server.fastmcp import FastMCP
from floor.market import get_price   # live provider if key set, else simulator

mcp = FastMCP("market")

@mcp.tool()
async def lookup_price(symbol: str) -> float:
    """Latest price of a ticker, in RM."""
    return get_price(symbol)

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

The floor loop runs all four uncles concurrently on a timer:

```python
import asyncio
async def floor():
    while True:
        await asyncio.gather(*(run_uncle(n) for n in ["Wong", "Muthu", "AhKow", "Hamid"]))
        await asyncio.sleep(int(os.getenv("RUN_EVERY_N_MINUTES", "60")) * 60)
```

## Part 3: Observability with my own tracer

The agent SDK lets me plug into its tracing. My `TracingProcessor` writes every span (agent, tool call, generation) into SQLite with the uncle's name, and the dashboard reads those rows as a live, colour-coded log.

```python
from agents import TracingProcessor, add_trace_processor
from floor.db import write_log

class FloorLog(TracingProcessor):
    def _who(self, x):                      # trace ids look like trace_<name>0<random>
        tag = x.trace_id.split("_")[1]
        return tag.split("0")[0] if "0" in tag else None
    def on_trace_start(self, t):  (w := self._who(t)) and write_log(w, "trace", f"start {t.name}")
    def on_trace_end(self, t):    (w := self._who(t)) and write_log(w, "trace", f"end {t.name}")
    def on_span_start(self, s):
        if (w := self._who(s)) and s.span_data:
            write_log(w, s.span_data.type, f"start {getattr(s.span_data, 'name', '')}")
    def on_span_end(self, s): pass
    def shutdown(self): pass
    def force_flush(self): pass

add_trace_processor(FloorLog())
```

The trick is encoding the uncle's name into the `trace_id` (with a separator and random padding to the required length), so every span can be traced back to its owner.

## Part 4: Evaluation and feedback, plus a real frontend

The most interesting idea: **the uncles can rewrite their own strategy**. `change_strategy` is one of the account tools, and the instructions say "look at how your past trades actually performed, and update your strategy if the results say you should". The portfolio's profit and loss is a *real-world evaluation* that feeds back into the next decision. That makes it a loop that learns, rather than a fixed prompt.

For the front end, I split it like a real product:

- `floor/api.py`: a thin, read-only **FastAPI** app (roster, portfolio value, holdings, transactions, logs, whether prices are simulated or live),
- `frontend/`: a **Vite + TypeScript** app polling the API every couple of seconds, with a chart per uncle. Vite's dev server proxies `/api` to port 8000, so there's no CORS setup.

```bash
uv run uvicorn floor.api:app --port 8000     # terminal 1
cd frontend && npm run dev                    # terminal 2 → http://localhost:5173
uv run -m floor.trading_floor                 # terminal 3: the uncles start trading
```

## What confused me

- **Cost on a timer.** Four traders × a researcher × several servers, every N minutes, adds up while you sleep. I set `RUN_EVERY_N_MINUTES` high, use small models, and stop the floor when I'm done watching.
- **Opening many servers cleanly.** Nesting six `async with` blocks is unreadable. `AsyncExitStack` enters them in a loop and closes them all, even when a run fails. Each server also needs a generous timeout (I use 120 s), because `uv run` start-up plus first-time downloads can be slow.
- **Model mixing.** I wanted different uncles on different providers. The SDK takes a plain model name for OpenAI, and an `OpenAIChatCompletionsModel(model=..., openai_client=AsyncOpenAI(base_url=...))` for any OpenAI-compatible provider, so I route by model name prefix. Each provider needs its own key env var, so a missing one only breaks that uncle.
