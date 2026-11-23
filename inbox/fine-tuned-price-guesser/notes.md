# Project: a fine-tuned price guesser (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/24-fine-tuned-price-guesser.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'24-fine-tuned-price-guesser.html' to that item only.

Topic: Fine-tuning open models. Planned item: "Project: a fine-tuned price guesser" (project, tag "Fine-tuning open models · Project"). ~30 min, hands-on.

## Goal
Fine-tune a small open model with QLoRA so it guesses second-hand gadget prices, then compare it with the frontier model and the classic baselines from the earlier project.

## Build order
1. Prepare prompt/completion data with a token cutoff; push the prepared sets to the hub.
2. In a rented-GPU notebook: load the 4-bit base, attach the LoRA config, set up the trainer, run for one epoch (a few hours on a modest GPU for the full set; minutes for a subset).
3. Push the adapter to the hub with a run name and note the revision.
4. Inference: load base + adapter, prompt with "price is $" style prefix, generate a few tokens, parse the number. Make generation deterministic (greedy). One trick: take the most likely next-token probabilities and compute a weighted average over the top few number candidates; that gives a smoother estimate than the single top choice.
5. Evaluate on the shared test set with the same harness.
6. Add it to the comparison table with cost and speed.

## Typical outcome
A tuned 3B-8B open model, trained on tens of thousands of examples, can match or beat a big frontier model on this narrow task, while being far cheaper per call and fully mine. With only a few hundred examples it won't.

## What I got wrong
Evaluated on data the model had seen (a leak between train and test). Fixed by building the split once and never touching test.

## Try it yourself
1. Train on 1,000 examples and then 10,000 and plot test error against data size.
2. Try r=8 and r=32.
3. Quantify cost per 1,000 guesses against the frontier model.

## Takeaways
Narrow task + enough data + small tuned model = cheap, fast, good. Keep test data clean. Compare honestly against the easy alternatives.
