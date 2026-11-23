# Agentic RAG over a manual (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/13-agentic-rag-over-a-manual.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'13-agentic-rag-over-a-manual.html' to that item only.

Topic: Knowledge and memory. Planned item: "Agentic RAG over a manual" (tag "Knowledge and memory · Lesson 13"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Let the agent look things up in a knowledge base, a claims manual and past cases, instead of stuffing everything into the prompt.

## Build order
1. The harder claims need facts from outside the policy: a typhoon, a strike, a common-sense rule about used items.
2. Build a small knowledge base: the claims manual plus notes on outside events.
3. Give the agent a search tool over it.
4. The agent decides when to search and what to search for, and can search again.
5. Compare with plain retrieval that always fetches the same top chunks once.
6. Check where the answer's facts came from: the claim page shows the sections the agent read.

## Typical outcome pattern
Agentic retrieval beats one-shot retrieval on claims that need two facts joined (for example a strike plus a policy exclusion). It costs more calls, so use it only where one shot fails.

## What I got wrong
The agent searched with the customer's whole story and got noise. Searching with a short specific question worked far better.

## Try it yourself
1. Remove one manual section and see which claim breaks.
2. Limit the agent to two searches and note the effect.
3. Add a source line to every answer.

## Takeaways
Let the agent choose its own searches. Short, specific queries beat pasting the whole story. Show which sections were read. Use multi-step search only when one step fails.
