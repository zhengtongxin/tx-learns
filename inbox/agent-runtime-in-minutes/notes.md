# An agent runtime in minutes (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/23-agent-runtime-in-minutes.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'23-agent-runtime-in-minutes.html' to that item only.

Topic: Agents as a managed service. Planned item: "An agent runtime in minutes" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
See how much of the earlier work a managed agent runtime does for you: containers, registry, roles and a running endpoint from one command.

## Steps
1. Permissions first: a group with the model service, the build service and the agent runtime. Request model access in the right region. Turn on observability in its console.
2. Read the docs of the runtime and its starter kit; install the tiny project with the packages (runtime SDK, agent library, toolkit, data models).
3. Write a first agent file: an app object, an agent, one entry point that takes a prompt and returns text.
4. Configure it for the file, launch it (it builds the container, pushes it, creates the roles, starts the service) and invoke it with a JSON prompt.

## What I got wrong
- Default region differed from the model's region, so errors. Pass the region on configure.
- Only one entry-point file is allowed per project.
- Forgot to clean up the deployed agent.

## Try it yourself
1. Invoke it three times and watch the logs.
2. Change the system prompt, relaunch, compare.
3. List what you did by hand in earlier topics that it did for you.

## Takeaways
Managed runtimes remove the plumbing, not the thinking. Region and permissions are still yours.
