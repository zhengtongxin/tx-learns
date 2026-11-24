A PLANNING AGENT THAT CHECKS ITSELF (project package)
======================================================

WHAT YOU BUILD
--------------
A cloud agent for the wharf that:
  1. writes its plan as a to-do list (add_todo, mark_done, show_plan),
  2. solves the task itself first,
  3. then proves the answer by running a small Python program in a sealed
     sandbox (the managed code interpreter), never on your own machines,
  4. fixes the answer if the check disagrees, and
  5. leaves a trace you can read (what it did, how long, how many tokens).

The check is a REQUIRED to-do ("Write Python code to ..."), not a suggestion,
because an agent will skip a suggestion.

This needs a real cloud account with model access and a managed agent runtime.
It cannot run fully offline. The tools for the plan can be tried on your laptop
(see Test), and final/ is the reference for the rest.

FOLDER STRUCTURE
----------------
25-planning-agent-that-checks-itself/
  README.txt
  env.example                copy to .env
  final/
    agent.py                 the ONE entry-point file: plan tools, sandbox tool, checker agent
    requirements.txt
    examples/derangements.py the check the agent should write (answer: 9)
    scripts/cleanup-check.sh lists what to delete (it deletes nothing)
  starter/                   same layout with TODO stubs

REQUIREMENTS
------------
- Python 3.10 or newer, with venv
- AWS CLI v2, signed in as your limited daily user (not root), with permission
  for: the model service, the build service and the agent runtime
- Model access for ONE region (these files use ap-southeast-1) and the same
  region for everything: the agent, the sandbox and your CLI
- Observability switched on once in the agent runtime's console (before the run!)
- Packages (requirements.txt): bedrock-agentcore, strands-agents,
  bedrock-agentcore-starter-toolkit, pydantic
- No API keys: you sign in with the CLI. Nothing secret goes in files.

INSTALL
-------
     cd final        (or starter)
     python3 -m venv .venv && source .venv/bin/activate
     pip install -r requirements.txt
     cp ../env.example .env     (then:  set -a; source .env; set +a)

RUN
---
     agentcore configure -e agent.py --region ap-southeast-1
     agentcore launch       # container + registry + roles + running service (takes a few minutes)
     agentcore invoke '{"prompt": "How many ways can 4 crane operators swap shifts so nobody keeps their own?"}'
If you change agent.py, run  agentcore launch  again: the deployed copy does not
update by itself. Only one entry-point file is allowed per project.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
Offline, on your laptop (no cloud needed; this only tries the plan tools):
     python3 examples/derangements.py     -> prints 9, the correct answer
     python3 -c "import agent; print(agent.add_todo('Find the area')); print(agent.mark_done(1))"
  (set AWS_DEFAULT_REGION=ap-southeast-1 and any placeholder AWS keys first, so
   the agent object can be built; no call is made)
  expect  "1. [ ] Find the area"  then  "1. [x] Find the area"

In the cloud, after invoke, read three things in the output and the logs:
  - the plan: four or five steps, one of them in cyan starting "Write Python code"
  - the answer: 9
  - the check: the sandbox's printed result (9) agrees with the answer
In the trace you should see add_todo calls, a model step, run_python (usually
the slowest step, several seconds), mark_done calls and the final answer.

One failure and its fix:
 - Symptom: the first check fails with a region or "not found" error.
   Cause: the sandbox was created in a different region from the agent.
   Fix: use ONE region everywhere (REGION in agent.py comes from AWS_REGION;
   pass --region to agentcore configure).
 - Symptom: the agent never runs code. Cause: the prompt said "you may use code".
   Fix: make the check a required to-do that starts with "Write Python code".
 - Symptom: the trace is empty. Cause: observability was off. Switch it on in
   the console BEFORE the run, then run again.
 - Symptom: a model-access or "model not found" error. Cause: the default model
   is not enabled in your region. Fix: enable one in the console, then set MODEL_ID.

COST NOTE (approximate)
-----------------------
A few test runs cost cents (model tokens plus a few seconds of sandbox time).
The deployed agent and its image add small standing charges, and logs add up if
kept forever. Prices change: check your bill page a day later. A forgotten agent
is a small bill that nobody remembers approving, so clean up when you finish.

CLEAN UP
--------
 1. Write the list first (it is in the lesson), then run
      bash scripts/cleanup-check.sh      (lists; deletes nothing)
 2. Delete the deployed agent (console, or the toolkit's destroy command if your
    version has one: run  agentcore --help  to see).
 3. Delete its image in the registry, its roles, and its log groups (or set a
    short retention).
 4. Run cleanup-check.sh again and open the console: nothing should be left.
 5. Local: deactivate and delete .venv, and the .bedrock_agentcore.yaml file that
    "agentcore configure" wrote.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
Starts from the planner (to-do tools and the entry point). New: the run_python
tool that uses the managed code interpreter, show_plan colours the check line,
and the system prompt makes the check a required step. The planner's square_root
tool is dropped (this task does not need it). Added here and not in the lessons:
one REGION constant used for the agent and sandbox, an optional MODEL_ID,
clearing the plan at the start of each request, a clear message from mark_done
for a step that does not exist, and the cleanup-check script.
