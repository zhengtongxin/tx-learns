# Right and wrong answers that cost differently (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/10-right-and-wrong-answers-that-cost-differently.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'10-right-and-wrong-answers-that-cost-differently.html' to that item only.

Topic: Measuring an agent. Planned item: "Right and wrong answers that cost differently" (tag "Measuring an agent · Lesson 10"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Score the claims agent with a confusion matrix, precision and recall, kappa and a cost for each kind of mistake.

## Build order
1. Build the matrix: handler's decision in rows, agent's in columns.
2. Name the off-diagonal mistakes: a wrongful decline (customer let down), a wrongful payment (money out the door), a needless referral (handler time wasted).
3. Precision and recall for approvals.
4. Kappa: corrects accuracy for chance. If 56% of claims are approvals, approving everything scores 56% accuracy and kappa near zero.
5. Straight-through rate: share decided without a referral. An agent that refers everything makes no wrong payments but has 0% straight-through.
6. Put a price on each mistake type and total it per run.

## Typical outcome pattern
Two agents with the same accuracy can cost very different amounts. The cheap-looking one may be making expensive mistakes, so the scoreboard needs mistake costs, not just a percentage.

## What I got wrong
I trusted accuracy first. Once wrongful payments had a price, the 'best' agent changed.

## Try it yourself
1. Change the price of a wrongful payment and see the ranking move.
2. Compute kappa by hand for a tiny set.
3. Decide what Mr Goh would treat as unacceptable.

## Takeaways
Accuracy flatters. Name the kinds of mistakes and price each. Report straight-through rate beside accuracy. Use kappa to correct for chance.
