"""mail.py: one door for sending. The agents never know which way it went."""
import os
import smtplib
from email.message import EmailMessage

import requests
from dotenv import load_dotenv

load_dotenv(override=True)


def send_by_email(subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, os.environ["MAIL_FROM"], os.environ["MAIL_TO"]
    msg.set_content(body)
    with smtplib.SMTP(os.environ["SMTP_HOST"], 587) as server:
        server.starttls()  # encrypt first
        server.login(os.environ["MAIL_FROM"], os.environ["SMTP_APP_PASSWORD"])
        server.send_message(msg)


def push(text: str) -> None:
    """Post text to a phone push service (Pushover)."""
    # added: the lesson left this helper as "...". This is a minimal version.
    user, token = os.getenv("PUSHOVER_USER"), os.getenv("PUSHOVER_TOKEN")
    if not (user and token):
        # added: with no mail and no push set up, print so you can still see the result
        print("[nothing sent: no mail or push settings]\n" + text)
        return
    requests.post("https://api.pushover.net/1/messages.json",
                  data={"user": user, "token": token, "message": text[:1000]}, timeout=10)


def send_message(subject: str, body: str) -> None:
    """One door for sending. The agents never know which way it went."""
    if os.getenv("SMTP_APP_PASSWORD"):
        send_by_email(subject, body)
    else:
        push(f"{subject}\n\n{body}")  # phone push fallback
