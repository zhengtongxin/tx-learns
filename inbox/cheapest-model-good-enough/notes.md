# Project: the cheapest model that is good enough (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/06-cheapest-model-good-enough.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'06-cheapest-model-good-enough.html' to that item only.

Topic: Picking the model for the job. Planned item: "Project: the cheapest model that is good enough" (tag "Picking the model for the job · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Choose a model for the claims desk with a written reason: the cheapest one that meets an accuracy bar Mr Goh agrees.

## Build order
1. Agree the bar with the customer first: for example, matches the handlers on at least 90% of easy claims and never wrongly pays out large claims.
2. Run three or four candidate models with the small prompt on all claims, twice each.
3. Build one table: model, accuracy overall and by difficulty, cost per 1,000 claims, seconds per claim.
4. Mark which models clear the bar.
5. Pick the cheapest that clears it, and name a fallback for hard claims (a stronger model used only when the cheap one is unsure).
6. Write the decision in half a page for Mr Goh.

## Typical outcome pattern
The winner is often a mid-priced model, with a stronger one kept for referrals. Spending more on the model rarely beats improving the prompt, tools and checks around it.

## What I got wrong
I picked on accuracy alone and the winning model was too slow for a busy queue. Speed was a requirement nobody had written down.

## Try it yourself
1. Change the bar and see the winner change.
2. Add a router: cheap model first, strong model only for 'unsure'.
3. Write what would make you revisit the choice.

## Takeaways
Agree the bar before the contest. Pick the cheapest model that clears it. Write the reason down for the customer.
