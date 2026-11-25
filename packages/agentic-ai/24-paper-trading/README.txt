A PAPER-TRADING SIMULATION: code package
=========================================
Lesson: agentic-ai/24-paper-trading.html
All names, prices and money in this package are invented. It is PLAY MONEY ONLY: nothing
here connects to a real broker or real prices.

WHAT YOU BUILD
--------------
A paper trading floor. Four agent "uncles" (Wong, Muthu, AhKow, Hamid) each get S$10,000 of
pretend money, a written strategy and the same tools, and trade four made-up tickers
(KOPI, ROTI, TEHT, NASI) on a timer. Everything is an MCP server:
  accounts server  your own FastMCP: cash, shares, buy, sell, change_strategy
  market server    prices from a small simulator (slow-moving, made up)
  push server      one tool that pings your phone after a trade
Each uncle also has a Researcher agent (used as a tool) with fetch, search and memory servers.
A custom tracer writes every step to a SQLite log with the uncle's name, and a small
dashboard (FastAPI + a Vite/TypeScript page) shows values, holdings and the live log.
Uncles can rewrite their own strategy after reviewing their results.

FOLDER STRUCTURE
----------------
24-paper-trading/
  README.txt
  requirements.txt       Python packages
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    floor/
      market.py          the price simulator
      db.py              SQLite helper: accounts, trades, log, value history
      accounts.py        the plain ledger class (Account) and the four strategies
      accounts_server.py your FastMCP accounts server
      market_server.py   lookup_price tool
      push_server.py     push tool
      trader.py          run_uncle: one uncle + researcher, servers opened with AsyncExitStack
      tracing.py         FloorLog, the custom TracingProcessor
      trading_floor.py   runs all four on a timer
      api.py             read-only FastAPI for the dashboard
    frontend/            Vite + TypeScript dashboard (package.json, src/main.ts, ...)
  starter/               same layout, with TODO stubs (db.py and accounts.py are given complete)

REQUIREMENTS
------------
- Python 3.10 or newer
- Node.js with npx (researcher servers and the dashboard), and uv/uvx (the fetch server)
- An OpenAI API key
- Optional: a Tavily key (search for the researcher), Pushover keys (phone pings)
- Without Tavily or Pushover the floor still runs: search is skipped and pushes say "skipped".

INSTALL
-------
  cd packages/agentic-ai/24-paper-trading
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and put in your OPENAI_API_KEY
  cd final/frontend && npm install && cd ../..      (only for the dashboard)

RUN
---
Always run from the final/ (or starter/) folder.
Start with ONE uncle, ONE round (cheapest way to see it work):
  cd final
  python -m floor.trading_floor Wong
Then the dashboard, in three terminals (from final/):
  terminal 1:  uvicorn floor.api:app --port 8000
  terminal 2:  cd frontend && npm run dev      then open http://localhost:5173
  terminal 3:  python -m floor.trading_floor              # all four, repeating
For one round of all four, add --once.
Stop with Ctrl+C in each terminal.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- After the single-uncle run, open final/floor.db with any SQLite viewer, or start the API
  and visit http://localhost:8000/api/portfolio/Wong. You should see his cash, holdings
  and value. If he traded, /api/transactions/Wong lists the trades.
- The dashboard shows four cards that update every few seconds, each with value, profit
  or loss, holdings, a small line chart, and his written strategy. The log underneath fills
  with lines like "Wong [agent] start Wong", "[function] start buy_shares".
- Over several rounds, compare each uncle's strategy text with the one he started with.
  Did the results justify the change?

One failure case: an uncle fails with a timeout or "connection closed" while starting its
servers. The first run of uvx, npx and the memory server downloads things and is slow.
Fix: it already waits 120 seconds per server; try again, and make sure Node and uv are
installed (`node --version`, `uvx --version`). A failing uncle is logged and the others
keep going.

Another: the dashboard says "Cannot reach the API". Fix: start uvicorn on port 8000 first.
Another: "unknown ticker". Only KOPI, ROTI, TEHT and NASI exist.

COST NOTE (approximate)
-----------------------
This is the most expensive project in the track. Each round runs four traders, each with a
researcher and several servers, so one round can be dozens of model calls. Left running
on a timer, it keeps spending while you sleep. With a small model and
RUN_EVERY_N_MINUTES=60, expect on the order of a dollar or less per day, but this is only a
rough guide: check your provider pricing page. Keep the interval long, use small models,
and stop the floor when you are done watching.

CLEAN UP
--------
  Ctrl+C in all three terminals
  rm final/floor.db            resets the accounts, trades, log and chart
  rm -rf final/memory          the researchers' memory files
  rm -rf final/frontend/node_modules
  deactivate
  rm -rf .venv                 (Windows: rmdir /s /q .venv)
  rm .env
If a run was killed, close any leftover node or python processes from your task manager.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The MCP lessons gave you one server at a time (your own tab book, third-party memory,
search and vector servers). Here you build a whole system from them: your own accounts
server, a market server with a simulator, a push server, researchers handed to traders as
tools, AsyncExitStack to open many servers, four agents running at once on a timer, a
custom tracer that logs per agent, agents that rewrite their own strategy, and a small
read-only API plus dashboard. Added beyond the lesson's code: the Account class and the
SQLite helper, sell_shares / get_holdings / get_transactions tools, key pass-through for
the push server, skipping optional servers when keys are missing, one uncle failing without
stopping the others, a --once switch, and the dashboard files.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python -m floor.trading_floor Wong runs one round and Wong's cash or holdings change in final/floor.db.
- /api/portfolio/Wong returns value, cash, holdings and profit.
- The dashboard shows four cards that refresh every few seconds, plus a live log with each uncle's name.
- An order larger than the cash is refused with a clear message.
- Only the tickers KOPI, ROTI, TEHT and NASI exist; any other gives 'unknown ticker'.

Compare your work with final/ afterwards, starting with the floor package (trading floor and accounts), the API routes and the frontend folder.

验收标准（中文）
- python -m floor.trading_floor Wong 运行一轮后，Wong 的现金或持仓在 final/floor.db 中发生变化。
- /api/portfolio/Wong 返回总值、现金、持仓和盈亏。
- 面板显示四张每隔几秒刷新的卡片，以及带每位大叔名字的实时日志。
- 超出现金的订单会被清楚地拒绝。
- 只有 KOPI、ROTI、TEHT 和 NASI 四个代码，其他代码会提示 “unknown ticker”。
