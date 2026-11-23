# Shared state and stale locks (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/20-shared-state-and-stale-locks.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'20-shared-state-and-stale-locks.html' to that item only.

Topic: Automatic deploys. Planned item: "Shared state and stale locks" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Move Terraform state off my laptop so teammates and robots can share it, and learn what a stale lock is.

## Steps
1. Create a state bucket (versioned, encrypted) and a lock table once per account. Then point the config at them as the backend.
2. Migrate local state to the remote backend and check it arrived.
3. While a run is going, the lock stops anyone else from changing the same state.
4. If a run is killed, the lock is left behind: a stale lock. Check nobody is really running, then force-unlock with the lock id.
5. A destroy script can detect the lock error, unlock and retry; use carefully.

## What I got wrong
- Force-unlocked while another run was alive, which can corrupt state.
- Lost track of which bucket held which environment's state.
- Forgot versioning, so no way back from a bad write.

## Try it yourself
1. Look at the state object's versions in the bucket.
2. Start a plan, interrupt it, see the lock message.
3. Write the checklist you would follow before unlocking.

## Takeaways
Shared state needs a lock. A stale lock is normal; unlocking blindly is not.
