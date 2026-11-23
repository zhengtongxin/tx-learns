# Pause for approval, resume after a crash (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/16-pause-for-approval-and-resume.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'16-pause-for-approval-and-resume.html' to that item only.

Topic: Pausing and working in parallel. Planned item: "Pause for approval, resume after a crash" (tag "Pausing and working in parallel · Lesson 16"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Make the agent able to wait for a person and carry on after a restart, without paying twice.

## Build order
1. Turn the agent into a graph with steps and edges, so its progress can be saved at each step.
2. Add a checkpointer that saves state to a hosted database.
3. When the agent approves a payout over the limit, it stops and waits, keeping everything it worked out.
4. A handler signs off in the dashboard; the agent picks the claim up exactly where it stopped and pays it.
5. Kill the process halfway through a claim; on restart it continues from the last checkpoint, and that is not a new attempt.
6. Idempotency: a step that runs again after a restart must not decide or pay twice.

## Typical outcome pattern
Durable state turns an agent from a script into a worker. The tricky part is not saving state; it is making every step safe to repeat.

## What I got wrong
After a crash I got a duplicate payment in a test. Each payment now carries a unique key and the backend ignores repeats.

## Try it yourself
1. Interrupt a run at three different points and check the result is the same.
2. Reject a held payout instead of signing it off.
3. Show the saved checkpoints for one claim.

## Takeaways
Save progress at every step. Pause by saving, not by waiting in memory. Make every step safe to repeat. The backend still enforces the sign-off rule.
