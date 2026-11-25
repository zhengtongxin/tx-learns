A TEAM THAT WRITES CODE: code package
======================================
Lesson: agentic-ai/14-coding-team.html
All names and data in this package are invented. Built on CrewAI and Docker.

WHAT YOU BUILD
--------------
A crew of four roles that builds a small "tab system" for a mamak stall (open a tab, top up
cash, record orders at fixed prices, refuse an order that would push the balance below zero,
show the balance and a history). The roles are:
  lead          designs the module (the only one on the stronger, pricier model)
  backend_dev   writes tabs.py and saves it in the sandbox
  frontend_dev  writes app.py, a small Gradio screen (with live docs from an MCP server)
  tester        writes tests, runs them and reports pass or fail
Model-written code runs inside a throwaway Docker container that sees one folder only.
There is also a one-agent warm-up (warmup.py).

FOLDER STRUCTURE
----------------
14-coding-team/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    main.py              one kickoff (clears the sandbox first)
    crew.py              the four agents, four tasks and the crew
    warmup.py            Step 2: one coder with the two box tools
    config/agents.yaml
    config/tasks.yaml
    tools/box.py         save_file and run_python (runs in Docker)
    tools/__init__.py
    sandbox/             created when you run it: design.md, tabs.py, app.py, tests, report
  starter/               same layout, with TODO stubs

REQUIREMENTS
------------
- Python 3.10 to 3.13
- Docker Desktop installed AND running (check with: docker run --rm hello-world)
- An OpenAI API key
- Internet access for the first run (Docker downloads the python:3.12-slim image once, and the
  live-docs MCP server is reached over HTTPS)
- crewai is pinned to 1.14.4 because the library changes fast. If that version is no longer
  available when you read this, try the closest release and expect small differences.

INSTALL
-------
  cd packages/agentic-ai/14-coding-team
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and put in your OPENAI_API_KEY

RUN
---
  cd final
  python warmup.py       # optional: one coder, expect the answer 9000
  python main.py         # the whole crew
Then try the screen the crew built:
  cd sandbox
  pip install gradio
  python app.py          # open the address it prints

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- warmup.py ends with the number 9000 (1,000 cups x S$1.80 / S$0.20 per coin).
- After main.py, final/sandbox holds design.md, tabs.py, app.py, a test file and
  test_report.md. The report says which checks passed. Open the tab screen and try: top up
  S$5, order a teh_tarik (S$2.00), then try to order more than the balance allows. The
  last one should be refused.
- Open the sandbox files and read them. Passing tests only mean the code matches what the
  tester thought to check.

One failure case: Docker is not running. run_python then returns an error text, or the agent
says the code "ran fine" with no output. Fix: start Docker Desktop, run
`docker run --rm hello-world`, then run main.py again. The first run is slow because the
image downloads once.

Another: a tool "exists" but always fails after an upgrade. Look at the exact tool name being
sent, and pin crewai to the version in requirements.txt. If the docs MCP server is the
problem, set USE_DOCS_MCP=0 in .env.

COST NOTE (approximate)
-----------------------
Four agents, several tool calls each, one of them on a stronger model: expect roughly a few
cents up to a few tens of cents per full run. Docker and the sandbox cost nothing. These are
rough numbers only; check your provider pricing page.

CLEAN UP
--------
  rm -rf final/sandbox           the generated app and tests
  docker image rm python:3.12-slim      (optional, frees disk space)
  deactivate
  rm -rf .venv                   (Windows: rmdir /s /q .venv)
  rm .env
Containers are started with --rm, so they delete themselves after every run.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The market research team had tools for searching and pinging a phone. Here the tools
let agents write files and run code in a Docker sandbox, the crew has four specialised
roles chained with context, the lead alone gets the stronger model, and the frontend role
plugs in live library docs through MCP (mcps=). Added beyond the lesson's code: a flat
layout, the yaml for the roles the lesson only described, the warm-up script, a sandbox
clear before each run, plain error messages when Docker is missing or a script hangs,
and the USE_DOCS_MCP switch.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python warmup.py ends with the number 9000 (1,000 cups x S$1.80 / S$0.20 per coin).
- After python main.py, final/sandbox holds design.md, tabs.py, app.py, a test file and test_report.md.
- test_report.md says which checks passed and which failed.
- In the tab screen, topping up S$5 and ordering a teh_tarik (S$2.00) leaves S$3.00.
- An order larger than the balance is refused.

Compare your work with final/ afterwards, starting with crew.py, the tools folder and warmup.py.

验收标准（中文）
- python warmup.py 以数字 9000 结束（1,000 杯 x S$1.80 / 每枚硬币 S$0.20）。
- 运行 python main.py 后，final/sandbox 里有 design.md、tabs.py、app.py、一个测试文件和 test_report.md。
- test_report.md 写明哪些检查通过、哪些失败。
- 在账单界面充值 S$5 再点一杯 teh_tarik（S$2.00），余额为 S$3.00。
- 超过余额的订单会被拒绝。
