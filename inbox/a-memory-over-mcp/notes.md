# A memory over MCP (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/14-a-memory-over-mcp.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'14-a-memory-over-mcp.html' to that item only.

Topic: Knowledge and memory. Planned item: "A memory over MCP" (tag "Knowledge and memory · Lesson 14"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Give the agent a long-term memory it reaches through an MCP server, so it can recall a customer's past claims and notes.

## Build order
1. Run a small memory server that exposes tools to save and look up notes.
2. Connect the agent to it over MCP.
3. Let the agent write down facts worth remembering: 'this customer filed two lost-bag claims, receipts always complete'.
4. On the next claim from the same customer, the agent looks the notes up first.
5. Teach the agent what is worth remembering and what is private or irrelevant.
6. Experiment: the payout tool alone, then the payout tool plus memory, compared on the same claims.

## Typical outcome pattern
Memory helps on repeat customers and on claims where history matters, and it does nothing on one-off claims. It also adds a new way to be wrong: an old note that is no longer true.

## What I got wrong
The agent stored too much, including guesses. Notes need a source and a date, and 'facts only' in the instructions.

## Try it yourself
1. Delete a note and see what changes.
2. Add a note that is wrong and see if the agent trusts it.
3. Write a rule for when a note expires.

## Takeaways
MCP is a plug for tools and memory. Store facts with a source and date. Memory only helps where history matters. Stale notes are a risk.
