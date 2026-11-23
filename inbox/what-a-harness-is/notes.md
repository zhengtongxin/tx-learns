# What a harness is (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/07-what-a-harness-is.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'07-what-a-harness-is.html' to that item only.

Topic: Harness engineering. Planned item: "What a harness is" (tag "Harness engineering · Lesson 7"). This is a short foundations lesson. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Understand that an agent is a model plus a harness: the tools, instructions, memory and checks around it.

## Build order
1. Describe the pilot's weakness: my code organises everything. It feeds one claim at a time, pastes the whole policy wording every time, and a claim that fails partway gets stuck.
2. Define the harness: instructions, tools, a to-do list, helpers for sub-jobs, and middleware that handles errors.
3. Show the goal: one run works the whole queue, choosing the order itself, with a to-do list we can watch.
4. Each claim goes to a fresh helper with a clean start that reports back in one line.
5. The agent finds the manual sections it needs instead of being handed everything.
6. Problems fix themselves: a failed claim goes back to the queue once, then is left for a handler.

## Typical outcome pattern
Most improvements come from the harness, not the model. A clean helper per claim keeps cost from growing as a run goes on, and recovery rules mean one bad claim never stops the run.

## What I got wrong
I kept putting more rules in the prompt. It was better to give the agent a tool and a to-do list, and let code handle retries.

## Try it yourself
1. Draw your pilot as model plus harness. What does your code do that the agent should do?
2. List three things that can fail in a long run and the rule for each.

## Takeaways
Agent = model + harness. Give the agent tools and a plan, not a longer prompt. Use fresh helpers for each unit of work. Make failure handling the harness's job.
