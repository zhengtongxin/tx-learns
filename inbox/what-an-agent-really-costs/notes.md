# What an agent really costs, and what can go wrong (notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-leader/08-what-an-agent-really-costs.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'08-what-an-agent-really-costs.html' to that item only (it is the item whose title matches: "What an agent really costs, and what can go wrong").

Topic: Making the call with the tech team. Track story: STORY.md (Sri Murni Mart; end with the "Back at the mart" callout). This track has no code: use no code box; teach with a small diagram plus a decision widget (TX2.predict or TX2.game). Keep the lesson short, about 6 to 8 minutes.

## Goal
Cost an agent properly and name its risks before you approve it.

## Points
1. Cost has five parts: model usage (each step is a paid call, and agents take many steps), tools and data access, build time, checking time by people, and running and monitoring.
2. Cost per task is the number to ask for: average and worst case. A loop that retries can turn a few sen into several ringgit.
3. Risks: it loops or wanders; it takes a wrong action (sends the wrong email, changes the wrong record); it is tricked by hostile text in a document; it leaks data; nobody notices it quietly getting worse.
4. Controls: a step limit and a spending limit per task, read-only access first, human approval before anything that cannot be undone, logs you can read, and a regular test set.
5. Compare against the person: what does the same task cost by hand, including mistakes?

## What I got wrong (common slip-ups; tell them through Puan Rohani or Mr Tan)
- Costing only the model price.
- Giving the agent write access on day one.
- No cap per task, then a surprise bill.

## Try it yourself
For one idea write cost per task (best, typical, worst), the single worst action it could take, and the control that stops it.

## Takeaways
Cost it per task including checking time, cap the steps and spend, and keep a human on anything irreversible.

Written originally for this site; do not copy any outside slides, lecture or text.
