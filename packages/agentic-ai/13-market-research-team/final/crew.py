# crew.py: the agents, the tasks and the crew.
# added: this package uses a flat layout (no `crewai create` scaffold), so it runs with `python main.py`.
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool
from pydantic import BaseModel, Field

from tools.notify import notify


# Step 2: typed forms that pass between agents
class Market(BaseModel):
    name: str = Field(description="Name of the night market")
    town: str = Field(description="Town or area")
    why_now: str = Field(description="Why people are talking about it lately")


class MarketList(BaseModel):
    markets: list[Market] = Field(description="Night markets worth a look")


class MarketStudy(BaseModel):
    name: str
    crowd: str = Field(description="Typical crowd size and peak hours")
    rent: str = Field(description="Rough stall rent per night, in S$")
    competition: str = Field(description="How many kuih sellers are already there")
    verdict: str = Field(description="Is it worth a stall?")


class MarketStudyList(BaseModel):
    studies: list[MarketStudy]


@CrewBase
class PasarPicker:
    """The market research team: scout, researcher, picker, and a boss on top."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # Step 1: the scout gets a web search tool
    @agent
    def scout(self) -> Agent:
        return Agent(config=self.agents_config["scout"], tools=[SerperDevTool()], verbose=True)

    @agent
    def researcher(self) -> Agent:
        # added: the lesson did not show this agent; it studies each market the scout found
        return Agent(config=self.agents_config["researcher"], verbose=True)

    # Step 3: only the picker gets the phone-ping tool
    @agent
    def picker(self) -> Agent:
        return Agent(config=self.agents_config["picker"], tools=[notify], verbose=True)

    @task
    def find_markets(self) -> Task:
        return Task(config=self.tasks_config["find_markets"], output_pydantic=MarketList)

    @task
    def study_markets(self) -> Task:
        return Task(config=self.tasks_config["study_markets"], output_pydantic=MarketStudyList)

    @task
    def pick_market(self) -> Task:
        # added: the lesson did not show this task; the picker chooses one market and pings the phone
        return Task(config=self.tasks_config["pick_market"])

    # Step 4 and 5: a manager on top, plus memory
    @crew
    def crew(self) -> Crew:
        # the boss is built here, without the @agent decorator, so it is not an ordinary worker
        boss = Agent(config=self.agents_config["boss"], allow_delegation=True)
        return Crew(
            agents=self.agents,  # scout, researcher, picker (not the boss)
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_agent=boss,
            memory=True,  # short-term, long-term and entity memory
            verbose=True,
        )
