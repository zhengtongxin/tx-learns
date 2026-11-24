WRITE YOUR OWN AGENT LOOP: code package
========================================
Lesson: agentic-ai/20-own-agent-loop.html
All names and data in this package are invented. Built on Google ADK.

WHAT YOU BUILD
--------------
A coordinator agent that runs a team of builders and finishes on its own. The story: a
school fair website with one page for each of five booths (pancakes, ring toss, face
painting, book swap, plant sale). The coordinator is itself an agent with four tools:
  start_builder      starts one builder on one booth (returns at once, so they run in parallel)
  wait_for_builders  waits for them all, with a timeout
  inspect_page       opens one finished page in a real browser through a fresh inspector agent
  send_back          sends one builder back with a single fix task (once per page only)
The builders and the coordinator only talk through a shared SQLite task board, shown live in
the terminal. The agent chooses; the tools do the exact mechanics (processes, timeouts, files).

FOLDER STRUCTURE
----------------
20-own-agent-loop/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    main.py              starts everything, draws the live board, writes the front page
    config.py            model names, limits, booths and the worker slots
    coordinator.py       the four tools and the coordinator agent
    team.py              starts, waits for and kills the builder processes
    board.py             the shared SQLite task board and its live view
    qa.py                the inspector: a fresh agent with a real browser per page
    runner.py            run_once: run one agent to the end with a cap on model calls
    workers/adk_worker.py   one builder
    site/                created when you run it: the fair website
  starter/               same layout, with TODO stubs (config.py is complete)

REQUIREMENTS
------------
- Python 3.10 or newer
- Node.js with npx, and Google Chrome installed (the inspector uses a real browser)
- A Google AI Studio API key (aistudio.google.com)
- On Windows: the process clean-up in team.py uses a Unix feature; see the note in kill_all
- IMPORTANT, honest note: the lesson had five workers, one in each framework from the previous
  lesson. To keep this package runnable on its own, all five slots in config.py run the same
  Google ADK worker. To follow the lesson fully, write the other four workers and point
  WORKERS in config.py at them. A slot whose file is missing is simply not on the team.

INSTALL
-------
  cd packages/agentic-ai/20-own-agent-loop
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and put in your GOOGLE_API_KEY

RUN
---
  cd final
  python main.py --plan     # prints the team and booths, spends nothing
  python main.py            # the real run
Stop early with Ctrl+C. The program kills the builder processes on the way out.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- You see a table (the board) with five goals changing from pending to working to done as
  the builders tick their steps off.
- The coordinator then inspects each page and may send one back once.
- At the end: "Coordinator says: ..." with which pages work, and final/site/ contains
  index.html (the front page), style.css and one folder per builder with its own index.html.
  Open final/site/index.html in your browser and click each booth's widget.
- Even if every builder fails, final/site/index.html still exists. That is the plain fallback.

One failure case: "Event loop is closed" on exit, or a messy table full of text.
Fix: builders are started with plain subprocess.Popen and their output goes to DEVNULL, and
the browser toolset is closed inside the loop (qa.py does this). Do not switch to asyncio's
subprocess transports.

Another: the inspector times out on the first page. The first browser call starts slowly,
so MCP_TIMEOUT_S in config.py is 30 seconds instead of the default 5.

COST NOTE (approximate)
-----------------------
Five builders plus up to five inspectors plus the coordinator add up fast, because each
inspector drives a browser and reads page snapshots. Expect roughly a dollar or less per
full run with a small "flash" model, more if you let it retry. Caps are in config.py
(80 coordinator calls, 40 per builder, 25 per inspector). Drop to cheaper models in .env
while experimenting. These are rough numbers only.

CLEAN UP
--------
  rm -rf final/site final/board.db      the generated pages and the board
  deactivate
  rm -rf .venv                          (Windows: rmdir /s /q .venv)
  rm .env
If a run was killed in a strange way, check for leftover python or chrome processes in your
task manager and close them. The small web server inside main.py stops when it exits.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The framework tour built the same single worker five times. Here you add the outer loop:
a coordinator agent that starts the workers, waits, inspects each page with a fresh
browser-driving inspector, sends back at most one fix per page, and stops. New ideas: the
shared board as the only channel, tools for the brittle mechanics, bounds on everything
(model calls, worker time, one fix per page), killing the whole process tree, and a fallback
front page. Added beyond the lesson's code: the board, team, runner and one runnable worker
(the lesson only described them), a local web server for the inspector, a --plan flag, and a
shared style.css so the pages look alike.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python main.py --plan prints the team and the five booths without spending anything.
- The live board shows five goals moving from pending to working to done.
- The coordinator inspects each page and sends a broken one back at most once.
- At the end 'Coordinator says: ...' lists which pages work.
- final/site/index.html always exists, even if every builder fails, and the folder holds one folder per builder.

Compare your work with final/ afterwards, starting with coordinator.py, team.py and board.py.

验收标准（中文）
- python main.py --plan 打印团队和五个摊位，且不花任何费用。
- 实时看板上的五个目标从 pending 变为 working 再变为 done。
- 协调者检查每个页面，有问题的页面最多退回一次。
- 结束时 “Coordinator says: ...” 列出哪些页面可用。
- 即使所有建造者都失败，final/site/index.html 也始终存在，且每个建造者各有一个文件夹。
