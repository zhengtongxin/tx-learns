# Project: a digital twin live on the internet (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/14-digital-twin-live.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'14-digital-twin-live.html' to that item only.

Topic: An AI twin with memory. Planned item: "Project: a digital twin live on the internet" (project, tag "An AI twin with memory · Project"). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Finish the digital twin: personality, memory in a bucket, backend in a function, front end behind a CDN, all reachable from a public address.

## Steps
1. Local first: chat, persona, file memory all working.
2. Cloud setup: a bucket for memory, a function with the packaged backend, an API gateway, a bucket for the static site, a CDN in front.
3. Wire in order, backend then gateway then front end then CDN; test each piece before adding the next.
4. Update the front end's API address, rebuild static files, upload.
5. Test: first message, remember message, restart, still remembered.
6. Cost check and clean-up plan.

## What I got wrong
- CDN served the old front end for minutes. Invalidate the cache after upload.
- Hard-coded the API address; use an env variable at build time.
- Did the console clicking from memory and could not repeat it later. (The next topic fixes that.)

## Try it yourself
1. Give a friend the link and read their conversations (with their permission).
2. Break it on purpose by deleting the bucket permission.
3. Write the exact click steps you used; notice how long the list is.

## Takeaways
Pieces are small and boring; the work is wiring them in a safe order.
