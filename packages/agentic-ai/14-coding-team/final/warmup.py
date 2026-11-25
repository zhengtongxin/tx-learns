# warmup.py: Step 2. One coder with the two box tools, before the four roles.
# added: the lesson described this warm-up in words; this is a small way to run it.
from crewai import Agent, Crew, Task
from dotenv import load_dotenv

from tools.box import box_tools

load_dotenv(override=True)

coder = Agent(
    role="Python coder",
    goal="Write a small script, run it in the box, and report the number it printed.",
    backstory="You never guess a number you can compute.",
    llm="openai/gpt-4o-mini",
    tools=box_tools,
    verbose=True,
)

job = Task(
    description=("Print how many 20-cent coins you need to pay for 1,000 cups of kopi "
                 "at S$1.80 each, and run it."),
    expected_output="The number the script printed (the right answer is 9000).",
    agent=coder,
)

if __name__ == "__main__":
    print(Crew(agents=[coder], tasks=[job], verbose=True).kickoff().raw)
