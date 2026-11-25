A PERSONAL HELPER THAT REMEMBERS: code package
===============================================
Lesson: agentic-ai/17-personal-helper-that-remembers.html
All names and data in this package are invented. Built on LangChain and LangGraph.

WHAT YOU BUILD
--------------
Kaki, a small errand-running helper made of two parts:
  worker   one agent with tools (search, Wikipedia, ping my phone, ask a human, a real
           browser and a file tool through MCP) and middleware: a visible todo plan, hiding
           emails and card numbers, a cap on model calls, and a pause for approval before
           risky tools
  checker  a second model that returns a structured Verdict (feedback, done, need_human)
           by reading the worker's reply AND the list of tools it really called
You give Kaki an errand and a "done means" line. The default errand is "find three
kopitiams near Tiong Bahru that open before 7am and sell half-boiled eggs, write them to kopi.md
and ping my phone with the best one".

FOLDER STRUCTURE
----------------
17-personal-helper-that-remembers/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    main.py              the errand and the "done means" line
    tools.py             tools and the MCP sessions (open_toolbox)
    worker.py            build_worker: create_agent + middleware + checkpointer
    checker.py           Verdict, the checker, approval handling, run_errand
    workspace/           created when you run it: kopi.md lands here
  starter/               same layout, with TODO stubs

REQUIREMENTS
------------
- Python 3.10 or newer
- Node.js with npx (the browser and file tools are MCP servers started with npx)
- An OpenAI API key
- Optional: a Serper key (web search) and Pushover keys (phone ping). Without Serper, Kaki
  has no search tool but still has Wikipedia and the browser. Without Pushover the ping is
  printed in the terminal.
- First run of the browser server may download a browser. That can take a few minutes.

INSTALL
-------
  cd packages/agentic-ai/17-personal-helper-that-remembers
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and fill in OPENAI_API_KEY (and the optional ones)

RUN
---
  cd final
  python main.py
When Kaki wants to use ping_phone or ask_human, the program stops and asks you. Press
Enter to approve, or type a reason (for example "not before 8am") to reject. A rejection
does not end the run: Kaki reads your reason and carries on.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- You see Kaki's todo plan and tool calls scroll by, then "Kaki wants to: ..." before the
  ping. After you approve, the run finishes with:
    Kaki says: <a short report>
    Checker says: <feedback, saying the line was met>
- final/workspace/kopi.md exists. Real places on the web change, so the content can
  differ each time: always check the listing yourself.
- Try rejecting once with a reason and watch Kaki change its plan.

One failure case: confusing "cancel scope" or "different task" errors when the run ends.
A stdio MCP session must be opened and closed in the same asyncio task. Fix: keep
everything inside the `async with open_toolbox(...)` block in main.py, and do not open or
close the sessions from a different callback.

Another: the worker pauses on two tools at once and your single "approve" is not enough.
Fix: send one decision per paused call. settle_interrupts already does this.

Another: it loops for a long time. Keep both limits on: tries in run_errand and
ModelCallLimitMiddleware(run_limit=30).

COST NOTE (approximate)
-----------------------
A browser-using agent reads whole pages, so one errand can use many thousands of tokens,
and the checker adds a call on every try. Expect roughly tens of cents or less with a small
model and the 30-call cap. This is a rough guide only: check your provider pricing page.

CLEAN UP
--------
  rm -rf final/workspace          the files Kaki wrote
  deactivate
  rm -rf .venv                    (Windows: rmdir /s /q .venv)
  rm .env
The MCP servers are started by the program and stop when it ends. If a stray browser or
npx process is left over, close it from your task manager.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The graph lessons gave you create_agent, memory, middleware and MCP tools separately.
Here you combine them into one worker: MCP sessions kept open so the browser remembers its
state, a stack of safety middleware, a pause for human approval, and a checker model that
decides whether "done" really means done. Added beyond the lesson's code: open_toolbox
(the one-task session fix), a terminal approval loop, optional search and push keys with
print fallbacks, and the split into four files.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- The run prints Kaki's todo plan and tool calls, then pauses with 'Kaki wants to: ...' before the phone ping.
- After you approve, it ends with 'Kaki says: ...' and 'Checker says: ...' saying the line was met.
- final/workspace/kopi.md exists after the run.
- Rejecting once with a reason makes Kaki change its plan instead of stopping.
- The run still stops after the tries and ModelCallLimitMiddleware(run_limit=30) if the checker is never satisfied.

Compare your work with final/ afterwards, starting with worker.py, checker.py and tools.py.

验收标准（中文）
- 运行时先打印 Kaki 的待办计划和工具调用，然后在手机提醒前暂停并显示 “Kaki wants to: ...”。
- 你批准后，结束时出现 “Kaki says: ...” 和说明已达标的 “Checker says: ...”。
- 运行后 final/workspace/kopi.md 存在。
- 带理由拒绝一次，Kaki 会改变计划而不是停下。
- 即使检查者始终不满意，运行也会在尝试次数和 ModelCallLimitMiddleware(run_limit=30) 处停止。
