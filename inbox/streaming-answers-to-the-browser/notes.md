# Streaming answers to the browser (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/03-streaming-answers-to-the-browser.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'03-streaming-answers-to-the-browser.html' to that item only.

Topic: From laptop to live. Planned item: "Streaming answers to the browser" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Stop making users stare at a blank screen: show the model's answer word by word as it is produced.

## Steps
1. Ask the model client for a stream instead of one finished reply; it hands back small chunks.
2. Wrap the chunks in a generator and return a streaming response with the event-stream content type (server-sent events). Each piece is sent as lines that start with "data:" and end with a blank line.
3. In the browser, open an event source on the API address and append each piece to the screen.
4. Render the text as markdown with a small library so headings and lists look right, and add the typography plugin for spacing.
5. Close the connection when the stream ends or errors.

## What I got wrong
- Newlines inside a chunk broke the format. Each line of a chunk needs its own "data:" prefix.
- Looked for streaming locally only: the host and any proxy in between must not buffer the response.
- Never closed the stream on errors, so the page spun forever.

## Try it yourself
1. Slow the stream with a short sleep and watch the page fill in.
2. Add a "stop" button that closes the connection.
3. Compare how long until the first word versus the full answer.

## Takeaways
Streaming does not make the model faster; it makes waiting feel shorter. The format is simple text lines, and every layer in between must pass them through.
