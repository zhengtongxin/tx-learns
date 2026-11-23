# Why a model needs your documents (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/13-why-model-needs-documents.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'13-why-model-needs-documents.html' to that item only.

Topic: Retrieval (RAG). Planned item: "Why a model needs your documents". Foundations lesson, ~15 min.

## The problem
A model knows the internet up to a cutoff date and nothing about my private files, my company's staff, or last week. Ask it about a fictional town council's staff and it makes something up with confidence.

## The simplest fix first
Put the facts in the prompt. I loaded a small folder of markdown files (staff profiles and product pages) into a dictionary keyed by a lowercase name, and wrote a function that looks at the words in the user's question: if a word matches a key, add that file's text to the system message for this turn. "Who is Priya?" now includes Priya's file. It works, which is exactly what RAG is: Retrieval, then Augmented Generation.

## Why this simple version breaks
- It only matches exact words. "Who started the company?" matches nothing.
- Pasting everything is expensive and may not fit the context window.
- More text can make the model lose the one useful sentence.

## The RAG recipe
1. Prepare: split documents into chunks, turn each chunk into a vector, store them.
2. At question time: turn the question into a vector, fetch the closest chunks.
3. Put those chunks in the prompt, with an instruction to say "I don't know" if the answer isn't there.
4. The model answers from the chunks.

## Alternatives I should remember
Fine-tuning teaches a style or skill but is poor for fast-changing facts. Long context windows can hold a lot, but are slow and costly per question. RAG is cheap, updatable (replace a file), and can cite its source.

## What I got wrong
Thought RAG was a database query. It is a search by meaning followed by a normal prompt.

## Try it yourself
Make five small text files about something you know, build the keyword lookup, then find a question it fails on.

## Takeaways
Models don't know your data. Put the right facts in the prompt. Keyword lookup is RAG in miniature; meaning-based search is what makes it work in general.
