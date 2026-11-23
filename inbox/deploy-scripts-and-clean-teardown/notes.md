# Deploy scripts and a clean teardown (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/19-deploy-scripts-and-clean-teardown.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'19-deploy-scripts-and-clean-teardown.html' to that item only.

Topic: Infrastructure as code. Planned item: "Deploy scripts and a clean teardown" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Wrap the steps in scripts so deploying and destroying are one command each, and leave nothing running.

## Steps
1. A deploy script: build the backend package, build the front end, select or create the workspace, apply, upload the site, print the URLs.
2. A destroy script: empty the buckets first (a bucket with objects will not delete), then destroy.
3. Run it for dev, check the live twin, run it for test.
4. Delete an environment cleanly and confirm in the console that no resources remain.
5. Cost: delete test environments between sessions, the budget alarm is the last line of defence.

## What I got wrong
- Destroy failed on non-empty buckets.
- Scripts written for my machine broke on a friend's operating system; keep a version for each.
- Forgot to destroy test after finishing.

## Try it yourself
1. Time a full deploy and a full destroy.
2. Make the script stop if the workspace is not the one you typed.
3. Do a full deploy-destroy-deploy cycle and compare outputs.

## Takeaways
A deploy you cannot undo is a risk. Script both directions.
