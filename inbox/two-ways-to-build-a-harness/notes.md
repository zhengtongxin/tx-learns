# Two ways to build a harness (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/08-two-ways-to-build-a-harness.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'08-two-ways-to-build-a-harness.html' to that item only.

Topic: Harness engineering. Planned item: "Two ways to build a harness" (tag "Harness engineering · Lesson 8"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Build the same claims agent two ways, with a ready-made agent SDK and with an open agent framework, and compare.

## Build order
1. The same claims desk, the same queue, the same task.
2. Way one: an agent SDK with built-in tools for files, planning and sub-agents.
3. Way two: an open framework where I choose the model and write the tools and middleware.
4. For each: set up the harness, let it work the queue, then look at how it did.
5. Compare setup effort, control over the model, cost, and how easy it is to see what the agent did.
6. Note the free-model route for each so I can practice without spending.

## Typical outcome pattern
The ready-made SDK gets going fastest and feels very capable on a strong model. The open framework gives me control over the model and cost but I write more. Neither is always better; the harness ideas carry over.

## What I got wrong
I treated the two as rival teams. They share the same ideas (tools, planning, helpers), so learning one made the second quick.

## Try it yourself
1. Run both on five claims and compare the to-do lists.
2. Swap the model in the open framework and watch cost change.
3. Decide which you would hand to Kumar to maintain.

## Takeaways
Learn the harness ideas, not one framework. Compare on setup, control, cost and visibility. Choose the one the customer's team can maintain.
