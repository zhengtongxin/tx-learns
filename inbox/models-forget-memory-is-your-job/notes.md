# Models forget: why memory is your job (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/11-models-forget-memory-is-your-job.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'11-models-forget-memory-is-your-job.html' to that item only.

Topic: An AI twin with memory. Planned item: "Models forget: why memory is your job" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
See why a chat model seems to forget: every call starts blank, so memory is something my app must add.

## Steps
1. Build a "digital twin" chat: a Next.js app-router page with a chat component, and a FastAPI backend that calls the model.
2. First version has no memory. Tell it my name, ask again next message: it has no idea.
3. The fix is to send the earlier messages with each new call. Keep them per session id.
4. Store each session as a JSON file on disk so it survives a restart.
5. App router versus the older pages router: folders define routes and components are server-side unless marked client.

## What I got wrong
- Assumed the model "remembered" because the chat looked continuous. The page was resending history all along in my head; the code was not.
- Let the history grow forever, which costs more with every message.
- Tailwind version change broke the styles until I read the migration note.

## Try it yourself
1. Run with and without memory and compare the same three questions.
2. Cap the history at the last 20 messages.
3. Open the JSON file and read a conversation like a log.

## Takeaways
Models are stateless. Memory = your stored messages plus a session id. Decide what to keep, for how long, and who can read it.
