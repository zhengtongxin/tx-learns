# Swarms of agents in parallel (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/17-swarms-of-agents-in-parallel.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'17-swarms-of-agents-in-parallel.html' to that item only.

Topic: Pausing and working in parallel. Planned item: "Swarms of agents in parallel" (tag "Pausing and working in parallel · Lesson 17"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Work many claims at once with a dispatcher, a cap on how many agents run together, and retries.

## Build order
1. A dispatcher with no model: plain code that lists claims and fans out work.
2. Test the dispatcher with stand-in agents first.
3. Keep the dispatcher's state: which claims are running, done, failed.
4. Cap the swarm: N agents at once (1 to 25).
5. Retries: a rate limit or timeout waits and continues as the same attempt; any other failure goes back once; failing twice leaves it for a handler.
6. Time: a queue of 25 that took over ten minutes in sequence finishes in about the time of the slowest claim.

## Typical outcome pattern
Parallel work cuts time a lot and leaves cost per claim unchanged. The limits you hit first are provider rate limits, not your code.

## What I got wrong
I fanned out 25 at once and hit rate limits straight away. A cap and a wait-and-retry rule fixed it.

## Try it yourself
1. Run with 3, then 10, then 25 and note the time and any limit errors.
2. Make one claim fail on purpose.
3. Show a dispatch summary built from records, with no model writing it.

## Takeaways
Use plain code for dispatch. Cap concurrency. Retry waits are the same attempt. One bad claim never stops the rest.
