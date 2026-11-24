PROJECT: THE HANDOVER COPILOT
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/25-the-handover-copilot.html

All data is invented: 25 sample claims, the two demo handlers, the context files
and the pilot notes. The demo sign-in tokens are fake and only for this exercise.


WHAT YOU BUILD
A chat copilot in the sidebar of the claims dashboard:
  - copilot.js: a collapsible sidebar on every page; the browser remembers
    whether it was open; answers are shown as text, never as HTML
  - it acts AS THE HANDLER WHO ASKED: every call carries that handler's own
    sign-in token, so it can do what that person can do and no more. A junior
    handler limited to S$800 cannot get a S$1,200 payment through their copilot.
  - five tools (look up a claim, read a context file, start the agent's work,
    send a decision back, pay a claim) plus a sixth for the handover. Looking
    things up just runs. Paying ASKS first: only the handler's own click on a
    Confirm button runs it, through a separate route the model cannot call.
  - every tool call is saved as a step the handler can read; each handler's
    conversation is stored separately
  - success criteria agreed on day one, checked at the end. A criterion with
    no measurement is "not measured", never a pass.
  - a handover tool that answers questions from the pilot notes and criteria
  - a teardown check: what is still tagged project=kaya-pilot, and what the
    last week cost


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    copilot.js              the sidebar (Step 1)
    permissions.py          demo users, user_of(), allowed() (Step 2)
    copilot_tools.py        the five tools and run_tool() (Step 3)
    copilot_log.py          steps and per-handler history (Step 4)
    copilot_agent.py        the Agents SDK wiring and ask() (Steps 4 and 6)
    copilot_api.py          /copilot/ask, /confirm, /history, plus a demo page
    criteria.py             the success criteria and check() (Step 5)
    handover.py             handover facts and the teardown check (Step 6)
    measured.json           invented measurements for the criteria
    pilot_notes.txt         invented pilot notes (the lesson calls it .md)
    try_it.py               the lesson's small permission checks, no services
    mock_gateway.py         added: a stand-in for "the gateway from the earlier
                            lessons", so the copilot runs on its own
    context/                added: small governed context files for the stand-in
    data/claims.json        the 25 invented claims
    (created when you run: copilot.db)
  starter/                  same layout with TODO stubs (copilot.js too);
                            mock_gateway.py is already finished


REQUIREMENTS
  - Python 3.10 or newer
  - flask, requests and openai-agents (requirements.txt)
  - An OpenAI API key for the real copilot (the Agents SDK sends each question
    to a model). Not needed for DRY_RUN=1.
  - Optional, for the teardown check only: the AWS command line, signed in to
    the account that held the pilot. Swap in your cloud's equivalent.


INSTALL
       python3 -m venv .venv
       source .venv/bin/activate          (Windows: .venv\Scripts\activate)
       pip install -r requirements.txt
       cp env.example .env                then put your key in .env
       set -a; source .env; set +a        (PowerShell: $env:OPENAI_API_KEY="...")
  Never commit .env or paste a real key into a file you share.


RUN
       cd final
       python try_it.py                   permission checks, no services
       python criteria.py                 the success criteria
  Then, in two terminals (both inside final/):
       flask --app mock_gateway run --port 5001          the stand-in gateway
       DRY_RUN=1 flask --app copilot_api run --port 5000 the copilot (no model)
  Open http://127.0.0.1:5000 , press "Sign in as Aisha", and ask:
       look up C007
       pay C007 300        then press the Confirm button
  Leave DRY_RUN=1 off to use the real model (needs OPENAI_API_KEY); then you
  can ask in plain English.


TEST: WHAT SUCCESS LOOKS LIKE
  try_it.py prints:
       False
       True
       {'as': 'Aisha', 'path': '/claims/C007'}
       {'confirm': 'Pay S$300 on C007?', 'args': {'claim_id': 'C007', 'amount': 300}}
       {'refused': 'You are not allowed to do that, so the copilot cannot either.'}

  In the browser:
    1. "look up C007" shows the claim record, with a Steps line below it.
    2. "pay C007 300" does NOT pay. It shows a Confirm button. Press it and the
       button turns into {"status": 200, ...}. Check curl localhost:5001/payments
       with the header  Authorization: Bearer demo-token-aisha  to see the payment.
    3. Sign in as the Junior handler and ask "pay C008 1200": refused, no Confirm
       button appears. Even a hand-made POST to /copilot/confirm is refused,
       and the stand-in gateway would refuse it too (both check).
    4. Aisha's questions never appear in the junior handler's history.

  python criteria.py prints "met", "met", "not measured": the third line is
  deliberate, because only two of the three numbers were supplied. With the
  full measured.json, handover_facts() reports all three.

  Failures and their fixes:
    - "sign in first" (401): press a Sign in button, or the token is wrong.
    - "ConnectionError" in the copilot's step log: the stand-in gateway is not
      running on port 5001 (or GATEWAY_URL points elsewhere).
    - A real run says the model needs a key: set OPENAI_API_KEY.
    - handover.py (run directly) fails with "No such file: aws": install the AWS
      command line, or ignore the teardown check if you have no cloud account.


COST NOTE (approximate)
  Each question to the real copilot is one to a few small model calls, a few
  cents per hundred questions. DRY_RUN=1 costs nothing. The teardown check reads
  your cloud bill and tags; it creates nothing. This project itself starts no
  cloud resources. If you deployed the earlier pilot to the cloud, its running
  cost is the number to watch.


CLEAN UP
  Stop both Flask servers with Ctrl+C.
       rm -f final/copilot.db
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +
  Tearing down real cloud resources is a person's job: handlers cannot delete
  them, so the copilot cannot either. Run your infrastructure tool's destroy
  command (for example terraform destroy), then run  python handover.py  to see
  what is left and what it cost. Tag everything project=kaya-pilot from the
  first day so the leftover search can find it.


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The earlier lessons built the pieces: records, keys and policy, the context
  layer, a managed runtime. This project puts a copilot on top of them: it
  borrows each handler's permissions, asks before it pays, shows every step,
  and ends with a handover check and a teardown. mock_gateway.py stands in for
  the earlier lessons' gateway so you can run it without them.
