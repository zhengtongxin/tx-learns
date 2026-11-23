# Giving the twin a personality and facts (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/12-twin-personality-and-facts.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'12-twin-personality-and-facts.html' to that item only.

Topic: An AI twin with memory. Planned item: "Giving the twin a personality and facts" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Make the twin sound like a specific person and answer from real facts, not generic chatter.

## Steps
1. A data folder with short files: a summary, a style note, a few facts, and a PDF of a professional profile.
2. A small module reads those files at startup and builds the context text.
3. A context module writes the system prompt: your role, important context, your task, and a few firm instructions (stay in character, do not invent facts, do not reveal private data, redirect off-topic).
4. Order matters: role first, facts next, rules last.
5. Test with questions that the facts can and cannot answer.

## What I got wrong
- Pasted a whole CV and the twin made up job titles. Short, checked facts work better.
- Wrote the personality as adjectives only. Three example replies in the target style helped more.
- Forgot to write down what the twin must refuse to share.

## Try it yourself
1. Ask something the facts do not cover and see if it admits it.
2. Try to make the twin break its rules; strengthen the prompt.
3. Add one more data file and compare answers.

## Takeaways
A persona is a system prompt plus true facts plus rules. If it is not in the context, expect a guess.
