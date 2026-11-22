# A research assistant: four small agents, joined by plain Python

My notes from a hands-on lab with the OpenAI Agents SDK. Rewritten in my own words, example changed.
Use the planned item in lessons.js under "Agent SDKs": "Project: a research assistant" (项目：研究助手), kind `p`.
File `agentic-ai/11-research-assistant.html`. It is a project, so the tag is **"Agent SDKs · Project"**
(中文 "智能体 SDK · 项目"), the same as the outreach email helper. Not "Lesson 4" or "Lesson 5".
Lessons 08 and 10 already teach tools, guardrails and structured outputs, so link back instead of re-teaching.
The new ideas here: hosted tools (web search), planning searches with structured output,
running searches at the same time with `asyncio.gather`, and orchestrating with code instead of a manager agent.
The full working script is `research_helper.py` in this folder. Code in the lesson should match it.

## My example for the lesson
Aina helps her Uncle Lim with his kopitiam (the coffee shop from lesson 10) in Penang. Customers keep asking
"boleh scan?" and he wants to know the cheapest way to take cashless payments: DuitNow QR, e-wallets
like Touch 'n Go or GrabPay, or a card terminal. What are the fees, and how does he set it up?
Aina could spend a whole evening googling. Instead she builds a research helper that plans the searches,
runs them, writes a report and emails it to her.

## Why this is useful
"Deep research" is one of the most useful agent jobs for anyone, in any line of work:
compare suppliers, check a new rule, plan a trip, prepare for a meeting. Same pattern every time.

## The plan: four agents, each with one job
1. **Planner**: reads the question and lists a few web searches worth doing. It does not search.
2. **Searcher**: gets one search term, searches the web, writes a short summary.
3. **Writer**: gets the question plus all the summaries and writes one report.
4. **Mailroom**: turns the report into a nice HTML email and sends it with a tool.

Then four small async Python functions, one `Runner.run()` each, and a `main()` that calls them in order.

## Part 1: hosted tools (web search)
- Until now every tool was my own Python function with `@function_tool`. A **hosted tool** is different:
  it runs on OpenAI's servers, not on my computer. I just add it to the agent: `tools=[WebSearchTool()]`.
- Others exist too: file search over my own uploaded files, a code interpreter that runs code in a sandbox,
  image generation, and remote MCP servers. Quick to use, but you pay per call and you are tied to one provider.
- **Cost:** web search is charged per call (about 1 US cent each at the time I tried it, and sometimes one call
  does more than one search). Keep `HOW_MANY_SEARCHES` small while testing. Later topics use free or cheaper
  search tools.
- `ModelSettings(tool_choice="required")` forces the searcher to actually search instead of answering from memory.

```python
searcher = Agent(
    name="Searcher",
    instructions="You get one search term. Search the web for it and write a short summary ... under 300 words.",
    tools=[WebSearchTool()],
    model="gpt-5.4-mini",
    model_settings=ModelSettings(tool_choice="required"),
)
```

## Part 2: the planner uses structured output
- Same idea as lesson 10, now for a plan: the planner returns a list of searches, each with a reason.
- Asking for `why` before `query` helps: the model thinks about the reason first, so the search is better.
- `SearchPlan.model_json_schema()` shows what the model sees. The `Field(description=...)` text is the prompt
  for each field.

```python
class SearchIdea(BaseModel):
    why: str = Field(description="Why this search helps answer the question.")
    query: str = Field(description="The exact words to type into a web search.")

class SearchPlan(BaseModel):
    searches: list[SearchIdea] = Field(description="The web searches to run to answer the question well.")

planner = Agent(name="Planner", model="gpt-5.4-mini", output_type=SearchPlan,
                instructions="You plan research. Given a question, list 3 web searches that together answer it.")
```

- The writer also returns structured output: `summary`, `report_md` (the full markdown report) and
  `next_questions`. So I get the short answer and ideas for what to look at next, not just a wall of text.

## Part 3: run the searches at the same time
- Each search takes a few seconds. One after another is slow. `asyncio.gather` starts them all at once and
  waits until all are done. 3 searches take about as long as 1.
- `async def` + `await` was the confusing part for me. Simple version: `await` means "wait for this, but let
  other work run meanwhile". `gather` is how you start several of them together.

```python
async def search_one(idea: SearchIdea) -> str:
    result = await Runner.run(searcher, f"Search term: {idea.query}\nWhy: {idea.why}")
    return result.final_output

async def search_all(search_plan: SearchPlan) -> list[str]:
    return await asyncio.gather(*(search_one(idea) for idea in search_plan.searches))
```

## Part 4: orchestrate with code, not with a manager agent
- In the outreach helper a manager agent decided what to call next. Here my own Python decides the order:
  plan, search, write, email. Each step is one `Runner.run()`.
- Why: it is predictable. The order never changes, every step returns a typed object, and if a step fails I know
  exactly which one. A manager agent is more flexible but can skip steps or loop. For a fixed recipe, code wins.
- Wrap the whole run in `with trace("..."):` so all four agents show up as one run in the trace viewer.

```python
async def main():
    with trace("Kopitiam payments research"):
        search_plan = await plan(QUESTION)
        findings = await search_all(search_plan)
        report = await write(QUESTION, findings)
        await email(report)
    print(report.summary)

asyncio.run(main())   # in a notebook: await main()
```

## Part 5: the mailroom
- Same as the outreach helper: a `@function_tool` called `send_report(subject, text_body, html_body)` that calls a
  plain helper `send_message(...)`. The docstring `Args:` lines become the tool's parameter descriptions.
- I added `SEND_EMAIL = False` so while testing it just prints the email. Flip to True when the SMTP settings
  (`MY_EMAIL`, `SMTP_SERVER`, `SMTP_APP_PASSWORD`) are in `.env`.
- Gotcha: the mailroom agent calls the tool. My own code never calls `send_report(...)` directly, because
  `@function_tool` turns it into a tool object for the agent, not a normal function. If I want to send from
  my own code, I call `send_message(...)`.

## What confused me
- In a notebook `await Runner.run(...)` works straight away, but in a `.py` file it is a SyntaxError outside an
  `async def`. In a script, put everything in `async def main()` and call `asyncio.run(main())`.
- Without `tool_choice="required"` the searcher is allowed to answer from memory, with old facts and no search.
  The trace shows whether a web search call really happened, so check it there.
- The lab used 5 searches, then I saw the cost note. 3 is enough to learn.
- The writer's report can be long. Ask for "around 800-1200 words" or it goes on forever.

## Check before trusting the report
- The report is only as good as the searches. Fees and promos change, so Aina should open the sources for the
  numbers before Uncle Lim signs anything. Good "what I got wrong" or checklist item.

## Ideas to try myself
- Let the planner pick how many searches it needs (with a maximum), instead of a fixed number.
- Add a checker agent from lesson 10 that reads the report and flags any fee without a source.
- Put it behind a small web page so Uncle Lim can type his own question.
