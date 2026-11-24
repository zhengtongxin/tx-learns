PROJECT: AN IMPROVER A HUMAN APPROVES
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/20-improver-a-human-approves.html

All data is invented: claims, policies, wording and the handlers' answers.


WHAT YOU BUILD
A small system where a model proposes changes to the claims agent and a person
stays in charge:
  - the agent's configuration (extra instructions, model, reasoning effort) as
    numbered versions that are never edited; each records what changed, why,
    who proposed it and who approved it
  - an improver that follows a written recipe, sees only the practice claims
    (never the held-out ones), and must change exactly ONE of the three fields
  - one round open at a time
  - a person approves or rejects. Rejecting changes nothing.
  - after approval, CODE (not the improver) runs the held-out claims and keeps
    the version only if it is no worse on both numbers and better on one;
    otherwise it is rolled back, which just means the agent stays on the old one
  - the recipe's last step lets the improver suggest a better recipe, but a
    suggestion is stored as pending until a person approves, and code refuses a
    recipe that drops the words "wait for a person"
  - a Configuration page and routes to approve, reject and put an older kept
    version back in use


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    versions.py             numbered versions (Step 1)
    improver.py             recipe, propose, approve, reject, evaluate, keep or
                            roll back, recipe edits (Steps 2 to 5)
    config_app.py           the Flask page and routes (Step 6)
    recipe_cli.py           added: a way to call the recipe-edit functions
    scoreboard.py           added: just the held-out set from the scoreboard project
    scoring.py              added: the scoring maths, copied
    bench.py                added: prompts, gateway client and ask(), copied
    fake_model.py           added: rule-based stand-in for DRY_RUN=1
    data/                   claims, policies, wording and wording sections
    answer_key/handler_decisions.json
    (created when you run: versions.json, data/held_out_ids.json,
     recipe.txt, recipe_edits.json)
  starter/                  same layout; versions.py, improver.py and
                            config_app.py have TODO stubs


REQUIREMENTS
  - Python 3.10 or newer
  - openai and flask (requirements.txt)
  - For real runs: a model gateway key (OpenRouter, GATEWAY_API_KEY). The model
    names and the "reasoning effort" setting must be ones your gateway
    understands: check the gateway's docs for the effort option's name.
    Not needed for DRY_RUN=1.


INSTALL
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
       cp env.example .env                then put your key in .env
       set -a; source .env; set +a        (PowerShell: $env:GATEWAY_API_KEY="...")
  Never commit .env or paste a real key into a file you share.


RUN
       cd final
       DRY_RUN=1 flask --app config_app run --port 5001
  In a second terminal:
       curl localhost:5001/configuration                      the table (open it in a browser too)
       curl -X POST localhost:5001/rounds                     the improver proposes version 2
       curl -X POST localhost:5001/versions/2/approve -H "Content-Type: application/json" -d '{"handler":"Aisha"}'
       curl -X POST localhost:5001/versions/2/use -H "Content-Type: application/json" -d '{"handler":"Aisha"}'
       DRY_RUN=1 python recipe_cli.py suggest 2               after a round
  Leave DRY_RUN=1 off to use real models. The approve call waits for the whole
  held-out evaluation.


TEST: WHAT SUCCESS LOOKS LIKE
  1. POST /rounds answers 201 {"version": 2}. The Configuration page shows
     version 2 as "proposed", one field changed, proposed by "improver",
     approved by nobody. The agent still runs version 1 (marked with an arrow).
  2. POST /rounds again answers 409 {"error": "a round is already open"}.
  3. Approve version 2. The answer is {"result": "kept"} or
     {"result": "rolled_back"}, and the page now shows both versions' scores.
     In a dry run every version gives the same answers, so nothing is better
     and the result is rolled_back: the rule "keep only if no worse AND better
     on one" working as designed. With real models a good change is kept.
  4. POST /versions/2/use on a rolled-back version answers 400 "only a kept
     version can be put back in use".
  5. Reject a proposal: {"result": "rejected"} and nothing else changes.

  Failures and their fixes:
    - "a round is already open": approve or reject the open proposal first.
    - ValueError "this version is not waiting for approval": you approved or
      rejected it already.
    - ValueError "a recipe must keep its step that waits for a person": the
      leash check refused a recipe edit. Edit the suggestion by hand, or
      reject it.
    - A real run fails on the effort setting: your gateway names it
      differently. Change extra_body in run_config.


COST NOTE (approximate)
  A round is about 15 practice-claim calls plus one improver call; approving
  adds about 20 held-out calls (the active version is scored once, then the new
  one). That is around 40 small calls and one larger one, roughly US$0.05 to
  US$0.30 depending on the models. Approximate: check your gateway's prices.
  DRY_RUN=1 costs nothing.


CLEAN UP
  Stop the Flask server with Ctrl+C.
       rm -f final/versions.json final/recipe.txt final/recipe_edits.json
       rm -f final/data/held_out_ids.json
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The scoreboard measured one agent. Now a second model changes the agent, but
  only through numbered versions, one change at a time, on practice claims, with
  a named person's approval, and code (not the improver) decides on the
  held-out claims whether the change stays. The scoreboard's held-out set and
  scoring maths are reused.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- POST /rounds answers 201 {"version": 2}; version 2 shows as 'proposed', one field changed, approved by nobody, and the agent still runs version 1.
- A second POST /rounds while one is open answers 409 'a round is already open'.
- After a named person approves, code runs the held-out claims and the result is kept or rolled_back.
- A version is kept only if it is no worse and better on at least one number.
- POST /versions/2/use on a rolled-back version answers 400; rejecting changes nothing else.

Compare your work with final/ afterwards, starting with improver.py, versions.py and config_app.py.

验收标准（中文）
- POST /rounds 返回 201 {"version": 2}；版本 2 显示为 “proposed”，改了一个字段，无人批准，智能体仍运行版本 1。
- 已有一轮未结束时再 POST /rounds，返回 409 “a round is already open”。
- 指定的人批准后，代码在留出的理赔上运行，结果为 kept 或 rolled_back。
- 一个版本只有在不更差且至少一个数字更好时才被保留。
- 对已回滚的版本调用 POST /versions/2/use 返回 400；拒绝则其余一切不变。
