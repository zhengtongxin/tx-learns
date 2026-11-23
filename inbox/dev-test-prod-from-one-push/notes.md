# Project: dev, test and prod from one push (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/22-dev-test-prod-from-one-push.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'22-dev-test-prod-from-one-push.html' to that item only.

Topic: Automatic deploys. Planned item: "Project: dev, test and prod from one push" (project, tag "Automatic deploys · Project"). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Combine everything: one push gives dev, a manual run gives test and prod, and teardown is a workflow too.

## Steps
1. Fresh start: destroy the hand-made environments and delete old workspaces so state matches the files.
2. Set up the remote state, the role for the pipeline and the repository secrets once.
3. Push: dev deploys. Run the manual workflow for test, then for prod with approval.
4. Test the live twin in each environment.
5. Fix a UI bug (chat input lost focus) and push it through the pipeline, as a real change would.
6. Look in the console and the logs service to see the pipeline's work.
7. Final clean-up: run destroy for each environment, check the cost page.

## What I got wrong
- Pipeline passed but the site showed old files; the CDN cache needed clearing.
- Left prod running over a weekend.
- Did not read the plan output in the log before approving.

## Try it yourself
1. Make a deliberate bad change and see it fail safely in dev.
2. Roll back by pushing a revert.
3. Write a one-page runbook: deploy, roll back, destroy.

## Takeaways
Automation is only done when teardown is automated too.
