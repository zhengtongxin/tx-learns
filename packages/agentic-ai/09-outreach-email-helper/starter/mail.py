"""mail.py: one door for sending. The agents never know which way it went."""
import os
import smtplib
from email.message import EmailMessage

import requests
from dotenv import load_dotenv

load_dotenv(override=True)


def send_by_email(subject: str, body: str) -> None:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def push(text: str) -> None:
    """Post text to a phone push service (Pushover)."""
    # added: the lesson left this helper as "...". This is a minimal version.
    # TODO: Post text to a phone push service (Pushover).
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def send_message(subject: str, body: str) -> None:
    """One door for sending. The agents never know which way it went."""
    # TODO: One door for sending. The agents never know which way it went.
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")
