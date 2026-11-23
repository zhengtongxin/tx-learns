# State, workspaces and three environments (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/18-state-workspaces-three-environments.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'18-state-workspaces-three-environments.html' to that item only.

Topic: Infrastructure as code. Planned item: "State, workspaces and three environments" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Run development, test and production as three copies of the same stack without copy-pasting configs.

## Steps
1. One folder of config: provider, variables, main resources (memory bucket, site bucket, function role, function, gateway, CDN) and outputs.
2. A variable called environment feeds every name, so dev and prod never collide.
3. State records which real resources match the config. Each workspace has its own state file.
4. Switch workspace, apply with that environment's variables.
5. Use per-environment settings, for example a smaller model in dev and a bigger one in prod.
6. Optional: a custom domain through DNS.

## What I got wrong
- Applied in the wrong workspace once. Print the current workspace in the deploy script.
- Names clash: bucket names must be globally unique, so add the account id.
- Edited a resource by hand in the console; the next plan wanted to undo it.

## Try it yourself
1. Deploy dev, change one variable, deploy test, compare outputs.
2. Run plan twice and confirm "no changes".
3. Find the state file and describe what is in it.

## Takeaways
Same code, three states. Never hand-edit what the config owns.
