# Project: an improver a human approves (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/20-improver-a-human-approves.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'20-improver-a-human-approves.html' to that item only.

Topic: Improving and securing. Planned item: "Project: an improver a human approves" (tag "Improving and securing · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Build a loop where a second agent proposes changes to the claims agent, a person approves them, and code keeps or rolls them back.

## Build order
1. Keep the agent's instructions, model and reasoning effort as one configuration in numbered versions. Each records what changed, why, who proposed it and who approved it.
2. The improver follows a recipe: read the results, propose a change, wait for approval, run the evaluations.
3. Code decides whether to keep a change by scores on the held-out claims, never the improver itself.
4. The recipe's last step is to improve the recipe.
5. A Configuration page shows every version with its scores and what changed.
6. Only one round open at a time; a handler can stop it.

## Typical outcome pattern
Small changes to instructions give modest gains, and some make things worse. The approval step and the rollback are what make the loop safe enough to use at work.

## What I got wrong
My first improver changed three things at once and optimised for the sample claims. The held-out set caught it.

## Try it yourself
1. Reject a proposal and see that nothing changes.
2. Roll back to version 1.
3. Write what you would never let the improver change.

## Takeaways
Version the configuration. A person approves; code decides keep or roll back on held-out claims. Never let the improver mark its own work.
