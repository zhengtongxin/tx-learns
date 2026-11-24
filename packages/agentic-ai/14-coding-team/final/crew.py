# crew.py: four roles that design, build, put a screen on and test a small app.
# added: flat layout (no `crewai create` scaffold), so it runs with `python main.py`.
import os

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from tools.box import box_tools


@CrewBase
class TabTeam:
    """Lead, backend dev, frontend dev and tester for one small module."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def lead(self) -> Agent:
        return Agent(config=self.agents_config["lead"], verbose=True)

    @agent
    def backend_dev(self) -> Agent:
        return Agent(config=self.agents_config["backend_dev"], tools=box_tools, verbose=True)

    @agent
    def frontend_dev(self) -> Agent:
        # Step 5: live library docs through MCP, for this role only.
        # added: set USE_DOCS_MCP=0 in .env to switch it off if the docs server is unreachable
        mcps = ["https://mcp.context7.com/mcp"] if os.getenv("USE_DOCS_MCP", "1") == "1" else []
        return Agent(config=self.agents_config["frontend_dev"], tools=box_tools, mcps=mcps, verbose=True)

    @agent
    def tester(self) -> Agent:
        return Agent(config=self.agents_config["tester"], tools=box_tools, verbose=True)

    # the order of these methods is the running order
    @task
    def design_task(self) -> Task:
        return Task(config=self.tasks_config["design_task"])

    @task
    def code_task(self) -> Task:
        return Task(config=self.tasks_config["code_task"])

    @task
    def ui_task(self) -> Task:
        return Task(config=self.tasks_config["ui_task"])

    @task
    def test_task(self) -> Task:
        return Task(config=self.tasks_config["test_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks, process=Process.sequential, verbose=True)
