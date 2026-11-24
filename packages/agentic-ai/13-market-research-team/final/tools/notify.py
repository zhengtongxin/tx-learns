# tools/notify.py: a custom tool that pings a phone through Pushover.
import os

import requests
from crewai.tools import tool


@tool("Notify My Aunt")
def notify(message: str) -> str:
    """Send a short push message to the stall owner's phone.
    Args:
        message: the text to send, under 200 characters.
    """
    user, token = os.getenv("PUSHOVER_USER"), os.getenv("PUSHOVER_TOKEN")
    if not (user and token):
        # added: with no Pushover keys, print instead of failing, so the crew still finishes
        print(f"[notify skipped, no Pushover keys] {message}")
        return "skipped: no push keys, message printed instead"
    resp = requests.post(
        "https://api.pushover.net/1/messages.json",
        data={"user": user, "token": token, "message": message},
        timeout=10,
    )
    return f"sent, status {resp.status_code}"
