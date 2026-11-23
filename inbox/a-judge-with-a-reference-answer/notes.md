# A judge with a reference answer (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/19-a-judge-with-a-reference-answer.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'19-a-judge-with-a-reference-answer.html' to that item only.

Topic: Improving and securing. Planned item: "A judge with a reference answer" (tag "Improving and securing · Lesson 19"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Use a second model as a judge that grades the agent's explanation against the handler's reason.

## Build order
1. Each held-out claim has the handler's decision and their reason.
2. The judge sees the agent's explanation and the handler's reason and gives a grade from F to A, a score from 0 to 3, and two checks: same grounds, same section of the wording.
3. Check the judge itself: do its grades agree with a human's on a handful of claims?
4. Measure how much scores move between runs, so I know the noise.
5. Record the judge's cost separately from the agent's.

## Typical outcome pattern
A judge with a reference answer is far more steady than one that grades by feel. Even so, scores move between runs, so only changes bigger than the noise count.

## What I got wrong
I trusted the judge before checking it. Reading twenty of its grades myself found it favouring long explanations.

## Try it yourself
1. Grade ten explanations yourself and compare with the judge.
2. Remove the reference and see how the judge changes.
3. Report the judge's cost per claim.

## Takeaways
Give judges a reference. Check the judge against a person. Know your noise before claiming a win. Count the judge's cost.
