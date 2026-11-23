# Picking a model by cost and speed, then watching it (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/16-picking-a-model-by-cost-and-speed.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'16-picking-a-model-by-cost-and-speed.html' to that item only.

Topic: Managed models in the cloud. Planned item: "Picking a model by cost and speed, then watching it" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Choose a model size on purpose, then watch real usage after it is live.

## Steps
1. The provider's own family comes in three sizes: micro (fastest, cheapest, simple jobs), lite (balanced), pro (best at reasoning). Make the model id an env variable so switching needs no code change.
2. Prices are per thousand input and output tokens; work out a month at 1,000 chats of average length.
3. Run the same ten test questions on each size and compare quality, speed and cost.
4. Turn on monitoring: look at invocations, duration, errors and token counts in the logs service. Set an alarm on errors or cost.
5. Cost tips: shorter prompts, a history cap, the smallest model that passes my tests.

## What I got wrong
- Picked the biggest model "to be safe" and never checked if the small one passed.
- Judged quality on one prompt.
- Did not look at logs until a user complained.

## Try it yourself
1. Build a ten-question test and score all three sizes.
2. Estimate cost per chat for each.
3. Find one log line that shows a slow request.

## Takeaways
Pick by test, not by feeling. If you do not watch it, you will hear about problems from users.
