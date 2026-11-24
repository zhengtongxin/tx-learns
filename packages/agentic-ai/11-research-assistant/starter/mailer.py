"""mailer.py: the plain sending helper and the tool that wraps it for an agent."""
import os
import smtplib
from email.message import EmailMessage

from agents import function_tool
from dotenv import load_dotenv

load_dotenv(override=True)

SEND_EMAIL = False  # True = really send (needs MY_EMAIL, SMTP_SERVER, SMTP_APP_PASSWORD in .env)


def send_message(subject, text_body, html_body):  # plain helper, your code can call this
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


@function_tool
def send_report(subject: str, text_body: str, html_body: str) -> str:
    """Email the finished report to me.
    Args:
        subject: A short, clear subject line.
        text_body: The report as plain text.
        html_body: The report as simple, clean HTML.
    """
    # TODO: Email the finished report to me.
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")
