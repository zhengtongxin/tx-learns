# Project: a price guesser (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/21-price-guesser.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'21-price-guesser.html' to that item only.

Topic: Predicting with data. Planned item: "Project: a price guesser" (project, tag "Predicting with data · Project"). ~30 min, hands-on. Ties together the three lessons before it.

## Goal
Type a second-hand gadget description, get back an estimated price, and know how good the estimate is compared with simple baselines.

## Build order
1. Load the cleaned dataset (use the small "lite" version first).
2. The shared evaluate function (average error, scatter plot, hits within a tolerance).
3. Baselines: constant average, bag-of-words linear regression, random forest. Record their scores in a small table.
4. Frontier predictor: a function `frontier_pricer(item)` that sends the description with a one-line instruction and parses a number from the reply.
5. Fine-tune a hosted small model on 100 examples; wrap it as `tuned_pricer(item)`.
6. Put all predictors in one table: name, average error, cost per 1,000 guesses, seconds per guess.
7. Tiny Gradio screen: text box in, price out, and the other models' answers beside it so I can see them disagree.

## Typical outcome pattern
Random >> average > linear > forest and neural net > prompted frontier model; tuning helps a little with few examples. Cheapest acceptable winner is often a classic model; most accurate is often the frontier or the tuned model. That trade-off is the lesson.

## What I got wrong
Forgot to handle replies like "About $120 maybe" (parse failed and counted as zero). Added a fallback and a count of unparsed replies.

## Try it yourself
1. Add your own category of items and re-run.
2. Show a confidence band by running the predictor three times and taking the spread.
3. Decide a rule: when is a guess good enough to act on?

## Takeaways
Always report accuracy, cost and speed together. Same test set for everyone. Parse defensively.
