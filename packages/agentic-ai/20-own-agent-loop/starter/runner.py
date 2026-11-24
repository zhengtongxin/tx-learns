"""runner.py: run one ADK agent to the end, with a cap on model calls.

added: the lesson used run_once without showing it.
"""
import uuid

from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.genai import types


async def run_once(agent, prompt: str, max_llm_calls: int = 25) -> str:
    """Run `agent` on `prompt` and return its last text reply. Stops after max_llm_calls model calls."""
    # TODO: Run `agent` on `prompt` and return its last text reply. Stops after ma
    # Hint: InMemoryRunner(agent=...), create a session, then loop over runner.run_async(..., run_config=RunConfig(max_llm_calls=...))
    raise NotImplementedError("TODO")
