PROJECT: A CLAIMS DESK PILOT
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/03-claims-desk-pilot.html

All data in this package is invented: the customers, claims, policies and the
policy wording. Nothing here is real.


WHAT YOU BUILD
A first pilot that Aisha and Mr Goh can react to:
  - 25 invented travel claims, their policies and a plain policy wording
  - a small backend queue where every claim has exactly one state
    (waiting, in_progress, waiting_signoff, decided)
  - a hard rule in the backend: any approval over S$800, and every "refer",
    waits for a handler
  - an agent that reads one claim and returns approve / decline / refer,
    a payout and a short reason
  - a score that compares the agent with what the handlers decided


FOLDER STRUCTURE
  README.txt
  requirements.txt          the one package you need
  env.example               copy to .env (see Install)
  final/                    the complete working version
    desk_queue.py           the queue and the sign-off rule (Steps 2 to 4)
    agent.py                the agent that reads one claim (Step 5)
    run_pilot.py            runs the queue and scores it (Step 6)
    fake_model.py           added: a stand-in for the model, for DRY_RUN=1
    data/                   the agent may read this
      claims.json           25 invented claims
      policies.json         policy id -> cover, limits and excess
      policy_wording.txt    the plain wording of the cover
    answer_key/             the agent must NEVER read this
      handler_decisions.json    {claim id: what the handler decided}
  starter/                  the same layout with TODO stubs for you to fill in


REQUIREMENTS
  - Python 3.10 or newer
  - The openai package (see requirements.txt)
  - An OpenAI API key, only if you run against the real model.
    Without a key you can still run everything with DRY_RUN=1.


INSTALL
  1. Make a clean environment and install:
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
  2. Copy env.example to .env and put your key in it:
       cp env.example .env
     The scripts do not read .env by themselves. Load it into your shell:
       set -a; source .env; set +a        (Windows PowerShell: set each
                                           variable with $env:NAME="value")
     Never commit .env or paste a real key into any file you share.


RUN
  Work from inside final/ (or starter/) because the file paths are relative:
       cd final
       DRY_RUN=1 python run_pilot.py      no key, no cost, stand-in answers
       python run_pilot.py                the real model (needs the key)


TEST: WHAT SUCCESS LOOKS LIKE
  You see one line per claim, then a score. For example, in a dry run:

     C001  decided         approve  S$320  dry run: amount capped at the limit, less the excess
     ...
     C017  waiting_signoff approve  S$1700  dry run: ...
     C019  waiting_signoff refer    S$0  dry run: ...
     agrees with handlers on 18 of 25 claims

  Check these things:
    1. Every claim ends in exactly one state.
    2. Any approve over S$800 (C008, C009, C014, C017, C024 in the answer key)
       and every refer shows waiting_signoff, never decided.
    3. The score line appears at the end. A real model usually agrees on most
       claims and struggles on the ones that need the claims manual or the
       customer's history (C012, C013, C019, C025). The dry-run score only
       proves the plumbing works; it says nothing about a real model.

  Failures and their fixes:
    - "FileNotFoundError: data/claims.json" means you ran the script from the
      wrong folder. cd into final/ (or starter/) first.
    - "openai.OpenAIError" complaining about a missing api_key or credentials
      (the exact words depend on the version) means the key is not in your
      shell. Load .env as shown in Install, or use DRY_RUN=1.


COST NOTE (approximate)
  A full run is 25 model calls with the wording pasted into every prompt, so
  roughly 25 x 700 tokens in and 25 x 80 tokens out. At typical small-model
  prices that is a few US cents per run. Prices change: check your provider's
  price list. DRY_RUN=1 costs nothing.


CLEAN UP
  Nothing runs in the background and no cloud resources are created.
       deactivate                         leave the virtual environment
       rm -rf .venv .env                  remove what you made
       find . -name __pycache__ -exec rm -rf {} +


WHAT CHANGED SINCE THE PREVIOUS LESSON
  This is the first project of the track, so everything is new. The earlier
  lessons gave you the brief and a plan; here the plan becomes code:
  a queue with states, a rule enforced in code instead of in the prompt, one
  agent call per claim, and a score from an answer key the agent never sees.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- Running the pilot from final/ prints one line per claim (25 claims) and ends with 'agrees with handlers on N of M claims'.
- Every claim ends in exactly one state: waiting, in progress, waiting for sign-off or decided.
- Any approval over S$800 (C008, C009, C014, C017, C024) and every refer shows waiting_signoff, never decided.
- Only the scoring code opens the answer_key folder; the agent never does.
- The dry-run score proves the plumbing only; a real model struggles most on C012, C013, C019 and C025.

Compare your work with final/ afterwards, starting with: desk_queue.py, agent.py, run_pilot.py.

验收标准（中文）
- 在 final/ 里运行试点，每个理赔（共 25 个）打印一行，最后是 “agrees with handlers on N of M claims”。
- 每个理赔最后只处于一个状态：等待、处理中、等待签批或已决定。
- 任何超过 S$800 的批准（C008、C009、C014、C017、C024）和每个转交，都显示 waiting_signoff，绝不是 decided。
- 只有评分代码会打开 answer_key 文件夹，智能体从不打开。
- 试运行的分数只证明流程接通；真实模型在 C012、C013、C019 和 C025 上最吃力。
