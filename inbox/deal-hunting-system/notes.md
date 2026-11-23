# Project: a deal-hunting system (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/27-deal-hunting-system.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'27-deal-hunting-system.html' to that item only.

Topic: A working agent system. Planned item: "Project: a deal-hunting system" (project, tag "A working agent system · Project"). ~40 min, hands-on. The finale.

## Goal
A screen that, while I sleep, finds second-hand gadget deals priced well below their estimated value and pings my phone.

## Pieces to assemble
- Tuned price model behind a serverless endpoint.
- RAG pricer over a vector store of known items.
- Ensemble of estimators.
- Scanner for fresh deals, structured outputs.
- Notifier (push message).
- Planner that runs the loop; memory file of past deals.
- A framework class that creates each agent once, holds the memory, and exposes `run()`, which returns new opportunities.

## The screen (Gradio Blocks)
Top row: a title. A table of opportunities seen so far (description, price, estimate, discount, link); selecting a row shows more. A live log panel streaming each agent's messages in its own colour. A timer that triggers `run()` every few minutes. A 3D plot of the vector store with the current items highlighted (nice to see, optional).
Pieces built one at a time: first the static table, then the timer, then the log queue, then the plot.

## Running it
Reset the memory to a couple of old deals, start the app, and watch deals appear. Keep an eye on API spend: the scanner and planner use models on every run, so choose cheap ones and a sensible timer.

## What I got wrong
Logs from several agent threads interleaved; used a queue to hand log lines safely to the UI. Also forgot that the first run is slow (cold start).

## Try it yourself
1. Change the notification threshold and see how many alerts you get.
2. Swap one agent for a different implementation behind the same method name.
3. Add a "reject" button that stores deals to ignore.

## Takeaways
A system is many small agents plus memory plus a loop plus a screen. Build and test each piece alone first. Mind cost and cold starts. This is where the lessons of the track meet.
