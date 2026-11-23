# Project: an agent that works the queue (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/09-agent-that-works-the-queue.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'09-agent-that-works-the-queue.html' to that item only.

Topic: Harness engineering. Planned item: "Project: an agent that works the queue" (tag "Harness engineering · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Make one run work the whole queue on its own, with a to-do list in the dashboard, fresh helpers per claim and self-healing failures.

## Build order
1. One command starts a run; the agent picks the order itself and ends with a short summary for the handlers.
2. A cap option: run on five claims only, so trials cost little. Also keep the option to run one named claim.
3. The to-do list shows on the queue page: to do, in progress, done, left for a handler.
4. Each claim goes to a fresh helper that reports one line back: decision and payout, or what went wrong.
5. The manual and the wording are looked up by section, and the claim page shows what was read.
6. Failures: a claim that fails before it is decided goes back to the queue; failing twice leaves it for a handler; no claim is ever decided twice.

## Typical outcome pattern
A good run finishes the queue without anyone stepping in, and cost per claim stays flat instead of growing. The remaining mistakes are about judgment, which the next topic measures.

## What I got wrong
A claim failed partway and stayed 'in progress' forever, which silently blocked a later run. A rule that every claim ends in a clear state fixed it.

## Try it yourself
1. Kill the run halfway and see what state the queue is in.
2. Add a claim the agent cannot handle and watch it end up with a handler.
3. Compare cost per claim at 5 claims and at 25.

## Takeaways
Let the agent organise its own work with a visible to-do list. One fresh helper per unit of work. Every item must always end in a clear state.
