# Push to deploy with GitHub Actions (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/21-push-to-deploy-github-actions.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'21-push-to-deploy-github-actions.html' to that item only.

Topic: Automatic deploys. Planned item: "Push to deploy with GitHub Actions" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Make "git push" the only deploy step: a robot builds, tests and applies for me.

## Steps
1. Put the project in git with a careful ignore file: state, packages, env files, keys.
2. GitHub Actions workflows live in the repo. One deploys on push to main, one lets me deploy or destroy a chosen environment by hand.
3. Secrets (account id, region, state bucket, model id) go in the repository's secrets and variables; not in the files.
4. Log in to the cloud without long-lived keys: GitHub proves who it is with a short-lived token (OIDC) and the cloud lets one named repository assume a role.
5. A newer GitHub format for that token's subject claim means the trust policy must accept both the old and new pattern.
6. Environments (dev, test, prod) in GitHub let me require approval before prod.

## What I got wrong
- Trust policy named the wrong repository, so "not authorized to assume role".
- Typed a secret with a trailing space.
- The workflow ran from a branch I did not expect.

## Try it yourself
1. Push a small change and watch the run.
2. Read the run log for the first failing step.
3. Add a required approval before prod.

## Takeaways
No keys on disk, no deploys from a laptop. The pipeline is the only door.
