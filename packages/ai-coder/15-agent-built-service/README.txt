Agent-built service: package
============================
What this is: the planner for a small swarm. It turns a tasks.json (tasks, the
files each may touch, what each depends on) into waves of work that can run
together, and refuses a circular or unknown dependency before any agent starts.

Folders
  starter/   tasks.json, roles.txt, an empty plan.js and the test.
  final/     a finished plan.js and the same files.

What you need
  - Node.js 18 or newer (no install step).
  - For the real run: git, a terminal agent and a sandbox. Start with two
    workers and a low budget.

Offline check (no keys, no network)
  cd final
  node test_plan.js     prints one "ok:" line.
  Run it in starter/ first: it fails until the agent finishes.

Use it
  1. Write your own tasks.json and roles.txt for a small service.
  2. Get the planner passing, then run it on your tasks.
  3. Run one wave with real workers, test, review, merge, then look back.

The receipt tracker is only an example.
