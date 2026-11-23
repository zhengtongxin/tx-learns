# A safe cloud account: roots, users and budget alarms (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/07-safe-cloud-account.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'07-safe-cloud-account.html' to that item only.

Topic: Containers and a safe cloud account. Planned item: "A safe cloud account: roots, users and budget alarms" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Open a cloud account the safe way before deploying anything: root locked away, a limited daily user, and alarms on spend.

## Steps
1. Sign up, then immediately protect the root login with multi-factor authentication. Root is for rare emergencies only.
2. Set budget alerts (I used $1, $5 and $10) before creating any resource.
3. Create a limited user for daily work and a user group that holds the permissions (container registry, serverless, storage, CDN, API gateway, logs...). Permissions go to the group, people join the group.
4. Sign in as that user from now on and set a default region.
5. Know the main words: serverless compute (runs code only when called), a container registry (like GitHub for images), the identity service (who can do what), the logging service (the browser console for servers).

## What I got wrong
- Region mismatch: a service I wanted was only in one region and my default was another.
- Skipped the budget step "for later". The alarm is the whole point.
- Tried to do everything as root because it was easier.

## Try it yourself
1. Create the user and group, then try an action that the group does not allow and read the denial.
2. Set one alert at an amount you could not ignore.
3. Write down how you would rotate a leaked access key.

## Takeaways
Money and permissions first, resources second. A typical learning project stays almost free; the alarm tells you the day it does not.
