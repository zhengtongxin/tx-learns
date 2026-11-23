# Open models, local models and token cost (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/05-open-models-local-and-token-cost.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'05-open-models-local-and-token-cost.html' to that item only.

Topic: Picking the model for the job. Planned item: "Open models, local models and token cost" (tag "Picking the model for the job · Lesson 5"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
See how open-weight and local models compare on the same claims, and how shorter prompts cut cost and time.

## Build order
1. Start from the full prompt, then make a smaller one: a short version of the policy wording, only the sections that matter for that claim type, and compact JSON instead of pretty-printed.
2. Measure what the smaller prompt saves in tokens.
3. Run six open-weight models through a hosting service, where several providers serve the same model.
4. Run two or three small models on my own computer with Ollama.
5. Put accuracy, cost and speed side by side: accuracy against cost, accuracy against speed, then all three together.
6. Check the baseline: if most claims are approvals, a model that approves everything already scores well.

## Typical outcome pattern
Open and local models can be close on easy claims and clearly worse on hard ones. Local is free per token but slower and needs disk and memory. A smaller prompt helps every model, but it can leave out the one section a claim needs.

## What I got wrong
I forgot the 'approve everything' baseline. With about 60% approvals, a lazy model looked decent until I compared against the trivial answer.

## Try it yourself
1. Trim the prompt another way and see if accuracy drops.
2. Try the free route (no paid tokens) and compare.
3. Work out the cost of one thousand claims on each model.

## Takeaways
Shorter prompts are cheaper and faster but can hide needed facts. Always compare to the trivial baseline. Judge models on accuracy, cost and speed together.
