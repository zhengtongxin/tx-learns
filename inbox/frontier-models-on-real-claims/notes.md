# Frontier models on real claims (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/04-frontier-models-on-real-claims.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'04-frontier-models-on-real-claims.html' to that item only.

Topic: Picking the model for the job. Planned item: "Frontier models on real claims" (tag "Picking the model for the job · Lesson 4"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Run the same set of claims through several frontier models, then compare accuracy, by difficulty, and what each one cost.

## Build order
1. Load 25 claims, each with the policy record and the wording, and the handlers' decisions.
2. One prompt: decision (approve, decline or refer), a short rationale, a payout.
3. Call a few models through one gateway service so the code is the same for each.
4. Score: decision matches the handler, and the payout is within a dollar.
5. Split results by difficulty (easy, medium, tricky) and read the wrong ones line by line.
6. Add up the cost per claim from the token counts.
7. Optional: give a tool-using agent the same job and compare.

## Typical outcome pattern
Bigger models win on the tricky claims, but on easy claims the gap is small and a cheaper model is often fine. Accuracy alone hides the cost: the best model can cost many times more per claim.

## What I got wrong
I compared models on one run. Models vary from run to run, so a one-claim difference means nothing. I now run each twice and only trust gaps bigger than the noise.

## Try it yourself
1. Add one more model and see where it sits.
2. Re-run the best model three times and note how much the score moves.
3. Pick the model you would deploy and justify it in two sentences.

## Takeaways
Same task, same data, same scoring for every model. Report accuracy by difficulty, not one number. Show cost beside accuracy. Run twice before believing a small gap.
