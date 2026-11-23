# Plan first, then build with a coding agent (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/02-plan-then-build-with-a-coding-agent.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'02-plan-then-build-with-a-coding-agent.html' to that item only.

Topic: The FDE’s job. Planned item: "Plan first, then build with a coding agent" (tag "The FDE’s job · Lesson 2"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Learn the plan-then-build rhythm: the customer's documents go in, a coding agent writes a plan I review, then it builds.

## Build order
1. Put the requirements in a folder of plain documents: a spec (what the business needs), tech choices, code standards, a process file, a brand note, a status file.
2. Give the coding agent one standing instruction file that says 'read these first, in this order, before touching anything'.
3. Ask for a plan, not code: 'plan the pilot' writes a plan document with phases and reasons.
4. I read the plan, push back, then say 'implement the plan'.
5. The agent builds the backend, a dashboard and a first agent from the documents. I check each phase against the spec.
6. Keep a short status file: what is built, how to run it.

## Typical outcome pattern
Plan-first catches misunderstandings while they are cheap. With good documents a coding agent builds a working pilot in one sitting. With vague documents it builds something confident and wrong.

## What I got wrong
I asked for code straight away on a vague brief and got a tidy dashboard that answered the wrong question. Writing the brief better took ten minutes; unpicking the build took an hour.

## Try it yourself
1. Write a one-page spec for a small tool you want.
2. Ask a coding agent for a plan only. Edit the plan before any code.
3. Add a rule to the standing instructions: never build ahead of the documents.

## Takeaways
Documents are the real interface to a coding agent. Review the plan, not just the code. Never let it build ahead of the brief. Keep a status file so the next session starts informed.
