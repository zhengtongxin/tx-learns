# warmup.py: Step 2. One coder with the two box tools, before the four roles.
# added: the lesson described this warm-up in words; this is a small way to run it.
from crewai import Agent, Crew, Task
from dotenv import load_dotenv

from tools.box import box_tools

load_dotenv(override=True)

# TODO: make `coder` (an Agent with role, goal, backstory, llm and tools=box_tools)
# and `job` (a Task with a description, an expected_output and agent=coder).
# The job: print how many 20-cent coins pay for 1,000 cups of kopi at S$1.80 each, and run it.
coder = None
job = None

if __name__ == "__main__":
    print(Crew(agents=[coder], tasks=[job], verbose=True).kickoff().raw)
