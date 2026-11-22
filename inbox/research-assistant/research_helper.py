# My research helper, written as a plain script (no notebook needed).
# Run:  python research_helper.py
# Needs OPENAI_API_KEY in .env. Each web search costs a little money (see notes.md).
# With SEND_EMAIL = False it prints the email instead of sending it.

import asyncio
import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from agents import Agent, ModelSettings, Runner, WebSearchTool, function_tool, trace

load_dotenv(override=True)

MODEL = "gpt-5.4-mini"
HOW_MANY_SEARCHES = 3      # each search is one paid web search call, keep it small while testing
SEND_EMAIL = False         # True = really send, needs MY_EMAIL, SMTP_SERVER, SMTP_APP_PASSWORD in .env

QUESTION = ("What is the cheapest way for a small kopitiam in Penang to accept cashless payments "
            "(DuitNow QR, e-wallets, card terminals) in 2026, including fees and setup steps?")


# ---- Agent 1: the planner. It only thinks of searches, it does not search. ----
class SearchIdea(BaseModel):
    why: str = Field(description="Why this search helps answer the question.")
    query: str = Field(description="The exact words to type into a web search.")

class SearchPlan(BaseModel):
    searches: list[SearchIdea] = Field(description="The web searches to run to answer the question well.")

planner = Agent(
    name="Planner",
    instructions=f"You plan research. Given a question, list {HOW_MANY_SEARCHES} web searches that together answer it.",
    model=MODEL,
    output_type=SearchPlan,
)


# ---- Agent 2: the searcher. A hosted tool: the web search runs on OpenAI's side. ----
searcher = Agent(
    name="Searcher",
    instructions=("You get one search term. Search the web for it and write a short summary of what you found: "
                  "2-3 paragraphs, under 300 words. Only the summary, nothing else."),
    tools=[WebSearchTool()],
    model=MODEL,
    model_settings=ModelSettings(tool_choice="required"),   # must search, no answering from memory
)


# ---- Agent 3: the writer. Turns all the summaries into one report. ----
class Report(BaseModel):
    summary: str = Field(description="The answer in 2-3 sentences.")
    report_md: str = Field(description="The full report in markdown, with headings.")
    next_questions: list[str] = Field(description="Good questions to research next.")

writer = Agent(
    name="Writer",
    instructions=("You write a clear research report for a small business owner. You get the question and "
                  "summaries of several web searches. Explain fees and steps plainly. Around 800-1200 words, markdown."),
    model=MODEL,
    output_type=Report,
)


# ---- Agent 4: the mailroom. Its only job is to turn the report into a nice email and send it. ----
def send_message(subject: str, text_body: str, html_body: str) -> None:
    """Plain Python helper, not a tool. Sends the email to myself."""
    if not SEND_EMAIL:
        print(f"\n--- EMAIL (not sent, SEND_EMAIL is False) ---\nSubject: {subject}\n\n{text_body[:500]}...\n")
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
    """Email the finished research report to me.

    Args:
        subject: A short, clear subject line.
        text_body: The report as plain text.
        html_body: The report as simple, clean HTML.
    """
    send_message(subject, text_body, html_body)
    return "Sent"

mailroom = Agent(
    name="Mailroom",
    instructions="You get a report in markdown. Turn it into a clean HTML email with a good subject, then send it with send_report.",
    tools=[send_report],
    model=MODEL,
)


# ---- The orchestration is plain Python: one Runner.run per step. ----
async def plan(question: str) -> SearchPlan:
    print("Planning searches...")
    result = await Runner.run(planner, f"Question: {question}")
    return result.final_output

async def search_one(idea: SearchIdea) -> str:
    result = await Runner.run(searcher, f"Search term: {idea.query}\nWhy: {idea.why}")
    return result.final_output

async def search_all(search_plan: SearchPlan) -> list[str]:
    print(f"Running {len(search_plan.searches)} searches at the same time...")
    return await asyncio.gather(*(search_one(idea) for idea in search_plan.searches))

async def write(question: str, findings: list[str]) -> Report:
    print("Writing the report...")
    result = await Runner.run(writer, f"Question: {question}\nSearch summaries: {findings}")
    return result.final_output

async def email(report: Report) -> None:
    print("Emailing it...")
    await Runner.run(mailroom, report.report_md)

async def main():
    with trace("Kopitiam payments research"):   # one trace for the whole run, look at it afterwards
        search_plan = await plan(QUESTION)
        findings = await search_all(search_plan)
        report = await write(QUESTION, findings)
        await email(report)
    print("\nSummary:", report.summary)
    print("Next questions:", *report.next_questions, sep="\n - ")

if __name__ == "__main__":
    asyncio.run(main())     # in a notebook, just write: await main()
