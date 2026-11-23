# Where memory lives in the cloud (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/13-where-memory-lives-in-the-cloud.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'13-where-memory-lives-in-the-cloud.html' to that item only.

Topic: An AI twin with memory. Planned item: "Where memory lives in the cloud" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Work out where the twin's memory and files go once there is no laptop disk: a storage bucket, behind a function and a gateway, in front of a CDN.

## Steps
1. The request path: browser, CDN (fast and HTTPS), static site bucket (the front end), API gateway, serverless function (the backend), then the model service and a memory bucket.
2. Memory moves from local JSON files to objects in a storage bucket, one per session.
3. The same server code runs locally or in the cloud, switched by an env variable (local file versus bucket).
4. Package the function with its libraries, upload it, set variables, give it permission to the bucket.
5. Static front end goes to its own bucket, the CDN sits in front.
6. Know the cost levers: small memory, short logs, delete what is unused.

## What I got wrong
- A serverless function has no durable disk, so my file memory silently vanished between calls.
- CORS on the gateway was missing; the browser blocked calls.
- Gave the function too many permissions at first.

## Try it yourself
1. Send a chat, find its object in the bucket.
2. Remove the function's bucket permission and read the error.
3. Draw the whole path and mark where each secret lives.

## Takeaways
No server disk means storage is a service. Least privilege for each piece.
