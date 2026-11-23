# Project: a company knowledge helper (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/17-company-knowledge-helper.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'17-company-knowledge-helper.html' to that item only.

Topic: Retrieval (RAG). Planned item: "Project: a company knowledge helper" (project, tag "Retrieval (RAG) · Project"). ~35 min, hands-on. Builds a better RAG than the basic chain.

## Goal
A helper that staff can ask about people, products and policies in a small company's markdown knowledge base, and that stays accurate on hard questions. I use a made-up town-council knowledge base for the demo.

## Upgrades over the basic chain
1. Smart chunking with an LLM. Instead of cutting every 1000 characters, ask a model to split each document into overlapping chunks, each with a headline (a few words likely to match a query), a short summary and the original text. Use a structured output schema (Pydantic) so I get a clean list back. Slow but run once; run documents in parallel unless rate limits bite. Embed headline + summary + text together.
2. Retrieve more, then rerank. Fetch many chunks (say 20), ask a model to order them by relevance to the question, keep the best few. A chunk that matched on words but not meaning drops down.
3. Query rewriting. Before searching, ask a model to turn the user's question (plus chat history) into a precise standalone search query. "And who is her manager?" becomes a full question naming the person.
4. Cite sources: include each chunk's source file name in the context.
5. Merge results from the original and the rewritten query so I don't lose a good hit.

## Evidence it helped
Re-run the test set from the measuring lesson: MRR and coverage rose, and the weak "holistic" category improved the most. Example: "who went to a certain university?" only worked after reranking pulled the right chunk from rank 15 to the top.

## What I got wrong
Rewrote queries so aggressively that the rewrite drifted from what the user meant; I now merge original and rewritten results. Also ran the slow LLM chunking on every start; now it is run once and the store is reused.

## Try it yourself
1. Turn reranking off and compare scores.
2. Add a "sources" line under each answer.
3. Try a smaller, cheaper model for reranking.

## Takeaways
Better chunks, rerank, rewrite, cite: each fixes a specific failure. Measure each change. Don't rebuild the store on every start.
