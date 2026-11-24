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
    # TODO: Send a short push message to the stall owner's phone.
    # Hint: requests.post to the Pushover URL with user, token and message; return the status code
    raise NotImplementedError("TODO")
