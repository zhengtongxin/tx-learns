"""tools.py: the two tools, their JSON descriptions and the dispatcher."""
import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv(override=True)

pushover_user = os.getenv("PUSHOVER_USER")
pushover_token = os.getenv("PUSHOVER_TOKEN")
pushover_url = "https://api.pushover.net/1/messages.json"

# added: a simple cap so a public twin cannot be used to spam your phone
MAX_PUSHES_PER_HOUR = 10
_recent_pushes: list[float] = []


def push(message):
    # added: without keys, print instead of failing, so you can test the flow first
    if not (pushover_user and pushover_token):
        print(f"[push skipped, no keys] {message}")
        return
    now = time.time()
    _recent_pushes[:] = [t for t in _recent_pushes if now - t < 3600]
    if len(_recent_pushes) >= MAX_PUSHES_PER_HOUR:
        print("[push skipped, hourly cap reached]")
        return
    _recent_pushes.append(now)
    payload = {"user": pushover_user, "token": pushover_token, "message": message}
    requests.post(pushover_url, data=payload, timeout=10)


def record_user_details(email, name="Name not provided", notes="not provided"):
    push(f"Recording interest from {name} with email {email} and notes {notes}")
    return {"recorded": "ok"}


def record_unknown_question(question):
    push(f"Recording question I could not answer: {question}")
    return {"recorded": "ok"}


record_user_details_json = {
    "name": "record_user_details",
    "description": "Use this tool to record that a user is interested in being in touch and provided an email address",
    "parameters": {
        "type": "object",
        "properties": {
            "email": {"type": "string", "description": "The email address of this user"},
            "name": {"type": "string", "description": "The user's name, if they provided it"},
            "notes": {"type": "string", "description": "Any additional information about the conversation that's worth recording to give context"},
        },
        "required": ["email"],
        "additionalProperties": False,
    },
}

record_unknown_question_json = {
    "name": "record_unknown_question",
    "description": "Always use this tool to record any question that couldn't be answered as you didn't know the answer",
    "parameters": {
        "type": "object",
        "properties": {
            "question": {"type": "string", "description": "The question that couldn't be answered"},
        },
        "required": ["question"],
        "additionalProperties": False,
    },
}

tools = [
    {"type": "function", "function": record_user_details_json},
    {"type": "function", "function": record_unknown_question_json},
]

# added: the lesson's "public app" note: an explicit dictionary instead of globals(),
# so the model can never call anything else
ALLOWED_TOOLS = {
    "record_user_details": record_user_details,
    "record_unknown_question": record_unknown_question,
}


def handle_tool_calls(tool_calls):
    """Run each tool the model asked for and return the tool messages to send back."""
    results = []
    for tool_call in tool_calls:
        tool_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments)
        tool = ALLOWED_TOOLS.get(tool_name)
        result = tool(**arguments) if tool else {}
        results.append({"role": "tool", "content": json.dumps(result), "tool_call_id": tool_call.id})
    return results
