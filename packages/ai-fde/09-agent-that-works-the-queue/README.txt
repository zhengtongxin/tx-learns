PROJECT: AN AGENT THAT WORKS THE QUEUE
Kaya Travel Cover, AI FDE track. Lesson file: ai-fde/09-agent-that-works-the-queue.html

All data is invented: customers, claims, policies and the claims manual.


WHAT YOU BUILD
One run that works the whole claims queue by itself:
  - the agent orders the claims first and writes a short summary at the end
    (your code checks the order: invented ids are dropped, forgotten ids added)
  - a to-do list saved to todo.json with four states:
    to_do, in_progress, done, for_handler (the queue page would read this file)
  - a fresh helper for every claim: it sees only that claim and reports back
    one line
  - a tool, read_manual, so the helper opens only the manual sections it needs,
    and the sections it read are logged
  - rules in code: a claim that fails goes back once, a second failure is left
    for a handler, no claim is decided twice, and a killed run can be restarted
  - options: --limit N and --claim ID, so trials are cheap


FOLDER STRUCTURE
  README.txt
  requirements.txt
  env.example               copy to .env (see Install)
  final/                    the complete working version
    run_queue.py            this project: all six steps
    desk_queue.py           the pilot's backend queue and sign-off rule, copied
                            here from the earlier project so this one runs alone
    fake_model.py           added: rule-based stand-in for DRY_RUN=1
    data/
      claims.json           25 invented claims
      policies.json         policy id -> limits and excess
      manual.json           the claims manual and wording, one entry per section title
  starter/                  same layout; run_queue.py has TODO stubs
                            (desk_queue.py is already finished, it is the pilot)


REQUIREMENTS
  - Python 3.10 or newer
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
       DRY_RUN=1 python run_queue.py --limit 5      no key, no cost
       python run_queue.py --limit 5                real model, 5 claims
       python run_queue.py --claim C013             debug one claim
       python run_queue.py                          all 25 claims

  todo.json remembers "done" across runs. For a fresh run, delete it first.


TEST: WHAT SUCCESS LOOKS LIKE
  A dry run of five claims, with one claim made to fail on purpose:

       DRY_RUN=1 python run_queue.py --limit 5 --break C003

  prints the to-do list and a summary line:

       to_do
       in_progress
       done         C001, C002, C004, C005
       for_handler  C003
       Dry run: 5 claims worked.

  Open todo.json: C003 has "tries": 2 and state for_handler, the others are
  done. Nothing is left in to_do or in_progress.

  Then run it again without --break. Finished claims are skipped and
  C003 stays for_handler (a person has to decide it).

  With the real model, look in todo.json at the "read" list of each claim.
  It shows which manual sections the helper opened. That is what Aisha asks
  first: "what did it base this on?"

  Failures and their fixes:
    - "KeyError: 'C999'" when you use --claim C999: that id is not in data/claims.json.
    - Re-running does nothing because every claim says done: delete todo.json.
    - "RuntimeError: helper read too many sections without answering": the
      model kept asking for sections. The run leaves that claim for a handler
      after two tries, as designed.


COST NOTE (approximate)
  Each claim is one fresh helper conversation of up to a few model calls, plus
  one call to order the queue and one for the summary. A full run is roughly
  25 to 100 calls, small prompts each, so around a few US cents with a mini
  model. Approximate: check your provider's prices. Use --limit 5 while building.


CLEAN UP
  Nothing runs in the background and no cloud resources are created.
       rm -f final/todo.json
       deactivate
       rm -rf .venv .env
       find . -name __pycache__ -exec rm -rf {} +


WHAT CHANGED SINCE THE PREVIOUS LESSON
  The pilot walked the queue in stored order, pasted the whole wording into
  every prompt and let one error leave a claim in_progress for ever. Now the
  agent orders the queue, a to-do list shows progress, each claim gets a fresh
  helper that looks things up by section, and failures are handled in code.
  desk_queue.py is unchanged from the pilot.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- DRY_RUN=1 python run_queue.py --limit 5 --break C003 prints the to-do list by state and ends 'Dry run: 5 claims worked.'
- done lists C001, C002, C004 and C005; for_handler lists C003.
- todo.json shows C003 with "tries": 2 and nothing left in to_do or in_progress.
- Running again without --break skips finished claims, and C003 stays for_handler.
- With a real model, each claim's "read" list shows which manual sections the helper opened.

Compare your work with final/ afterwards, starting with: desk_queue.py, run_queue.py, the retry rule.

验收标准（中文）
- DRY_RUN=1 python run_queue.py --limit 5 --break C003 按状态打印待办清单，并以 “Dry run: 5 claims worked.” 结束。
- done 列出 C001、C002、C004、C005；for_handler 列出 C003。
- todo.json 中 C003 的 "tries" 为 2，to_do 和 in_progress 里都没有剩余。
- 不加 --break 再运行，已完成的理赔被跳过，C003 仍留给人工处理。
- 用真实模型时，每个理赔的 "read" 列表显示助手打开了哪些手册章节。
