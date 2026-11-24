A MARKET RESEARCH TEAM: code package
=====================================
Lesson: agentic-ai/13-market-research-team.html
All names and data in this package are invented. Built on CrewAI.

WHAT YOU BUILD
--------------
A crew with a manager that helps Mei's aunt choose a second kuih stall location:
  scout       searches the web for night markets people are talking about now
  researcher  studies each one: crowd, rent, how many kuih sellers are there
  picker      chooses one market and pings the aunt's phone (one notification)
  boss        the manager on top: hands out the work and checks it
Results pass between agents as typed lists (Pydantic forms), and memory is switched on so
the second run suggests different markets from the first.

FOLDER STRUCTURE
----------------
13-market-research-team/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    main.py              the start button: kickoff with state and today's date
    crew.py              the forms, the agents, the tasks and the hierarchical crew
    config/agents.yaml   the four workers
    config/tasks.yaml    the three order slips
    tools/notify.py      the custom phone-ping tool
    tools/__init__.py
  starter/               same layout, with TODO stubs

REQUIREMENTS
------------
- Python 3.10 to 3.13 (check the CrewAI docs for the versions your pinned release supports)
- An OpenAI API key and a Serper API key (serper.dev, free tier available)
- Optional: Pushover keys. Without them the notification is printed in the terminal.
- crewai is pinned to 1.14.4 in requirements.txt because the library changes fast and a
  newer one can break the generated project. If that version is no longer available when
  you read this, try the closest release and expect small API differences.

INSTALL
-------
  cd packages/agentic-ai/13-market-research-team
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and fill in OPENAI_API_KEY and SERPER_API_KEY

RUN
---
  cd final
  python main.py
This uses a flat layout (not the `crewai create` scaffold), so it runs with plain python.
Keep test runs small: every search uses your Serper quota.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- The terminal shows the manager delegating to the scout, researcher and picker.
- Files appear in final/output/: studies.json (a study of each market) and pick.md.
- The last printed text names one market and why. If you have no Pushover keys you also see
  "[notify skipped, no Pushover keys] ...".
- Run it a second time: with memory on, the scout should suggest markets it has not
  suggested before.

One failure case: the run stops with a KeyError or an error about a missing "{topic}" or
"{state}" input. Every {blank} in the YAML files needs a key in kickoff(inputs=...).
Fix: make the keys in main.py match the blanks in agents.yaml and tasks.yaml exactly.

Another: the manager delegates the same task several times or skips the notification.
Fix: keep expected_output clear and keep "always send exactly one notification" in the
picker's goal. If the flow is fixed anyway, a sequential crew with context is more reliable.

COST NOTE (approximate)
-----------------------
A hierarchical crew with memory makes many model calls: the manager talks a lot, and the
memory feature adds embedding calls on each run. Expect somewhere between a few cents and
a few tens of cents per run with a small model, plus Serper quota per search. This is a
rough guide only: check your provider pricing pages.

CLEAN UP
--------
  deactivate
  rm -rf .venv                 (Windows: rmdir /s /q .venv)
  rm -rf final/output          the saved study files
  rm .env
CrewAI stores memory on your computer. Where depends on your operating system and
version. To reset memory, look for CrewAI's storage folder (the run's verbose output or
the CrewAI docs tell you where) and delete it, or run `crewai reset-memories -a` from the
project folder if your version has that command.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The roles lesson used a sequential crew with no tools. Here you add a web search tool
(SerperDevTool), typed hand-overs with output_pydantic and context, a custom tool
written with @tool, a hierarchical crew with your own manager passed as manager_agent,
and memory=True with today's date in the prompt. Added beyond the lesson's code: the
researcher agent, the pick_market task, the YAML for all four agents, a print fallback
when there are no Pushover keys, and the flat layout so it runs with `python main.py`.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python main.py shows the manager delegating in order to the scout, researcher and picker.
- final/output/studies.json holds one study per market the scout suggested.
- final/output/pick.md names one market and why.
- Exactly one notification is sent, or '[notify skipped, no Pushover keys]' is printed once.
- A second run suggests markets the scout did not suggest the first time (memory on).

Compare your work with final/ afterwards, starting with: crew.py, the config YAML files, main.py.

验收标准（中文）
- python main.py 显示管理者依次把任务交给侦察员、研究员和挑选者。
- final/output/studies.json 为侦察员建议的每个市场各存一份研究。
- final/output/pick.md 写明选出的一个市场及原因。
- 只发出一条通知，或只打印一次 “[notify skipped, no Pushover keys]”。
- 第二次运行时，侦察员建议的市场与第一次不同（开启记忆）。
