# Project: a claims desk pilot (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/03-claims-desk-pilot.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'03-claims-desk-pilot.html' to that item only.

Topic: The FDE’s job. Planned item: "Project: a claims desk pilot" (tag "The FDE’s job · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Get a first working claims pilot: a small backend with 25 sample claims, a dashboard for the handlers, and an agent that approves, declines or refers each claim with a payout and a short reason.

## Build order
1. Make the sample data: 25 invented claims, their policies, customers, a plain policy wording and the handlers' own decisions kept aside in a separate folder the agent never sees.
2. Backend: a queue of claims with states waiting, in progress, waiting for sign-off, decided.
3. Dashboard page: the queue, each claim in full, the agent's reasons, and what the agent is doing step by step.
4. A hard rule in the backend: any payout over the sign-off limit (say S$800) must wait for a handler, even if the agent tries to pay.
5. The agent reads one claim, looks up the policy and the wording, and returns approve, decline or refer, a payout and two or three sentences of reasons.
6. Run it on the whole queue and compare with the handlers' decisions.

## Typical outcome pattern
A pilot like this agrees with the handlers on most claims but struggles on the ones that need the claims manual or the customer's history. That gap is the plan for everything that follows.

## What I got wrong
I let the agent see the handlers' answers once by mistake while debugging. The score looked great and meant nothing. Keep the answer key in a place the agent cannot read.

## Try it yourself
1. Add five claims of your own, including one tricky one.
2. Try the sign-off rule: make the agent approve a big payout and watch the backend refuse to pay.
3. Write what the agent got wrong and why.

## Takeaways
Build the smallest thing the customer can react to. Keep the answer key hidden from the agent. Enforce the sign-off rule in the backend, not in the prompt.
