# agent.py: the one entry-point file the runtime hosts.
import os

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.tools.code_interpreter_client import code_session
from pydantic import BaseModel
from strands import Agent, tool

REGION = os.environ.get("AWS_REGION", "ap-southeast-1")  # ONE region for agent and sandbox

app = BedrockAgentCoreApp()


class Todo(BaseModel):
    description: str
    done: bool = False


plan: list[Todo] = []


@tool
def show_plan() -> str:
    """Return the current plan, one line per step."""
    # TODO: one line per step like "1. [x] description" ("[ ]" when not done). Positions start at 1.
    # Stretch: wrap any line whose description starts with "Write Python code" in the cyan code
    # "\033[96m" ... "\033[0m" so the check is easy to spot.
    return "TODO"


@tool
def add_todo(description: str) -> str:
    """Add one step to the plan. Call once per step, in order."""
    # TODO: append a Todo to plan and return show_plan()
    return "TODO"


@tool
def mark_done(position: int) -> str:
    """Mark a step as done. Positions start at 1, not 0."""
    # TODO: plan[position - 1].done = True (Python counts from 0!). Refuse a position that does not
    # exist with a clear message. Return show_plan().
    return "TODO"


@tool
def run_python(code: str) -> str:
    """Run Python code in a safe sandbox and return what it prints.
    Use it to check an answer. Always print the result."""
    # TODO: with code_session(REGION) as sandbox: call sandbox.invoke("executeCode",
    #   {"code": code, "language": "python", "clearContext": False}), then join str(event["result"])
    #   for every event in response["stream"], and return the joined text.
    # Hint: the sandbox must be in the same region as the agent.
    return "TODO"


agent_kwargs = {}
if os.environ.get("MODEL_ID"):  # optional, if the default model is not enabled in your region
    agent_kwargs["model"] = os.environ["MODEL_ID"]

checker = Agent(
    # TODO: system_prompt. Say, in this order: make a plan with add_todo; solve it yourself first
    # WITHOUT code; then add one more to-do that STARTS WITH "Write Python code to" and use
    # run_python to check; if the check disagrees, fix the answer; mark each step done, then reply.
    # Hint: a check that is only a suggestion gets skipped. Make it a to-do.
    system_prompt="TODO",
    tools=[add_todo, mark_done, show_plan, run_python],
    **agent_kwargs,
)


@app.entrypoint
def handle(payload):
    plan.clear()
    reply = checker(payload.get("prompt", "Hello"))
    return str(reply)


if __name__ == "__main__":
    app.run()
