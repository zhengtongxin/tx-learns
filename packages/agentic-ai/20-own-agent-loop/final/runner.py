"""runner.py: run one ADK agent to the end, with a cap on model calls.

added: the lesson used run_once without showing it.
"""
import uuid

from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.genai import types


async def run_once(agent, prompt: str, max_llm_calls: int = 25) -> str:
    """Run `agent` on `prompt` and return its last text reply. Stops after max_llm_calls model calls."""
    runner = InMemoryRunner(agent=agent, app_name="fair")
    user_id, session_id = "fair", uuid.uuid4().hex
    await runner.session_service.create_session(app_name="fair", user_id=user_id, session_id=session_id)
    message = types.Content(role="user", parts=[types.Part(text=prompt)])
    reply = ""
    async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=message,
            run_config=RunConfig(max_llm_calls=max_llm_calls)):
        if event.is_final_response() and event.content and event.content.parts:
            reply = "".join(p.text or "" for p in event.content.parts)
    return reply
