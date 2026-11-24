PROJECT: AN AGENT THAT REMEMBERS CUSTOMERS
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/15-agent-that-remembers-customers.html

All data is invented: the customer (Mr Tan, K-0412), his two claims and the
policy. The memory starts empty; the agent writes it as it goes.


WHAT YOU BUILD
An agent with a memory, and the discipline around it:
  - three separate stores, each a small SQLite file:
      claims.db      records: what was decided and paid (the handlers own it)
      memory.db      notes: the agent's own facts, keyed by customer (deletable)
      reference.db   policy data: the agent may only READ it
  - after each claim the model writes at most two factual notes, stored with
    the claim they came from and the date
  - before each claim the agent reads that customer's notes (as leads to check,
    not proof) and says in its reason when a note helped
  - the notes it read are saved next to the decision, so a handler can see them
  - the reference store is opened read-only, so even a bug cannot write to it


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    make_reference.py       run once by a person: creates reference.db
    desk.py                 the agent's side: stores, notes, decide, process, show
    reset.py                added: deletes claims.db and memory.db for a fresh queue
    (created when you run: reference.db, claims.db, memory.db)
  starter/                  same layout; desk.py has TODO stubs


REQUIREMENTS
  - Python 3.10 or newer (sqlite3 is built in)
  - The openai package (requirements.txt)
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
       python make_reference.py           once, first: makes reference.db
       python reset.py                    fresh claims.db and memory.db
       DRY_RUN=1 python desk.py           no key, no cost, stand-in answers
       python desk.py                     the real model


TEST: WHAT SUCCESS LOOKS LIKE
  desk.py processes claim C041 (a lost bag) and then C042 (the same customer
  loses a bag again). A dry run prints:

       {'action': 'approve', 'payout': 420, 'reason': 'dry run: paid the amount claimed, up to the limit.'}
       {'action': 'approve', 'payout': 380, 'reason': 'dry run: a note from an earlier claim was used (1 note read).'}
       C042  approve  S$380.0
         why: ...
         notes the agent read:
          - Claim C041: receipts were attached (dry run note). (claim C041, saved 2026-...)
       blocked: attempt to write a readonly database

  Check: the second claim read a note written by the first; the last line
  proves the agent cannot change the reference data. With the real model the
  wording of notes and reasons will differ, and the second reason should say
  that a note helped.

  Failures and their fixes:
    - "reference.db is missing: run python make_reference.py first": do that.
    - The second claim read no notes: you ran reset.py between the two claims,
      or the customer ids differ. Notes are keyed by customer id.
    - Old notes make the next demo confusing: run python reset.py first.


COST NOTE (approximate)
  Each claim is two small model calls (decide, then write notes): four calls
  for the demo, well under one US cent with a mini model. Approximate: check
  your provider's prices. DRY_RUN=1 costs nothing.


CLEAN UP
  Nothing runs in the background and no cloud resources are created.
       rm -f final/claims.db final/memory.db final/reference.db
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +
  memory.db is the agent's own notes: deleting it loses only the agent's
  memory, never the records.


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The earlier lesson gave the agent a memory over MCP, in a JSON file. Here
  memory is one of three clearly owned stores in SQLite: records, memory and
  read-only reference data. Notes are written by the code after each claim,
  read before the next one, shown to the handler, and the read-only store is
  enforced by permissions instead of by an instruction.
