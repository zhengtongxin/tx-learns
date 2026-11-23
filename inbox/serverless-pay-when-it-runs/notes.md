# Serverless: paying only when it runs (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/09-serverless-pay-when-it-runs.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'09-serverless-pay-when-it-runs.html' to that item only.

Topic: Containers and a safe cloud account. Planned item: "Serverless: paying only when it runs" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Run the containerised product without owning a server: it wakes when a request arrives, and I pay for the milliseconds it runs.

## Steps
1. Serverless functions run code only on demand; the first call after idle is a "cold start" of a few seconds, later ones are quick.
2. A function URL gives the function its own HTTPS address without an extra gateway, and now supports streaming responses.
3. A small adapter, dropped into the container, lets an ordinary web framework run there unchanged: it turns each invocation into a normal web request on a local port.
4. Push the image to the registry, create the function from it, give it the env variables, open the URL.
5. Watch the logs service for the first real request and read the cold start time.

## What I got wrong
- Thought it would feel instant every time. The first request after idle is slow; users notice.
- Streaming did not stream until I used the streaming-capable setting.
- Left the timeout at its small default.

## Try it yourself
1. Hit the URL twice, one after a long gap, and compare times.
2. Lower the memory and see what changes in time and cost.
3. Find the line in the logs that shows the billed duration.

## Takeaways
Serverless trades idle cost for cold starts. It is great for small, spiky apps; know the trade before you pick it.
