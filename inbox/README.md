# Inbox: drop raw notes here

The content creator agent turns notes in this folder into a lesson draft.

1. Make a folder per lesson, named by the concept, e.g. `inbox/agents-as-tools/`.
2. For any track other than `agentic-ai`, add a one-line file named `TRACK` with the track id (for example `ai-engineer`). No file means `agentic-ai`.
2a. Notes sent from the study coach need no `TRACK` file: their `notes.md` starts with `Track: new` (a brand-new track, under the subject on the `Subject:` line, default `community`) or `Track: <id>` (one more lesson in an existing track), then `## Exam areas`, `## Outline of my material` (headings only), `## Key terms` and `## Condensed points` built in the learner's browser from their files, which are never sent.
2b. Optional: a one-line `LEVEL` file (`1` beginner, `2` intermediate, `3` advanced) if you know how hard the lesson is. The agent places the lesson so readers go easiest to hardest.
3. Put anything in it: rough notes (`.md` or `.txt`), code (`.py`, `.ipynb`, `.js`), screenshots of your own work.
   Messy is fine. Write what confused you and what finally made it click; that becomes the human part.
4. Commit and push to the `notes` branch (create it from `main` if it is missing). That branch only holds notes: it is never merged or deployed.

Within a few minutes the content creator agent opens a pull request into `main` with the new lesson, written to `STYLE.md`.
The intern and backend engineer agents then add their fixes to that same pull request, and the frontend engineer
agent clicks through the preview. When every check is green it merges by itself and goes live within minutes; the
product engineer agent then checks the live site and rolls the merge back if it broke it. You only get a Telegram
message if something is stuck or rolled back.

This folder is never published to the site (see `.vercelignore` and `vercel.json`), but it is in the git repo.
Do not drop slides, transcripts or paid material here, and leave out platform and instructor names; write notes in your own words.
