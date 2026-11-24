# agent.py: the one entry-point file the runtime hosts.
# The planner from the last lesson (to-do list + tools) plus a sandbox tool, with a required check.
import os

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.tools.code_interpreter_client import code_session
from pydantic import BaseModel
from strands import Agent, tool

REGION = os.environ.get("AWS_REGION", "ap-southeast-1")  # added: ONE region for agent and sandbox

app = BedrockAgentCoreApp()


# ---- Step 1: the planner so far -------------------------------------------------

class Todo(BaseModel):
    description: str
    done: bool = False


plan: list[Todo] = []  # lives in memory: it resets when the container restarts (fine for a demo)


# ---- Step 4: show_plan, with the coding step coloured ---------------------------

@tool
def show_plan() -> str:
    """Return the current plan, one line per step."""
    lines = []
    for i, t in enumerate(plan, start=1):
        line = f"{i}. [{'x' if t.done else ' '}] {t.description}"
        if t.description.startswith("Write Python code"):
            line = "\033[96m" + line + "\033[0m"  # cyan, so the check is easy to spot
        lines.append(line)
    return "\n".join(lines)


@tool
def add_todo(description: str) -> str:
    """Add one step to the plan. Call once per step, in order."""
    plan.append(Todo(description=description))
    return show_plan()


@tool
def mark_done(position: int) -> str:
    """Mark a step as done. Positions start at 1, not 0."""
    if not 1 <= position <= len(plan):  # added: a clear message instead of a crash
        return f"There is no step {position}. The plan has {len(plan)} steps."
    plan[position - 1].done = True
    return show_plan()


# ---- Step 2: the sandbox tool ----------------------------------------------------

@tool
def run_python(code: str) -> str:
    """Run Python code in a safe sandbox and return what it prints.
    Use it to check an answer. Always print the result."""
    with code_session(REGION) as sandbox:  # same region as the agent, or the call fails
        response = sandbox.invoke(
            "executeCode",
            {"code": code, "language": "python", "clearContext": False},
        )
        output = ""
        for event in response["stream"]:
            output += str(event["result"])  # the answer arrives in pieces: join them
    return output


# ---- Step 3: make the check a required to-do ------------------------------------

agent_kwargs = {}
if os.environ.get("MODEL_ID"):  # added: optional, if the default model is not enabled in your region
    agent_kwargs["model"] = os.environ["MODEL_ID"]

checker = Agent(
    system_prompt=(
        "Make a plan with add_todo. Solve the task yourself first, without code. "
        "Then add one more to-do that starts with 'Write Python code to' "
        "and use run_python to check your answer. "
        "If the check disagrees, fix the answer. Mark each step done, then reply."
    ),
    tools=[add_todo, mark_done, show_plan, run_python],
    **agent_kwargs,
)


@app.entrypoint
def handle(payload):
    plan.clear()  # added: every request starts with an empty plan
    reply = checker(payload.get("prompt", "Hello"))
    return str(reply)


if __name__ == "__main__":
    app.run()
