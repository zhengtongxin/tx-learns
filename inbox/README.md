# Inbox: drop raw notes here

The writer agent turns notes in this folder into a lesson draft.

1. Make a folder per lesson, named by the concept, e.g. `inbox/agents-as-tools/`.
2. Put anything in it: rough notes (`.md` or `.txt`), code (`.py`, `.ipynb`, `.js`), screenshots of your own work.
   Messy is fine. Write what confused you and what finally made it click; that becomes the human part.
3. Commit and push to the `notes` branch (create it from `main` if it is missing). That branch only holds notes: it is never merged or deployed.

Within a few minutes the writer agent opens a pull request into `main` with the new lesson, written to `STYLE.md`.
The reader and reviewer agents then add their fixes to that same pull request, and you get one Telegram message
when it is ready to approve. Read the Vercel preview, then merge. It goes live within minutes, and the live check agent checks the site; if the merge broke it, that agent rolls it back and tells you.

This folder is never published to the site (see `.vercelignore` and `vercel.json`), but it is in the git repo.
Do not drop slides, transcripts or paid material here, and leave out platform and instructor names; write notes in your own words.
