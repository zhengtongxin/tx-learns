# My own agent loop

Fills the planned lesson "Project: write your own agent loop" under "Framework tour".

## My example for the lesson

My friend is opening a kuih shop and wants a small website: one page each for kuih lapis, onde-onde, kuih seri muka, ang ku kueh and pulut inti, each with a tiny interactive "build your own box" widget. Five pages and five builders working at the same time, plus one **supervisor**.

The supervisor is like a head chef at a big hawker centre stall:

1. sets the house style first (same plates, same garnish),
2. gives each cook one dish to make,
3. waits while they all cook at once, watching the order board,
4. **tastes each dish** before it goes out,
5. sends back any dish that's wrong, but only once,
6. writes the menu board at the end.

The five cooks are the five single-framework workers I already built (Strands, Pydantic AI, Microsoft Agent Framework, Agno, Mastra). The head chef is itself an agent, a Google ADK `LlmAgent`, not a Python `for` loop.

## Part 1: The key design: the agent decides, the tools do the mechanics

The inner loop (read board → plan steps → do them → tick off) lives inside each worker. The **outer loop** is an agent with a handful of tools. Anything brittle or deterministic (spawning processes, timeouts, file checks) goes in the tools. Choices (what each cook makes, whether a page is good enough, who to send back) are left to the model.

```bash
pip install "google-adk[mcp]" rich python-dotenv
# Node + npx for Playwright MCP; Chrome installed
```

Env var names: `GOOGLE_API_KEY`, `OPENAI_API_KEY`, plus optional `WORKER_TIMEOUT_S` and `QA_HEADLESS`.

```python
from google.adk.agents import LlmAgent
from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner

def make_tools(team):
    def launch_cook(framework: str, dish: str) -> str:
        """Start one framework's worker on a dish page. Returns immediately."""
        goal = board.add_goal(f"Build the {dish} page in site/{team.slug(framework)}/")
        team.start(framework, goal)       # subprocess.Popen, stdout/stderr to DEVNULL
        return f"{framework} is cooking {dish}"

    async def wait_for_cooks() -> str:
        """Block until every launched worker exits (or times out). Returns status."""
        await team.wait_all(timeout=300)
        return team.status()

    async def taste(slug: str) -> str:
        """Open one finished page in a real browser and report if it works."""
        return str(await qa.judge(slug))

    def send_back(framework: str, problem: str) -> str:
        """Give one worker a single fix task describing the problem."""
        return team.fix_once(framework, problem)

    return [launch_cook, wait_for_cooks, taste, send_back]

head_chef = LlmAgent(
    name="head_chef", model="gemini-2.5-flash",
    instruction="Build the kuih site with your team: launch every cook, wait, taste each page, "
                "send back at most one fix per page, then finish.",
    tools=make_tools(team),
)
runner = InMemoryRunner(agent=head_chef)
# run_async(..., run_config=RunConfig(max_llm_calls=80)) caps the outer loop
```

## Part 2: The workers join through the shared board

The same worker file runs in two modes, and a couple of lines at the top choose which:

```python
import sys
TASK_ID = int(sys.argv[1]) if len(sys.argv) > 2 else None
BOARD = sys.argv[2] if len(sys.argv) > 2 else "board.db"
# no args  -> seed my own demo goal and run alone
# with args -> claim TASK_ID on the shared board, build that page, exit
```

The supervisor launches them all at once with `subprocess.Popen` and never talks to them directly. **The board is the only channel.** Each worker writes its own steps under its goal, so a `rich.live.Live` view of the board shows five coloured goals filling in at the same time. That's the fun part to watch.

```python
from rich.live import Live
with Live(render_board(), refresh_per_second=4) as live:
    while any(p.poll() is None for p in team.pending):
        live.update(render_board())
        await asyncio.sleep(0.25)
```

## Part 3: The QA agent tastes with a real browser

For each page, I spin up a **fresh, short-lived** ADK agent with the Playwright MCP server and one "report" tool that records the verdict:

```python
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters

async def judge(uri: str) -> dict:
    verdict = {}
    def report(works: bool, note: str) -> dict:
        """Record whether the page loads and the widget works, with one short note."""
        verdict.update(works=works, note=note)
        return {"ok": True}

    browser = McpToolset(connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(command="npx",
            args=["-y", "@playwright/mcp@latest", "--browser", "chrome", "--isolated",
                  "--allow-unrestricted-file-access"]),
        timeout=30.0))
    taster = LlmAgent(name="taster", model="gemini-2.5-flash",
                      instruction=f"Open {uri}, try the box builder, check the console, then call report.",
                      tools=[browser, report])
    try:
        await run_once(taster, max_llm_calls=25)
    finally:
        await browser.close()
    return verdict or {"works": False, "note": "no verdict"}
```

A new agent per page keeps each browser session and context small, so one confusing page can't eat the whole budget.

## Part 4: Guardrails that make it finish

- **Bounded everything.** `max_llm_calls` on the head chef and on each taster, a per-worker timeout, a QA timeout, and *one* fix attempt per page. A page still broken after its fix stays visible instead of being retried forever.
- **Kill the whole process tree on timeout.** A worker starts `uv`/`npx`/MCP children, so I launch with `start_new_session=True` and stop it with `os.killpg(...)`. On Windows it's `taskkill /T`.
- **Fallbacks.** If the style or menu-page agent call fails, a plain template is written, so there's always a front page.
- **Discovery by file existence.** If one worker file doesn't exist, that cook simply isn't on the team. A `--dry-run` flag prints the team without spending anything.

## What confused me

- **"Event loop is closed" on exit.** Mixing asyncio subprocess transports with a long-running agent loop leaves things to clean up after the loop ends. Plain `subprocess.Popen` for workers, plus closing the MCP toolset *inside* the loop (with a timeout), fixed teardown.
- **Worker output tearing the live view.** Framework banners printed by workers break the rich display. Sending workers' stdout/stderr to `DEVNULL` is fine, because they report through the board anyway.
- **Model choice and cost.** With five workers plus QA, the bill adds up fast. I keep the two model names in one config file (orchestrator vs workers), read from env vars, so I can drop to the cheaper models while experimenting. The first browser call also cold-starts slowly, so the 5-second default MCP timeout was too short and I raised it to 30.
