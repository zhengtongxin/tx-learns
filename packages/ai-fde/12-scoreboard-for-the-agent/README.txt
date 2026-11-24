PROJECT: A SCOREBOARD FOR THE AGENT
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/12-scoreboard-for-the-agent.html

All data is invented: customers, claims, policies, wording, the handlers'
answers, and the S$ price of each kind of mistake.


WHAT YOU BUILD
A scoreboard that Mr Goh can press a button on:
  - a held-out set of 10 claims, chosen once at random and saved, so you never
    tune the agent on the claims it is scored on
  - cost and working time recorded for every model call (time spent waiting
    for a human is left out)
  - one function that turns a run into every number: agreement, the three
    kinds of mistake, mistake cost in S$, straight-through rate, kappa, cost
    and seconds per claim
  - every run saved as its own file in runs/, named by the time
  - one evaluation at a time (a second start is refused with HTTP 409)
  - two web routes: POST /evaluations to start, GET /evaluations to list
  - a comparison of two runs that says better / same / WORSE for each number


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    scoreboard.py           this project: held-out set, run, score, save, compare
    app.py                  the two Flask routes
    compare_runs.py         added: compares the two newest saved runs
    scoring.py              added: the maths from the "right and wrong answers"
                            lesson, copied so this project runs alone
    bench.py                added: the helpers from the model-picking lessons
                            (prompts, gateway client, ask()), copied
    fake_model.py           added: rule-based stand-in for DRY_RUN=1
    data/                   claims, policies, wording and wording sections
    answer_key/handler_decisions.json
    (created when you run: data/held_out_ids.json and runs/)
  starter/                  same layout; scoreboard.py and app.py have TODO stubs
                            (scoring.py and bench.py are finished helpers)


REQUIREMENTS
  - Python 3.10 or newer
  - openai and flask (requirements.txt)
  - For real runs: a model gateway key. The code uses OpenRouter
    (GATEWAY_API_KEY). Check that the model name in scoreboard.py exists on
    your gateway. Not needed for DRY_RUN=1.


INSTALL
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
       cp env.example .env                then put your key in .env
       set -a; source .env; set +a        (PowerShell: $env:GATEWAY_API_KEY="...")
  Never commit .env or paste a real key into a file you share.


RUN
       cd final
       python scoring.py                           the practice grids from the earlier lesson
       DRY_RUN=1 flask --app app run --port 5000   start the service (no key)
  In a second terminal:
       curl -X POST localhost:5000/evaluations -H "Content-Type: application/json" -d '{"label":"baseline"}'
       curl -X POST localhost:5000/evaluations -H "Content-Type: application/json" -d '{"label":"second try"}'
       curl localhost:5000/evaluations
       DRY_RUN=1 python compare_runs.py
  Leave DRY_RUN=1 off to use the real model. The request waits until the whole
  evaluation is finished.


TEST: WHAT SUCCESS LOOKS LIKE
  The POST answers 201 with a report like (dry run, numbers will differ with a
  real model):
       {"label": "baseline", "model": "openai/gpt-5.4-mini", "run": "2026...json",
        "scores": {"agreement": 0.7, "claims": 10, "kappa": 0.45,
                   "mistake_cost_sgd": 1200, "straight_through": 0.9, ...}}
  and you now have files in runs/. data/held_out_ids.json lists 10 ids and does
  not change when you run again. compare_runs.py prints one line per number:

       agreement                0.7000 ->     0.7000  same
       ...
       worse: nothing

  Failure and fix: start an evaluation, and while it runs POST again from
  another terminal. The second call answers 409
  {"error": "an evaluation is already running"}. That is the lock working.
  (In a dry run the evaluation is so quick you may need a real model, or add a
  time.sleep(5) inside run_claim, to see it.)

  Other failures:
    - "FileNotFoundError: data/claims.json": run from inside final/.
    - compare_runs.py says "need two saved runs first": start two evaluations.
    - A real run fails with a model-not-found error: fix the model name for
      your gateway.


COST NOTE (approximate)
  One evaluation is 10 model calls of about 225 tokens in and 60 to 100 out.
  With a mini model that is a fraction of a US cent. The scoreboard prints the
  exact cost per claim from the token counts, using invented prices in
  bench.py: copy your gateway's real prices. DRY_RUN=1 costs nothing.


CLEAN UP
  Stop the Flask server with Ctrl+C.
       rm -rf final/runs final/data/held_out_ids.json
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +


WHAT CHANGED SINCE THE PREVIOUS LESSON
  Earlier lessons scored a run once in a script. Now scoring is a service: a
  fixed held-out set, a saved report per run, a lock so only one runs at a
  time, and a comparison you run after every change so a regression shows up
  the same day. The scoring maths is unchanged.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- data/held_out_ids.json lists 10 claim ids and stays the same on every run.
- POST /evaluations answers 201 with agreement, mistake_cost_sgd, straight_through, kappa, and cost and seconds per claim.
- Every run is its own file in runs/, and GET /evaluations lists them.
- A second POST while one runs answers 409 'an evaluation is already running'.
- compare_runs.py prints better, same or WORSE for each number.

Compare your work with final/ afterwards, starting with scoring.py, scoreboard.py and compare_runs.py.

验收标准（中文）
- data/held_out_ids.json 列出 10 个理赔编号，每次运行都不变。
- POST /evaluations 返回 201，含 agreement、mistake_cost_sgd、straight_through、kappa，以及每个理赔的成本和秒数。
- 每次运行各有一个 runs/ 文件，GET /evaluations 把它们列出来。
- 运行期间再次 POST 返回 409 “an evaluation is already running”。
- compare_runs.py 对每个数字打印 better、same 或 WORSE。
