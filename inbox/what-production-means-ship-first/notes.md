# What production means: ship something first (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/01-what-production-means-ship-first.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'01-what-production-means-ship-first.html' to that item only.

Topic: From laptop to live. Planned item: "What production means: ship something first" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Get a tiny AI web service live on a real public address in minutes, before learning anything fancy. Seeing it live first made "production" feel less scary.

## Steps
1. A free hosting account (a platform that deploys straight from my folder) and an editor with an AI helper built in.
2. One Python file with a FastAPI app: a single route that returns a short JSON greeting.
3. A requirements file listing the web framework and the adapter the host needs.
4. A small config file telling the host: "build this Python file, send every URL to it".
5. Install Node and the host's command-line tool, log in, run one deploy command, open the URL it prints.
6. Add the model call (an OpenAI-style client) to the route and put the API key in the host's environment settings, never in the code.

## What "production" meant for me
Not "big". Just: other people can reach it, it keeps running when my laptop is shut, and secrets are not in the files.

## What I got wrong
- Typed the key straight into the code first. Moved it to an environment variable before the first deploy.
- "command not found" for the deploy tool: Node was not installed yet, or the terminal needed reopening.
- Python version mismatch: the host picks a version; pin it.

## Try it yourself
1. Deploy a route that returns today's date.
2. Break the config on purpose and read the build log to see what the host complains about.
3. Redeploy and compare the preview address with the production one.

## Takeaways
Ship a small thing first. Config tells the host what to build and where traffic goes. Secrets live in the host's settings, not the repo.
