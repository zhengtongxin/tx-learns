# Project: a swarm with a cap (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/18-swarm-with-a-cap.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'18-swarm-with-a-cap.html' to that item only.

Topic: Pausing and working in parallel. Planned item: "Project: a swarm with a cap" (tag "Pausing and working in parallel · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Start a dispatch from the dashboard, choose how many agents work at once, and see each claim's progress.

## Build order
1. Queue page: pick N from 1 to 25 (default 3) and start a dispatch.
2. Only one dispatch or evaluation at a time; a second start is refused.
3. A run panel lists each claim and where it stands.
4. A finishing summary from records: approved, declined, referred, payouts waiting for sign-off, claims left for a handler.
5. If the agent's service is not running, the start button says so.
6. Record cost and time for every claim against the run it happened in.

## Typical outcome pattern
With a cap, a busy morning clears in minutes and the handlers see exactly what is waiting for them. Handlers use the summary, not the traces.

## What I got wrong
The summary first came from a model and occasionally disagreed with the records. Building it from records fixed that.

## Try it yourself
1. Compare three cap settings on the same queue.
2. Stop a dispatch halfway and restart it.
3. Add an 'oldest first' versus 'biggest first' option.

## Takeaways
A cap is a safety feature. Summaries should come from records, not a model. One run at a time keeps results clean.
