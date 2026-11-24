PROJECT: THE CHEAPEST MODEL THAT IS GOOD ENOUGH
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/06-cheapest-model-good-enough.html

All data in this package is invented: customers, claims, policies, wording and
the handlers' answers. The prices in the code are invented too.


WHAT YOU BUILD
A fair contest between models, with the pass mark written down first:
  - a "bar" in numbers: accuracy on easy claims, no wrongly approved big
    payouts, and a speed limit
  - every candidate model runs the same 25 claims twice with the same short prompt
  - one table row per model: accuracy by difficulty, cost per 1,000 claims,
    seconds per claim, wrong big approvals
  - a model must pass EVERY line of the bar; the cheapest that does wins
  - a router that asks the cheap model first and only asks a strong model
    when the cheap one says "refer"
  - a half-page memo for Mr Goh with the numbers filled in


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    bench.py                helpers from the two earlier lessons, in one file
                            (prompts, gateway client, ask(), matches())
    choose_model.py         this project: the bar, the table, the pick, the memo
    fake_model.py           added: rule-based stand-in for DRY_RUN=1
    data/
      claims.json           25 invented claims
      policies.json         policy id -> limits and excess
      policy_wording.txt    the plain wording
      wording_sections.json the wording cut into sections (for the short prompt)
    answer_key/
      handler_decisions.json    action, payout, difficulty and reason per claim
  starter/                  same layout with TODO stubs


REQUIREMENTS
  - Python 3.10 or newer
  - The openai package (requirements.txt). It talks to a model gateway.
  - For the real contest: a gateway account and key. The code uses OpenRouter
    (GATEWAY_API_KEY). Any gateway that copies the OpenAI-style API works if
    you change base_url in bench.py. Model names must exist on your gateway:
    check its model list and edit CANDIDATES if a name is not found.
  - No key is needed for DRY_RUN=1.


INSTALL
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
       cp env.example .env                then put your key in .env
       set -a; source .env; set +a        load it into this shell
                                          (PowerShell: $env:GATEWAY_API_KEY="...")
  Never commit .env or paste a real key into a file you share.


RUN
       cd final
       python bench.py                    checks the data and prompt sizes, no model call
       DRY_RUN=1 python choose_model.py   plumbing test, no key, no cost
       python choose_model.py             the real contest (needs the key)


TEST: WHAT SUCCESS LOOKS LIKE
  bench.py prints two lines, for example:
       full 377 tokens, small 225 tokens, saved 40%
       approving everything scores 56%

  choose_model.py prints a table and then the memo. In a dry run every model
  gives the same stand-in answers, so the table looks like this:

       model                                   easy  cost/1000  secs big wrong
       meta-llama/llama-3.3-70b-instruct        91%       0.04   0.0         0  clears the bar
       openai/gpt-5.4-mini                      91%       0.19   0.0         0  clears the bar
       ...
       Our pick: meta-llama/llama-3.3-70b-instruct. ...

  Check: costs rise down the table, the cheapest model that clears the bar is
  picked, and the memo mentions the fallback. With real models the accuracy,
  seconds and costs will differ, and some models will fail a line of the bar.
  That is the point of the table.

  Failures and their fixes:
    - "nobody clears the bar: change the prompt, or talk to Mr Goh about the
      bar" is the program working as designed. Improve the prompt or add a
      stronger candidate. Do not lower the bar after seeing the scores.
    - openai.NotFoundError or "model not found": a name in CANDIDATES is not on
      your gateway. Copy the exact name from its model list.
    - "ValueError: substring not found": a model answered with no JSON at all.
      Run again, or drop that model from CANDIDATES.


COST NOTE (approximate)
  4 models x 25 claims x 2 runs = 200 calls, each about 225 tokens in and
  60 to 100 out. With the invented prices in the code that is well under
  US$0.10 in total; real prices differ, and the strong model costs most.
  Check your gateway's price list. DRY_RUN=1 costs nothing.


CLEAN UP
  Nothing runs in the background and no cloud resources are created.
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +
  If you made a gateway key just for this, revoke it in the gateway's dashboard.


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The two earlier lessons built bench.py a piece at a time. Here it is saved
  in one place, and the project adds: a bar agreed before the scores, two runs
  per model, a table, a rule that a model must pass every line, the cheapest
  pick with a stronger fallback, and the memo.
