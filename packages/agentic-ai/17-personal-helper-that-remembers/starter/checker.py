"""checker.py: does "done" mean done? Plus the errand loop around the worker."""
from langchain_openai import ChatOpenAI
from langgraph.types import Command
from pydantic import BaseModel, Field


# TODO (Step 4): write a Verdict form with three fields, each with Field(description=...):
#   feedback (str), done (bool: has the "done means" line been met?), need_human (bool: is the worker stuck?).
class Verdict(BaseModel):
    pass


# TODO: checker = a ChatOpenAI model with .with_structured_output(Verdict)
checker = None


async def settle_interrupts(worker, res, cfg):
    """Step 3: when the worker pauses before a risky tool, ask the human, then resume.

    added: the lesson showed one approve. This loop asks in the terminal and sends one
    decision per paused call.
    """
    # TODO: Step 3: when the worker pauses before a risky tool, ask the human, the
    # Hint: while "__interrupt__" in res: read action_requests, ask, resume with Command(resume={"decisions": [...]}) (one decision per call)
    raise NotImplementedError("TODO")


async def run_errand(worker, errand: str, done_means: str, cfg: dict, tries: int = 3):
    # TODO: write this function
    # Hint: loop up to `tries`: run the worker, settle pauses, collect the tool names used, ask the checker, stop when done or need_human
    raise NotImplementedError("TODO")
