# Agents that scan, estimate and decide (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/26-agents-that-scan-estimate-decide.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'26-agents-that-scan-estimate-decide.html' to that item only.

Topic: A working agent system. Planned item: "Agents that scan, estimate and decide". Concept lesson, ~25 min.

## The cast (each is a small class with one job)
1. Specialist: calls my tuned model on the serverless GPU.
2. Frontier agent: RAG. Embed the item with a small sentence model (384-dim), fetch the five most similar items with known prices from a Chroma store (hundreds of thousands of vectors), and show them in the prompt as "similar items and what they cost", then ask a big model for the price.
3. Neural-network agent: the small trained network from the earlier lesson, as a third opinion.
4. Ensemble agent: combines the three estimates with a weighted average (weights chosen by fitting on a validation set). Several imperfect opinions beat one.
5. Scanner agent: pulls a feed of current deals from the web, then asks a model to pick the five best-described deals and return them in a strict structured schema (description, price, url) via structured outputs.
6. Messenger agent: sends me a push notification (a phone-notification service with a user key and an app token) when a deal looks good, with a short, model-written message.
7. Planning agent: the coordinator.

## The planner two ways
- Fixed workflow: scan, then for each deal ask the ensemble, then if (estimate − deal price) is larger than a threshold, notify.
- Autonomous: give the planner a model and three tools (scan for bargains, estimate true value, notify user) with JSON descriptions and let it decide the order. I first tried it with fake tool functions that return canned data, to see the tool-calling loop work before wiring real agents.

## Memory and logging
Deals already notified are stored in a JSON file so the same one isn't sent twice. Each agent logs with its own colour so I can watch the flow.

## What I got wrong
Gave the autonomous planner too much freedom and it re-scanned in a loop. A cap on steps and a clear instruction fixed it.

## Try it yourself
1. Build the ensemble by averaging two predictors and see if it beats each.
2. Write the three fake tools and the loop.
3. Add a "seen deals" file.

## Takeaways
Agents are small, single-purpose classes that call models or tools. Combine opinions. Choose fixed workflow or autonomy on purpose. Add memory and logs.
