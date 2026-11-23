# Why clicking in a console does not scale (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/17-why-console-clicking-does-not-scale.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'17-why-console-clicking-does-not-scale.html' to that item only.

Topic: Infrastructure as code. Planned item: "Why clicking in a console does not scale" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Feel the pain of hand-built infrastructure, then meet the fix: describe it in files.

## Steps
1. First delete the hand-made twin on purpose: function, gateway, buckets, CDN. Doing it by hand shows how many parts there were.
2. Infrastructure as code means the setup is text: reviewable, versioned, repeatable, shareable.
3. Terraform ideas: resources (the things), providers (plugins for each cloud), variables (the knobs), state (a record of what exists), workspaces (separate copies).
4. Install the tool, ignore its local files and state in git.
5. Read a short config that creates one bucket and understand each line before making more.

## What I got wrong
- Thought code for infrastructure would be harder than clicking. The first time it is; the tenth time it is far easier.
- Deleted things in the wrong order and hit dependency errors.
- Almost committed the state file, which can hold secrets.

## Try it yourself
1. Write a config for one bucket, plan it, apply it, destroy it.
2. Change a tag and read the plan's diff.
3. Count the clicks you did in the last topic.

## Takeaways
Plan shows what will change before it changes. Anything I can click, I should be able to rebuild from a file.
