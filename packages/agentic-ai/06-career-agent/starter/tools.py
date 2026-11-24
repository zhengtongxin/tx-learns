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
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def record_user_details(email, name="Name not provided", notes="not provided"):
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def record_unknown_question(question):
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


# TODO (Step 2): describe each tool in JSON: name, description, parameters.
# The description is what the model reads to decide. Make the second one say "Always use this tool".
record_user_details_json = {}
record_unknown_question_json = {}

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
    # TODO: Run each tool the model asked for and return the tool messages to send
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")
