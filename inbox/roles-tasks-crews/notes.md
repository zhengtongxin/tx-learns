# Roles, tasks and crews

Fills the planned lesson "Roles, tasks and crews" under "Multi-agent teams".

## My example for the lesson

Picture a kopitiam at 7am. Ah Seng at the drinks counter only makes drinks: kopi-O, teh tarik, Milo ais. Kak Ros at the noodle stall only cooks: mee goreng, kuey teow soup. The towkay doesn't cook anything. He walks around, takes orders and decides who does what. Nobody's job overlaps, and each person knows exactly what "done" looks like ("one teh tarik, kurang manis, in a glass").

That's how I think of a CrewAI crew now:

- **Agent** = a worker with a role, a goal and a backstory (Ah Seng, "drinks maker, 20 years pulling teh").
- **Task** = one order slip with a description and an expected output ("one kopi-C peng, in a takeaway bag").
- **Crew** = the shop. It holds the workers and the order slips, and runs them either one after another (**sequential**) or through a boss who hands out the work (**hierarchical**).

For my own practice crew I made a "menu argument" crew. One agent argues *for* putting durian cendol on the menu, the same agent then argues *against*, and a third "regular customer" agent decides who made the better case.

## Part 1: The scaffold the CLI gives you

I install CrewAI as a uv tool and pin the version, because the library changes fast:

```bash
uv tool install crewai==1.14.4
uv tool list          # confirm the version
crewai create crew menu_argument
cd menu_argument
crewai run
```

Env var names needed: `OPENAI_API_KEY` (or whichever provider your `llm:` lines point to).

`crewai create crew` builds a small package:

```
menu_argument/
  src/menu_argument/
    config/agents.yaml   # who the workers are
    config/tasks.yaml    # the order slips
    crew.py              # wires agents + tasks into a Crew
    main.py              # run(), train(), replay(), test()
    tools/custom_tool.py
```

The main idea is that the prompts live in YAML and the wiring lives in Python. I like this because I can tweak the prompt text without touching code.

## Part 2: agents.yaml and tasks.yaml

Anything in `{curly}` braces is filled in from the `inputs` dict you pass at kickoff. The `llm:` field uses `provider/model` strings (LiteLLM style), so each agent can use a different model.

```yaml
# config/agents.yaml
arguer:
  role: >
    Persuasive stall-owner
  goal: >
    Make a short, convincing case about this menu idea: {idea}
  backstory: >
    You have run a hawker stall for years and know what regulars will pay for.
  llm: openai/gpt-4o-mini

regular:
  role: >
    Picky regular customer
  goal: >
    Read both cases about {idea} and pick the stronger one, judging only the arguments.
  backstory: >
    You eat here every morning and you are hard to impress.
  llm: openai/gpt-4o-mini
```

```yaml
# config/tasks.yaml
argue_for:
  description: >
    Argue in favour of: {idea}. Keep it tight.
  expected_output: >
    A short, punchy argument for the idea.
  agent: arguer
  output_file: output/for.md

argue_against:
  description: >
    Argue against: {idea}.
  expected_output: >
    A short, punchy argument against the idea.
  agent: arguer
  output_file: output/against.md

verdict:
  description: >
    Read both arguments and decide which side wins, and why.
  expected_output: >
    The winning side plus two or three reasons.
  agent: regular
  output_file: output/verdict.md
```

One agent can be used by several tasks. Here `arguer` does both sides.

## Part 3: crew.py and main.py

The decorators collect everything for you. `@agent` methods end up in `self.agents` and `@task` methods end up in `self.tasks`, **in the order they are defined**. In a sequential crew that order *is* the running order.

```python
# crew.py
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class MenuArgument():
    """Argue a menu change, then let a regular decide."""

    @agent
    def arguer(self) -> Agent:
        return Agent(config=self.agents_config["arguer"], verbose=True)

    @agent
    def regular(self) -> Agent:
        return Agent(config=self.agents_config["regular"], verbose=True)

    @task
    def argue_for(self) -> Task:
        return Task(config=self.tasks_config["argue_for"])

    @task
    def argue_against(self) -> Task:
        return Task(config=self.tasks_config["argue_against"])

    @task
    def verdict(self) -> Task:
        return Task(config=self.tasks_config["verdict"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,   # slips handled top to bottom
            verbose=True,
        )
```

```python
# main.py
from menu_argument.crew import MenuArgument

def run():
    idea = input("Menu idea to argue about: ")
    result = MenuArgument().crew().kickoff(inputs={"idea": idea})
    print(result.raw)
```

In a sequential crew, each task automatically sees the outputs of the tasks before it. That's how the `verdict` task can read both arguments without me passing anything by hand.

## Part 4: Sequential vs hierarchical, and a research crew

**Sequential**: tasks run in the listed order and each one's output flows forward. It's predictable and cheap. I use it by default.

**Hierarchical**: you add a manager (either `manager_llm="..."` or your own `manager_agent=Agent(..., allow_delegation=True)`), and the manager decides which worker takes which task, and can send work back. It's more flexible, but it uses more tokens and is less predictable.

```python
Crew(
    agents=self.agents,
    tasks=self.tasks,
    process=Process.hierarchical,
    manager_llm="openai/gpt-4o",
)
```

My second practice crew was a two-step research crew: a "researcher" agent collects the facts about a topic like `{topic}` = "nasi lemak delivery in Penang", and a "reporting analyst" turns those facts into a markdown report. The trick was putting `{topic}` inside the *role* itself ("{topic} Senior Researcher"), so the same YAML works for any topic I pass in.

## What confused me

- **The version pin matters.** CrewAI does make breaking changes. If I install the latest version instead of the pinned one, generated projects and imports can break. I check with `uv tool list` first, and `uv tool uninstall crewai` if an old one is hanging around.
- **Task order = method order.** If the `verdict` method sits above the two argue methods, the regular "judges" before any arguments exist. In sequential mode, the order of the methods in the file is the order the tasks run.
- **`inputs` keys must match every placeholder.** If tasks.yaml uses `{idea}` but I kick off with `{"topic": ...}`, it fails at interpolation time. Every placeholder in both YAML files needs a key.
