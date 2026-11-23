# Tracing and experiments (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/11-tracing-and-experiments.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'11-tracing-and-experiments.html' to that item only.

Topic: Measuring an agent. Planned item: "Tracing and experiments" (tag "Measuring an agent · Lesson 11"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Use tracing to see every step of a run and experiments to compare two versions of the agent on the same set of claims.

## Build order
1. Connect an observability tool so every claim's run is traced: each model call, tool call, cost and time.
2. Make a dataset of harder claims with the handlers' answers as the reference.
3. Define the task (run the agent on one claim) and evaluators (decision match, payout match, cost).
4. Experiment one: the baseline agent.
5. Experiment two: add a payout tool that applies the company's payout rules.
6. Compare the two runs side by side in the tool, then tidy up the test data.

## Typical outcome pattern
A payout tool with the company's rules fixes most payout errors that no prompt change could. Tracing makes it obvious: the model was doing arithmetic from memory.

## What I got wrong
I changed two things in one experiment and couldn't tell which helped. One change per experiment.

## Try it yourself
1. Trace one claim and read it step by step.
2. Add a third experiment that changes only the instructions.
3. Write the one-line conclusion each experiment supports.

## Takeaways
Trace first, then guess. Same dataset for every experiment. Change one thing at a time. Tools beat prompts for anything exact.
