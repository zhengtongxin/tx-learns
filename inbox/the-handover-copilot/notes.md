# Project: the handover copilot (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/25-the-handover-copilot.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'25-the-handover-copilot.html' to that item only.

Topic: Handing it over. Planned item: "Project: the handover copilot" (tag "Handing it over · Project"). This is a hands-on project, about 30 minutes. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Build a copilot in the dashboard's sidebar that handlers ask in plain English, and hand the finished system over.

## Build order
1. A sidebar on every page that can be collapsed to a tab, and the browser remembers the choice.
2. It acts as the handler who asked: every call carries their sign-in, so it can do what they can and no more. If they cannot sign off over the limit, neither can the copilot.
3. It looks things up in the records and context layer, starts the agent's work, sends decisions back and asks before it pays.
4. It shows every step as it takes it. Conversations are kept; it remembers each handler.
5. Success criteria agreed at the start of the pilot are checked at the handover.
6. A handover conversation: what the copilot knows about the pilot, then tear everything down and check what remains and what it cost.

## Typical outcome pattern
The copilot works because everything before it is solid: records, permissions, policy and traces. Handlers ask what needs them today and get an answer with sources.

## What I got wrong
I nearly left cloud resources running after the demo. A final teardown with a check of everything left on the account (and the bill) should be part of the plan.

## Try it yourself
1. Ask it three questions Aisha would ask.
2. Try to make it do something the handler is not allowed to do.
3. Run the teardown and list what stayed.

## Takeaways
A copilot inherits the user's permissions. Ask before it pays. Show its steps. Plan the handover and the teardown from the start.
