# Project: a scoreboard for the agent (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/12-scoreboard-for-the-agent.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'12-scoreboard-for-the-agent.html' to that item only.

Topic: Measuring an agent. Planned item: "Project: a scoreboard for the agent" (tag "Measuring an agent · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Give the handlers a scoreboard: how often the agent agrees with them, what a claim costs and how long it takes.

## Build order
1. Hold out a set of claims the agent has never seen, with the handlers' decisions.
2. Start an evaluation from the dashboard: it runs the agent on those claims and scores them.
3. Show agreement, the mistake types with their prices, straight-through rate, kappa, cost per claim and time per claim.
4. Record tokens and cost for every model call, and the working time per claim, leaving out waits for a human.
5. Keep each run's results so I can compare this run's agent with an earlier run's.
6. Only one evaluation can run at a time; a second start is refused.

## Typical outcome pattern
Once a scoreboard exists, arguments about whether the agent is better become numbers. It also shows regressions the same day they are introduced.

## What I got wrong
My first scoreboard counted time spent waiting for a handler's sign-off as agent time, which made the agent look slow. Leave human waits out.

## Try it yourself
1. Add a column for how sure the agent says it is.
2. Break results down by claim type.
3. Set a target for each number and colour it when missed.

## Takeaways
Measure agreement, cost and time together. Keep a held-out set. Keep every run so you can compare. Leave human waiting time out of agent time.
