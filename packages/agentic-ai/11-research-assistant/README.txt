A RESEARCH ASSISTANT: code package
===================================
Lesson: agentic-ai/11-research-assistant.html
All names and data in this package are invented.

WHAT YOU BUILD
--------------
Four small agents and plain Python that turn one big question into a report.
Question used in the lesson: "What is the cheapest way for a small kopitiam in Penang to
take cashless payments in 2026?"
  Planner   -> splits the question into 3 web searches (a typed list)
  Searcher  -> runs each search with the hosted web search tool, all three at once
  Writer    -> turns the summaries into a typed Report (summary, markdown, next questions)
  Mailroom  -> turns the report into an HTML email and sends it (or prints "Not sent")

FOLDER STRUCTURE
----------------
11-research-assistant/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    research.py          the four agents, the steps and main()
    mailer.py            send_message helper and the send_report tool
  starter/               same layout, with TODO stubs

REQUIREMENTS
------------
- Python 3.10 or newer
- An OpenAI API key. The hosted web search tool is an OpenAI feature and is charged per search.
- Email settings only if you set SEND_EMAIL = True (SMTP server, your address, an app password).

INSTALL
-------
  cd packages/agentic-ai/11-research-assistant
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and put your OPENAI_API_KEY in it

RUN
---
  cd final
  python research.py
It runs the whole recipe once. It takes a minute or two.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
With SEND_EMAIL = False (the default) you should see:
  Not sent: <the subject line the Mailroom chose>
  <a 2 to 3 sentence summary answering the question>
Open the Traces page of your OpenAI dashboard: all four agents appear as one run named
"Kopitiam payments research", with three web searches inside it.
Open the sources the searches found before trusting any fee: this is a learning tool, not advice.

One failure case: "SyntaxError: 'await' outside function" when you paste lesson code into a
.py file. Fix: keep awaits inside async def and start with asyncio.run(main()), as research.py does.

Another: the Searcher answers from memory with old facts. Fix: keep
ModelSettings(tool_choice="required") on the Searcher, and check the trace to see that a
real web search happened.

COST NOTE (approximate)
-----------------------
One run is about 1 planner call, 3 searcher calls (each with a paid web search), 1 writer
call and 1 mailroom call. With a small model this is usually well under a dollar, and the
web searches are the part that is charged per use. Keep it at 3 searches while learning.
Prices change: check your provider's pricing page.

CLEAN UP
--------
  deactivate
  rm -rf .venv        (Windows: rmdir /s /q .venv)
  rm .env
Nothing else is created on disk. If you switched on sending, revoke the SMTP app password.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The outreach helper let a manager agent or your code decide the order and used only
function tools. Here you add a hosted tool (WebSearchTool), structured outputs for the
planner and the writer (Pydantic forms), and a fixed recipe run by plain Python:
plan, search in parallel, write, deliver. Added beyond the lesson's code: the report form
asks for 800 to 1200 words (the lesson's "what I got wrong" fix), and the code is split
into research.py and mailer.py.
