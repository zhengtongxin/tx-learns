# Measuring whether retrieval works (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/16-measuring-retrieval.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'16-measuring-retrieval.html' to that item only.

Topic: Retrieval (RAG). Planned item: "Measuring whether retrieval works". Concept lesson, ~20 min.

## Why measure
"Looks good in the chat" isn't evidence. I want a number that moves when I improve things.

## A test set
A file with one JSON object per line: question, a few keywords that must appear in the right chunks, a reference answer, and a category (direct fact, relationship, comparison, holistic across many documents). Dozens of questions across categories is enough to start.

## Two separate things to score
1. Retrieval: did the right chunks come back? For each keyword, find the rank of the first retrieved chunk that contains it.
   - MRR (mean reciprocal rank): 1/rank of the first hit, averaged. Top hit = 1, third = 0.33, missing = 0.
   - nDCG: rewards putting relevant chunks near the top of the list.
   - Keyword coverage: what fraction of keywords were found in the top k.
2. Answer: another LLM acts as judge. Given the question, the reference answer and the model's answer, it returns accuracy, completeness and relevance on a 1 to 5 scale, with feedback. Rule I like: any wrong answer must score 1.

## How I use it
Change one thing at a time (chunk size, overlap, k, embedding model), re-run, compare average scores per category. Weak categories tell me what to fix: holistic questions need more chunks or better chunks; relationship questions need related documents retrieved together.

## What I got wrong
Judged by feel after one lucky question. The judge LLM is also imperfect, so spot-check some of its scores by hand.

## Try it yourself
Write 15 questions for your own documents with keywords and answers; compute keyword coverage for k = 3, 5, 10.

## Takeaways
Test set first. Score retrieval and answers separately. Change one thing at a time. A judge model scales checking but needs spot checks.
