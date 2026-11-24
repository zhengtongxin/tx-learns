PROJECT: A SWARM WITH A CAP
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/18-swarm-with-a-cap.html

All data is invented: 25 sample claims, their policies and the wording.


WHAT YOU BUILD
A page on the dashboard that runs the claims agent in parallel, safely:
  - a small web service (FastAPI) with a start button and a box for "agents at
    once"; the number must be 1 to 25 (default 3) or the request is refused
    before any agent starts
  - only one dispatch at a time: a second start answers HTTP 409
  - every status change is written to a table (runs.db), one row per claim
    per run, so the panel, a page reload and a second browser all agree
  - a finishing summary counted from those rows, not written by a model:
    approved, waiting for sign-off (over S$800), declined, referred, left
    for a handler
  - a health check, so the button says so when the service is not running
  - cost and time per claim stored against its run, so you can compare caps
  - the dispatcher from the earlier lesson: plain code, a cap, retries


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    service.py              this project: routes, run table, page
    dispatcher.py           added: the dispatcher from the earlier lesson, finished
    desk.py                 added: load_claims() and decide(), which the lesson
                            only describes
    try_dispatcher.py       added: tries the dispatcher with stand-in agents
                            and times caps of 3, 10 and 25
    fake_model.py           added: rule-based stand-in for DRY_RUN=1
    data/                   claims.json, policies.json, policy_wording.txt
    (created when you run: runs.db)
  starter/                  same layout; service.py, dispatcher.py and desk.py
                            have TODO stubs


REQUIREMENTS
  - Python 3.10 or newer
  - fastapi, uvicorn, pydantic and openai (requirements.txt)
  - An OpenAI API key for real runs. Not needed for DRY_RUN=1.


INSTALL
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
       cp env.example .env                then put your key in .env
       set -a; source .env; set +a        (PowerShell: $env:OPENAI_API_KEY="...")
  Never commit .env or paste a real key into a file you share.


RUN
       cd final
       python try_dispatcher.py           no model at all: stand-ins, three caps
       DRY_RUN=1 uvicorn service:app      the service with stand-in answers
       uvicorn service:app                the service with the real model
  Open http://127.0.0.1:8000 in a browser. Choose a number, press Start dispatch.
  Or from a terminal:
       curl -X POST localhost:8000/dispatch -H "Content-Type: application/json" -d '{"n": 5}'
       curl localhost:8000/runs/<run id>/summary


TEST: WHAT SUCCESS LOOKS LIKE
  try_dispatcher.py prints (times vary a little; the stand-ins sleep about a
  second each):
       3 agents: 8.6 seconds {'done': 25}
       10 agents: 3.2 seconds {'done': 25}
       25 agents: 1.5 seconds {'done': 25}
  More agents at once means less time, with the same 25 claims done.

  In the browser: the table fills with one row per claim, moving from
  waiting to running to done, then the summary appears, for example
       {"approved": 15, "waiting_signoff": 5, "declined": 3,
        "referred": 2, "left_for_handler": 0}
  (dry-run numbers; a real model will differ). The five groups add up to 25.

  Failures and their fixes:
    - POST /dispatch with {"n": 0} or {"n": 26} answers 422: the cap is
      validated before anything starts. Use 1 to 25.
    - Press Start twice: the second answers 409 "A dispatch is already
      running." Wait for the first to finish.
    - Stop the service and reload a saved copy of the page: the button is
      switched off and says "The agent service is not running. Ask Kumar to
      start it."
    - A real run shows many "failed" rows: you are hitting the provider's rate
      limit. Lower the cap. (Rate-limit and timeout errors wait and retry
      without counting as a failure; any other error goes back once, then to a
      handler.)


COST NOTE (approximate)
  One dispatch is 25 model calls of roughly 700 tokens in and 80 out, so a few
  US cents with a mini model, whatever the cap is: the cap changes how fast you
  finish, not what you pay. Approximate: check your provider's prices.
  GET /runs/<run id>/totals shows the exact cost recorded for a run.
  DRY_RUN=1 costs nothing.


CLEAN UP
  Stop the service with Ctrl+C.
       rm -f final/runs.db
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +
  Nothing else is left running and no cloud resources are created.


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The earlier lesson's dispatcher only ran from a laptop terminal. Now it sits
  behind a web service: a validated cap, one dispatch at a time, every status
  written to a table, a summary counted from records, a health check and cost
  and time per claim. The dispatcher itself is unchanged.
