# crew.py: the agents, the tasks and the crew.
# added: this package uses a flat layout (no `crewai create` scaffold), so it runs with `python main.py`.
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool
from pydantic import BaseModel, Field

from tools.notify import notify


# Step 2: typed forms that pass between agents
# TODO (Step 2): write four forms with BaseModel and Field(description=...):
#   Market (name, town, why_now), MarketList (markets: list[Market]),
#   MarketStudy (name, crowd, rent, competition, verdict), MarketStudyList (studies: list[MarketStudy]).
class Market(BaseModel):
    pass


class MarketList(BaseModel):
    pass


class MarketStudy(BaseModel):
    pass


class MarketStudyList(BaseModel):
    pass


@CrewBase
class PasarPicker:
    """The market research team: scout, researcher, picker, and a boss on top."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # Step 1: the scout gets a web search tool
    @agent
    def scout(self) -> Agent:
        # TODO: write this function
        # Hint: return Agent(config=self.agents_config["scout"], tools=[SerperDevTool()], verbose=True)
        raise NotImplementedError("TODO")

    @agent
    def researcher(self) -> Agent:
        # added: the lesson did not show this agent; it studies each market the scout found
        # TODO: write this function
        # Hint: same shape as the scout, but with no tools
        raise NotImplementedError("TODO")

    # Step 3: only the picker gets the phone-ping tool
    @agent
    def picker(self) -> Agent:
        # TODO: write this function
        # Hint: give it tools=[notify]: only the picker may ping the phone
        raise NotImplementedError("TODO")

    @task
    def find_markets(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["find_markets"], output_pydantic=MarketList)
        raise NotImplementedError("TODO")

    @task
    def study_markets(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=..., output_pydantic=MarketStudyList); its YAML already has context
        raise NotImplementedError("TODO")

    @task
    def pick_market(self) -> Task:
        # added: the lesson did not show this task; the picker chooses one market and pings the phone
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["pick_market"])
        raise NotImplementedError("TODO")

    # Step 4 and 5: a manager on top, plus memory
    @crew
    def crew(self) -> Crew:
        # the boss is built here, without the @agent decorator, so it is not an ordinary worker
        # TODO: write this function
        # Hint: build the boss with allow_delegation=True (no @agent), then Crew(process=Process.hierarchical, manager_agent=boss, memory=True)
        raise NotImplementedError("TODO")
