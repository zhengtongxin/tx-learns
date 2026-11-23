# Tools and a planning loop (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/24-tools-and-a-planning-loop.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'24-tools-and-a-planning-loop.html' to that item only.

Topic: Agents as a managed service. Planned item: "Tools and a planning loop" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Give the deployed agent a tool, then a to-do list it uses to plan and tick off its own steps.

## Steps
1. A tool is a plain function with a decorator and a docstring; the docstring is what the model reads. First tool: a square root.
2. Pass tools when building the agent, relaunch, invoke with a prompt that needs the tool.
3. A planner agent: a typed to-do item (description, done flag), a list in memory, and tools to create items, mark one done, and print the list.
4. The system prompt: make a plan with the to-do tools, do each step, answer.
5. Print the list after each change so I can see the plan move.

## What I got wrong
- Vague docstring, so the model ignored the tool.
- Index off by one; ask for positions starting at 1 and say so in the tool text.
- State in a global list resets when the container restarts; fine for a demo, not for real work.

## Try it yourself
1. Add a tool that returns today's date.
2. Ask a task with four steps and read the plan.
3. Make mark-done refuse an index that does not exist.

## Takeaways
Tools are functions with good descriptions. A visible plan makes an agent easier to trust and to debug.
