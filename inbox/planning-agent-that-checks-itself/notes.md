# Project: a planning agent that checks itself (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/25-planning-agent-that-checks-itself.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'25-planning-agent-that-checks-itself.html' to that item only.

Topic: Agents as a managed service. Planned item: "Project: a planning agent that checks itself" (project, tag "Agents as a managed service · Project"). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Finish with an agent in the cloud that plans, solves, then proves its answer by running code in a safe sandbox.

## Steps
1. Start from the planner with its to-do tools.
2. Add a managed code-interpreter tool: a function that sends Python code to the sandbox and reads the streamed result back.
3. Update the prompt: solve without code first, then add a to-do starting with "Write Python code to..." and run it to check the answer.
4. Colour coding tasks in the printed list so they stand out.
5. Relaunch, invoke with a puzzle, read the plan, the answer and the check.
6. Turn on observability and read the trace: which tool, how long, how many tokens.
7. Delete the agent and its resources when finished.

## What I got wrong
- Sandbox region did not match the agent's.
- The agent skipped the check; the prompt must make it a required to-do.
- Trace was empty until observability was enabled in the console first.

## Try it yourself
1. Ask it something where the first answer is wrong and see if the check catches it.
2. Find the slowest step in the trace.
3. Compare cost with and without the code check.

## Takeaways
Verification beats confidence. Plan, act, check, and keep a trace so you can see how it decided.
