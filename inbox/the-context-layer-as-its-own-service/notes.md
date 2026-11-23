# The context layer as its own service (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/23-the-context-layer-as-its-own-service.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'23-the-context-layer-as-its-own-service.html' to that item only.

Topic: Handing it over. Planned item: "The context layer as its own service" (tag "Handing it over · Lesson 23"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Put the business's definitions and rules behind a service of their own so the agent reads them through the gateway.

## Build order
1. Three sources with three owners: the context layer (the business's data from other systems, owned by data governance, read only), memory (the agent's own notes) and the database (system of record).
2. Governance supplies seven files: plans, claim rules, a glossary, data dictionary, reference data, the wording and the manual, each with its source, owner and last review date.
3. Serve them as a small service of their own with its own sign-in.
4. Put it behind the same gateway as a second target.
5. Make every decision record complete: calculation, who or what decided, and which version of the manual it followed.
6. Show every step on the claim page.

## Typical outcome pattern
Separating context from code means governance can update a definition without a deployment. It also shows exactly what the agent read when it decided.

## What I got wrong
I treated the governance files as mine and edited one. They belong to data governance; the agent only reads them.

## Try it yourself
1. Change a rule in the context layer and rerun a claim.
2. Show which files each decision used.
3. Add the review date to the claim page.

## Takeaways
Context has an owner. Read-only for the agent. Decision records should be complete enough to audit. Serve context separately from code.
