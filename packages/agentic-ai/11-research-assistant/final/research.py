"""research.py: plan, search, write, deliver. Plain Python is the boss."""
import asyncio

from agents import Agent, ModelSettings, Runner, WebSearchTool, trace
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from mailer import send_report

load_dotenv(override=True)  # reads OPENAI_API_KEY from your .env file

MODEL = "gpt-5.4-mini"  # the model name the lesson uses

# Step 1: a hosted tool. It runs on the provider's servers and each search is charged.
searcher = Agent(
    name="Searcher",
    instructions="You get one search term. Search the web and summarise what you find in under 300 words.",
    model=MODEL,
    tools=[WebSearchTool()],
    model_settings=ModelSettings(tool_choice="required"),  # must search, no answering from memory
)


# Step 2: the planner returns a plan, not a paragraph
class SearchIdea(BaseModel):
    why: str = Field(description="Why this search helps answer the question.")
    query: str = Field(description="The exact words to type into a web search.")


class SearchPlan(BaseModel):
    searches: list[SearchIdea] = Field(description="The web searches to run.")


planner = Agent(
    name="Planner", model=MODEL, output_type=SearchPlan,
    instructions="You plan research. Given a question, list 3 web searches that together answer it.")


# Step 3: run the searches at the same time
async def search_one(idea: SearchIdea) -> str:
    result = await Runner.run(searcher, f"Search term: {idea.query}\nWhy: {idea.why}")
    return result.final_output


async def search_all(search_plan: SearchPlan) -> list[str]:
    jobs = [search_one(idea) for idea in search_plan.searches]  # one job per search, none started yet
    return await asyncio.gather(*jobs)  # the * hands gather each job separately; it runs them together


# Step 4: the writer hands back a report
class Report(BaseModel):
    summary: str = Field(description="The answer in 2-3 sentences.")
    # added: the lesson's "What I got wrong" says the report ran on, so the length is asked for here
    report_md: str = Field(description="The full report in markdown, with headings, around 800-1200 words.")
    next_questions: list[str] = Field(description="Good questions to research next.")


writer = Agent(
    name="Writer", model=MODEL, output_type=Report,
    instructions="You write a clear research report for a small business owner from the search summaries.")


async def write(question: str, findings: list[str]) -> Report:
    return (await Runner.run(writer, f"Question: {question}\nSearch summaries: {findings}")).final_output


# Step 5: the mailroom (send_report comes from mailer.py)
mailroom = Agent(
    name="Mailroom", model=MODEL, tools=[send_report],
    instructions="You get a report in markdown. Make a clean HTML email and send it with send_report.")

# Step 6: code is the boss
QUESTION = "What is the cheapest way for a small kopitiam in Singapore to take cashless payments in 2026?"


async def plan(question: str) -> SearchPlan:
    return (await Runner.run(planner, f"Question: {question}")).final_output


async def deliver(report: Report) -> None:
    await Runner.run(mailroom, report.report_md)


async def main():
    with trace("Kopitiam payments research"):
        search_plan = await plan(QUESTION)
        findings = await search_all(search_plan)
        report = await write(QUESTION, findings)
        await deliver(report)
    print(report.summary)


if __name__ == "__main__":
    asyncio.run(main())  # in a notebook, just write: await main()
