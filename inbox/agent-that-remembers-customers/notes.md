# Project: an agent that remembers customers (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/15-agent-that-remembers-customers.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'15-agent-that-remembers-customers.html' to that item only.

Topic: Knowledge and memory. Planned item: "Project: an agent that remembers customers" (tag "Knowledge and memory · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Build a returning-customer flow: the agent keeps notes on each customer and uses them on the next claim.

## Build order
1. A memory store keyed by customer, kept apart from the main database. The database stays the system of record.
2. After each claim the agent writes a short note on what the memory should keep.
3. Before a claim it reads that customer's notes.
4. A fresh queue: process a customer's first claim, then a second one, and watch what the second run does differently.
5. Show the notes on the claim page so a handler can see what the agent used.
6. Decide who owns each source: database (system of record), memory (agent's own notes), shared reference data (read only).

## Typical outcome pattern
The second claim for a returning customer is faster and better explained. The three sources have three different owners and three different rules, which is the real lesson.

## What I got wrong
I let the agent write to reference data once. Read-only really means read-only; enforce it with permissions, not instructions.

## Try it yourself
1. Add a note about a preference and test if it is used.
2. Show the handler which notes were read.
3. Add a 'forget this customer' action.

## Takeaways
Three sources, three owners: records, memory, reference data. Show handlers what memory was used. Enforce read-only with permissions.
