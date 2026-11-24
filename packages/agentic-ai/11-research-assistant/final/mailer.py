"""mailer.py: the plain sending helper and the tool that wraps it for an agent."""
import os
import smtplib
from email.message import EmailMessage

from agents import function_tool
from dotenv import load_dotenv

load_dotenv(override=True)

SEND_EMAIL = False  # True = really send (needs MY_EMAIL, SMTP_SERVER, SMTP_APP_PASSWORD in .env)


def send_message(subject, text_body, html_body):  # plain helper, your code can call this
    if not SEND_EMAIL:
        print("Not sent:", subject)
        return
    msg = EmailMessage()
    msg["From"] = msg["To"] = os.getenv("MY_EMAIL")
    msg["Subject"] = subject
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")
    with smtplib.SMTP(os.getenv("SMTP_SERVER"), 587) as server:
        server.starttls()
        server.login(os.getenv("MY_EMAIL"), os.getenv("SMTP_APP_PASSWORD"))
        server.send_message(msg)


@function_tool
def send_report(subject: str, text_body: str, html_body: str) -> str:
    """Email the finished report to me.
    Args:
        subject: A short, clear subject line.
        text_body: The report as plain text.
        html_body: The report as simple, clean HTML.
    """
    send_message(subject, text_body, html_body)
    return "Sent"
