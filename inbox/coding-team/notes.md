# A coding team

Fills the planned lesson "Project: a team that writes code" under "Multi-agent teams".

## My example for the lesson

A small mamak wants a simple "tab" system for regulars. Uncle Raju drinks teh tarik every morning and settles up on Friday. The owner wants to:

- open a tab for a customer and add a cash top-up,
- record each order (item and quantity) against today's menu prices,
- refuse an order if the tab would go below zero,
- show what's owed, what's been ordered, and a history of every entry.

Instead of writing it myself, I build a crew of four roles, the way a small dev shop would split it:

1. **Lead**: turns the requirements into a design (classes, method signatures) in markdown.
2. **Backend dev**: writes the Python module from the design.
3. **Frontend dev**: builds a tiny Gradio screen on top of the module.
4. **Tester**: writes unit tests, runs them and reports.

Before that, I warmed up with a one-agent "coder" crew that just writes and runs a script.

## Part 1: One coder agent that can run its own code

The important part is that the agent doesn't just *write* code, it *executes* it and reads the output. Code from an LLM shouldn't run directly on my laptop, so the tools run it inside a throwaway Docker container that only sees one sandbox folder.

Install: Docker Desktop (running), `crewai` (pinned as before). Env var names: `OPENAI_API_KEY`.

```python
# tools/box.py
import subprocess
from pathlib import Path
from crewai.tools import tool

BOX = Path(__file__).resolve().parents[3] / "sandbox"
BOX.mkdir(exist_ok=True)

@tool("Save File")
def save_file(filename: str, content: str) -> str:
    """Write a text file into the sandbox folder, overwriting it."""
    (BOX / filename).write_text(content)
    return f"saved {filename}"

@tool("Run Python")
def run_python(filename: str) -> str:
    """Run a .py file from the sandbox inside a fresh container and return stdout."""
    out = subprocess.run(
        ["docker", "run", "--rm", "-v", f"{BOX}:/work", "-w", "/work",
         "python:3.12-slim", "python", filename],
        capture_output=True, text=True, timeout=60,
    )
    return out.stdout + out.stderr

box_tools = [save_file, run_python]
```

```python
@agent
def coder(self) -> Agent:
    return Agent(config=self.agents_config["coder"], tools=box_tools, verbose=True)
```

My warm-up assignment: "Write a script that prints how many 30-sen coins you'd need to pay for 1,000 cups of kopi at RM1.80 each, and run it." The point is that the agent writes it, runs it, reads the printed number and puts that in its final answer, instead of guessing.

## Part 2: Splitting the work into roles

agents.yaml has four entries. Only the lead gets the stronger model, because good design pays off later in the chain:

```yaml
lead:
  role: Engineering lead for a {module_name} module
  goal: >
    Turn these requirements into a detailed design for one Python module
    with one main class: {requirements}
  backstory: You write clear designs that a junior dev can follow.
  llm: openai/gpt-4o

backend_dev:
  role: Python developer
  goal: Implement the design exactly, as {module_name}, and save it to the sandbox.
  backstory: Careful, writes clean self-contained code.
  llm: openai/gpt-4o-mini
# frontend_dev and tester look similar
```

tasks.yaml chains them with `context:` so each role sees the right earlier work:

```yaml
design_task:
  description: Write the design for {module_name}. Markdown only, no code.
  expected_output: A design with class name, methods and signatures.
  agent: lead
  output_file: sandbox/design.md

code_task:
  description: Implement the design and save it as {module_name}.
  expected_output: Confirmation the file was saved and runs.
  agent: backend_dev
  context: [design_task]

ui_task:
  description: Build app.py, a minimal Gradio UI that imports {module_name}.
  expected_output: app.py saved in the sandbox.
  agent: frontend_dev
  context: [code_task]

test_task:
  description: Write test_{module_name}, run it, and summarise pass/fail.
  expected_output: A short test report.
  agent: tester
  context: [code_task]
  output_file: sandbox/test_report.md
```

## Part 3: Kickoff with the requirements

```python
# main.py
REQS = """
A tab system for regular customers at a drinks stall.
Open a tab, top up cash, record orders (item, qty) using get_price(item),
which has fixed test prices for teh_tarik, kopi_o and roti_canai.
Block orders that would make the balance negative.
Report balance, items ordered, and a full history.
"""

def run():
    TabTeam().crew().kickoff(inputs={
        "requirements": REQS,
        "module_name": "tabs.py",
    })
```

After a run the sandbox holds `design.md`, `tabs.py`, `app.py`, `test_tabs.py` and the test report. Running `uv run app.py` inside the sandbox gives a working little UI. That is the payoff: four roles, one kickoff, a working app.

## Part 4: Giving the team live docs through MCP

Newer CrewAI versions let an agent take a list of MCP server URLs directly:

```python
Agent(config=self.agents_config["frontend_dev"], tools=box_tools,
      mcps=["https://mcp.context7.com/mcp"])
```

That server serves up-to-date library docs, so the frontend dev stops writing Gradio code for an old API. I gave it to the lead and the frontend dev only, not the backend dev, who doesn't need it. (MCP gets its own topic later on the site; here a one-line "it is a plug for outside tools" is enough.)

## What confused me

- **Docker must be running first.** If Docker Desktop isn't started, the run tool returns an empty string, and the agent happily reports "the code ran fine". The first run also pulls the image, so it's slow once.
- **Stdout only.** If the run tool only returns stdout, a crash looks like silence to the agent. I added stderr to the output so it can actually see its tracebacks and fix them.
- **A known MCP bug in the pinned version.** With crewai 1.14.4, tools served over HTTPS MCP whose names contain hyphens couldn't be called, because the cleaned-up name was sent back to the server. The working copy fixed it with a small monkey-patch module imported at the top of main.py, and that patch needs checking again after any upgrade. Lesson: when a tool "exists" but always fails, look at the exact tool name being sent.
- **Clear the sandbox between runs**, or the tester ends up testing yesterday's file.
