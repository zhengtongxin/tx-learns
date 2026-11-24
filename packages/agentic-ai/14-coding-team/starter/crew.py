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
        # TODO: write this function
        # Hint: Agent(config=self.agents_config["lead"], verbose=True): the lead needs no tools
        raise NotImplementedError("TODO")

    @agent
    def backend_dev(self) -> Agent:
        # TODO: write this function
        # Hint: same, with tools=box_tools
        raise NotImplementedError("TODO")

    @agent
    def frontend_dev(self) -> Agent:
        # Step 5: live library docs through MCP, for this role only.
        # added: set USE_DOCS_MCP=0 in .env to switch it off if the docs server is unreachable
        # TODO: write this function
        # Hint: tools=box_tools and mcps=["https://mcp.context7.com/mcp"] (live library docs)
        raise NotImplementedError("TODO")

    @agent
    def tester(self) -> Agent:
        # TODO: write this function
        # Hint: same as backend_dev: it must be able to save and run files
        raise NotImplementedError("TODO")

    # the order of these methods is the running order
    @task
    def design_task(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["design_task"]); the method order is the running order
        raise NotImplementedError("TODO")

    @task
    def code_task(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["code_task"])
        raise NotImplementedError("TODO")

    @task
    def ui_task(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["ui_task"])
        raise NotImplementedError("TODO")

    @task
    def test_task(self) -> Task:
        # TODO: write this function
        # Hint: Task(config=self.tasks_config["test_task"])
        raise NotImplementedError("TODO")

    @crew
    def crew(self) -> Crew:
        # TODO: write this function
        # Hint: Crew(agents=self.agents, tasks=self.tasks, process=Process.sequential, verbose=True)
        raise NotImplementedError("TODO")
