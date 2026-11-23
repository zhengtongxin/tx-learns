# An agent on a managed runtime (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/24-an-agent-on-a-managed-runtime.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'24-an-agent-on-a-managed-runtime.html' to that item only.

Topic: Handing it over. Planned item: "An agent on a managed runtime" (tag "Handing it over · Lesson 24"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Run the agent on a managed agent runtime where each run lives in its own session, and let a handler send a decision back.

## Build order
1. Turn the agent's service into an agent app that answers one endpoint for work and one for a health ping.
2. Test it on my own computer first.
3. Deploy to the runtime and watch cold and warm starts.
4. Each dispatch or evaluation gets its own session; the runtime ends a session after it has been idle for a minute, even if a background thread is still going.
5. Pause in one session and resume in another.
6. Add 'send back' next to 'sign off': a senior handler can return a large approval to the agent with a note and it decides again in a new session.

## Typical outcome pattern
A managed runtime removes a lot of server upkeep, but idle timeouts and sessions change how long jobs must be written. Keeping work alive and visible is the harness's job.

## What I got wrong
A long job ended mid-run because the runtime thought it was idle. Reporting progress while it works fixed it.

## Try it yourself
1. Send a claim back with a note and watch the second decision.
2. Compare cold and warm start times.
3. List what could end a session early.

## Takeaways
Same agent on a laptop or a runtime. Sessions end when idle. Keep long work visibly alive. Sending back is as important as signing off.
