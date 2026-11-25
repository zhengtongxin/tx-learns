"""research.py: plan, search, write, deliver. Plain Python is the boss."""
import asyncio

from agents import Agent, ModelSettings, Runner, WebSearchTool, trace
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from mailer import send_report

load_dotenv(override=True)  # reads OPENAI_API_KEY from your .env file

MODEL = "gpt-5.4-mini"  # the model name the lesson uses

# Step 1: a hosted tool. TODO: build `searcher` with tools=[WebSearchTool()] and
# ModelSettings(tool_choice="required"), so it must search and cannot answer from memory.
searcher = None


# Step 2: TODO: write two forms (BaseModel classes): SearchIdea (why first, then query) and
# SearchPlan (a list of SearchIdea). Then build `planner` with output_type=SearchPlan.
class SearchIdea(BaseModel):
    pass


class SearchPlan(BaseModel):
    pass


planner = None


# Step 3: run the searches at the same time
async def search_one(idea: SearchIdea) -> str:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


async def search_all(search_plan: SearchPlan) -> list[str]:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


# Step 4: TODO: a Report form with summary, report_md and next_questions, and a `writer` agent
# with output_type=Report.
class Report(BaseModel):
    pass


writer = None


async def write(question: str, findings: list[str]) -> Report:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


# Step 5: TODO: `mailroom` = an agent with tools=[send_report] that turns markdown into a clean HTML email.
mailroom = None

# Step 6: code is the boss
QUESTION = "What is the cheapest way for a small kopitiam in Singapore to take cashless payments in 2026?"


async def plan(question: str) -> SearchPlan:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


async def deliver(report: Report) -> None:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


async def main():
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    asyncio.run(main())  # in a notebook, just write: await main()
