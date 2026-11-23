# A market research team

Fills the planned lesson "Project: a market research team" under "Multi-agent teams".

## My example for the lesson

My aunt wants to open a second kuih stall and asks: "Which pasar malam should I go to?" To answer that properly you need a small team:

1. a **scout** who searches online for night markets people are talking about right now,
2. a **researcher** who digs into each one (crowd size, rent, how many kuih sellers are already there),
3. a **picker** who chooses the single best one and messages my aunt on her phone.

Above them sits a **manager** who hands out the work and checks it. That's the same shape as a finance research crew, but with pasar malam instead of companies.

## Part 1: Giving agents tools (web search)

Agents only know what's in their model's training data unless you give them tools. CrewAI ships ready-made tools in the `crewai_tools` package. `SerperDevTool` does Google-style searches through the Serper API.

```bash
uv add crewai-tools        # inside the crew project
```

Env var names needed: `OPENAI_API_KEY`, `SERPER_API_KEY`.

```python
from crewai import Agent
from crewai_tools import SerperDevTool

@agent
def scout(self) -> Agent:
    return Agent(
        config=self.agents_config["scout"],
        tools=[SerperDevTool()],   # can now search the web
        verbose=True,
    )
```

A simpler two-agent version (researcher with search, then an analyst without tools) is enough for a "write me a report on X" job. I set `output_file="output/report.md"` on the analyst's task so the final report lands on disk.

## Part 2: Structured outputs with Pydantic

Free text between agents is fragile. If the scout returns a proper list, the researcher can't misread it. I pass a Pydantic model to `output_pydantic` on the task:

```python
from pydantic import BaseModel, Field

class Market(BaseModel):
    name: str = Field(description="Name of the night market")
    town: str = Field(description="Town or area")
    why_now: str = Field(description="Why people are talking about it lately")

class MarketList(BaseModel):
    markets: list[Market] = Field(description="Night markets worth a look")

class MarketStudy(BaseModel):
    name: str
    crowd: str = Field(description="Typical crowd size and peak hours")
    competition: str = Field(description="How many kuih sellers are already there")
    verdict: str = Field(description="Is it worth a stall?")

class MarketStudyList(BaseModel):
    studies: list[MarketStudy]

@task
def find_markets(self) -> Task:
    return Task(config=self.tasks_config["find_markets"], output_pydantic=MarketList)

@task
def study_markets(self) -> Task:
    return Task(config=self.tasks_config["study_markets"], output_pydantic=MarketStudyList)
```

In tasks.yaml I link tasks explicitly with `context:`, so the researcher definitely gets the scout's list:

```yaml
study_markets:
  description: >
    For each market found, research crowd, rent and competition for a kuih stall in {state}.
  expected_output: >
    A study of each market.
  agent: researcher
  context:
    - find_markets
  output_file: output/studies.json
```

## Part 3: A custom tool (push notification) and a manager

A custom tool is just a function with the `@tool` decorator. The **docstring is the tool description the LLM reads**, so I write it like instructions:

```python
# tools/notify.py
import os, requests
from crewai.tools import tool

@tool("Notify My Aunt")
def notify(message: str) -> str:
    """Send a short push message to the stall owner's phone.
    Args:
        message: the text to send, under 200 characters.
    """
    resp = requests.post(
        "https://api.pushover.net/1/messages.json",
        data={
            "user": os.getenv("PUSHOVER_USER"),
            "token": os.getenv("PUSHOVER_TOKEN"),
            "message": message,
        },
    )
    return f"sent, status {resp.status_code}"
```

Env var names: `PUSHOVER_USER`, `PUSHOVER_TOKEN`.

Then the crew goes hierarchical with my own manager agent. The manager must be allowed to delegate, and it is passed separately, **not** included in `agents`:

```python
@crew
def crew(self) -> Crew:
    boss = Agent(config=self.agents_config["boss"], allow_delegation=True)
    return Crew(
        agents=self.agents,          # scout, researcher, picker
        tasks=self.tasks,
        process=Process.hierarchical,
        manager_agent=boss,
        memory=True,
        verbose=True,
    )
```

Kickoff with today's date so "trending now" means something:

```python
from datetime import date
PasarPicker().crew().kickoff(inputs={"state": "Selangor", "today": str(date.today())})
```

## Part 4: Memory

`memory=True` on the crew (and optionally on individual agents) turns on CrewAI's built-in memory:

- **short-term**: what happened earlier in this run,
- **long-term**: results and lessons from previous runs, kept on disk,
- **entity**: facts about named things (a particular market, a town).

The neat trick is pairing memory with the prompt. If the scout's task says "find markets you haven't suggested before", long-term memory is what makes that instruction actually work across runs, so my aunt gets a fresh shortlist each time instead of the same three markets. Memory needs an embedder, which by default uses the same OpenAI key, so there's a small extra cost per run.

## What confused me

- **The manager is not in the agents list.** If the boss is declared with `@agent`, the crew treats it as a normal worker too. With `manager_agent=` you build it inside `crew()` without the decorator.
- **Hierarchical is chatty and unpredictable.** A manager can re-delegate the same task several times, or skip the notify step. Clear `expected_output` text and asking the picker to "always send exactly one notification" helped. Sequential with `context:` is more reliable when the flow is fixed anyway.
- **Search results go stale and cost money.** Each Serper call counts against a quota. Putting `{today}` into the scout's task made the results noticeably more current.
