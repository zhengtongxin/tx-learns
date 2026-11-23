# TX Learns: rules for Claude

Bilingual (EN/中文) interactive learning site. Static HTML/CSS/JS, no build step. Deployed on Vercel.

## Layout

- `index.html` home page; `tracks.js` lists learning tracks (`window.TRACKS`).
- `ecosystem.html` the "How it works" page: one system diagram, six layers left to right (input, notes, AI agents, GitHub, Vercel, readers) with the numbered lesson path. Agents are the focus: each has its own colour (`hue` in `AGENTS`), a trigger line (`on`) and live status in its box, with full specs in one solid popup on hover (click pins it, Escape closes it); the plumbing stays grey. Telegram is a node in column 06 ("Telegram → me") and each agent box carries a paper plane: filled = it messages TX every run, hollow = only on a problem (`tg`/`tga` in `AGENTS`; keep true to the workflows' Telegram steps). The popup lives on `<body>`, outside the glass panels, so nothing paints over it, and there is only ever one. Agent details are not repeated anywhere else on desktop. Under the diagram come guardrails, each with a plain-language title, one number with its unit, what it stops, what that means and the agents it applies to by name (`G` array; keep its numbers true to the workflows). Agents are always named "... agent". Phones get an ordered list where tapping an agent opens its details in place (one at a time). Keep the agent specs in its `AGENTS` array true to `.github/workflows/`. It reads `api/status` (`api/status.js`, a Vercel function that needs the read-only token `STATUS_GITHUB_TOKEN` in Vercel env).
- `inbox/` raw notes for the writer agent; never deployed (`.vercelignore`).
- `agentic-ai/` one track. `lessons.js` (`window.TRACK`) groups lessons into concept topics; a lesson with `file` is published, one without is "coming soon".
- `agentic-ai/NN-slug.html` one lesson per file; `_template.html` is the starting point.
- `assets/site.css|js` shared layout, nav, progress; `assets/teach.css|js` lesson widgets (`TX2.game`, `TX2.predict`, ...).
- `scripts/check-copy.mjs` + `banned-words.txt` the copyright scrubber.
- `scripts/check-counts.mjs` the count check. `lessons.js` is the only source of truth for topic and lesson counts: pages compute them (`assets/site.js`), and the check fails on any count typed by hand, a lesson file missing from or doubled in `lessons.js`, or a tag that does not match its place.
- `scripts/record-status.mjs <agent>` records an agent's last run in `status/all.json` on the data-only `agent-status` branch (never deployed, never merged).
- `scripts/ui-check.mjs` the UI check agent's browser test. Run `node scripts/ui-check.mjs --pages <page.html>` after changing anything people hover, click or open (needs Playwright).
- `scripts/notify-telegram.mjs` sends TX a Telegram message (secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; without the chat id it only sends a one-time setup tip).
- `scripts/release.mjs run|digest` the release agent (hourly: release PR, gates, merge; daily digest). `DRY_RUN=1` writes nothing; `GITHUB_API` points it at a test server.
- `scripts/live-check.mjs --base <url>` the live check agent: every live page, lesson, link and file, rendered in a browser, counts against `lessons.js`.
- `scripts/recall.mjs plan|message` the recall agent: lessons due for spaced review (1, 3, 7, 14, 30... days after they went live) and the gaps.
- `scripts/lib.mjs` shared helpers for those three (GitHub calls, Telegram, `lessons.js`, scrubbing).
- `.github/rulesets/main-and-test.json` the branch rules for main and test (pull request only, `copy-check` and `UI check` must pass). Import it in Settings → Rules → Rulesets.

## Agents (GitHub Actions)

| Workflow | Runs on | Does |
| --- | --- | --- |
| `copy-check.yml` | PRs into main/test, pushes to test, or started by an agent after it pushes | Runs the scrubber (source names, and stray build files like `.pyc`) and the count check; fails and tells TX on Telegram. On a release PR into main, "Release waits for open fixes" turns red while an open PR into test changes one of the released pages |
| `writer.yml` | Pushes to `inbox/**` on test, or manual | Claude turns a notes folder into a lesson draft and opens the one PR for that lesson into test. Telegram only on failure |
| `reader.yml` | Every finished Vercel preview deploy, or manual | Claude reads changed lessons as a newcomer and scores clarity. On a lesson's own PR (`writer/` branch) it adds its fixes as one `Reader:` commit when a lesson scores under 8/10, comments, then starts the reviewer. Elsewhere it only comments; it skips merges of lesson PRs and agents' own fix commits. Telegram only on failure |
| `review.yml` | Started by the reader on a lesson PR, or by the release agent | Claude reviews against `STYLE.md` and comments once. On a lesson PR it adds its fixes as one `Reviewer:` commit and tells TX on Telegram the lesson is ready to approve. Each change is reviewed once: on a release it runs only when the release holds changes that never got a reviewer ✅ on their own PR (`focus` names those files), and that verdict, marked with the reviewed SHA, is a release gate. Claude runs read-only; a separate job writes |
| `ui-check.yml` | Every finished Vercel preview deploy, or manual | `scripts/ui-check.mjs` hovers, clicks and Tabs through every page in a headless browser (desktop + phone) and flags overlapping, covered (opening behind other content) or see-through popups, content wider than the screen and script errors (locally it serves a full fake `api/status` so popups are full size); Claude looks at screenshots of changed pages. Sets a `UI check` status, one PR comment, Telegram only when something is flagged. The browser and Claude run in a read-only job; a separate share job with trusted scripts from main does the writing |
| `release.yml` | Every hour at :00, or manual (`run` or `digest`; `dry` = trial that changes nothing, and a manual run uses the scripts of the branch it was started on) | Opens or updates the release PR test → main, starts the copy check (and the reviewer for changes never reviewed) once per commit, and merges it only if there is no `hold` label, the newest commit has waited 60 minutes in the PR, every check and the `UI check` status on the exact commit passed, every changed file came only from PRs with a reviewer ✅ (otherwise the reviewer reads the release and its verdict for that commit must be ✅), and no open PR into test changes a released page. While checks run it waits quietly; a held release gets one Telegram message per new reason (state is a hidden `<!-- tx-release {...} -->` note in the PR body). After a real release it runs `live-check.yml` (chained job). The 12:00 UTC run (8 PM Malaysia time) also sends the daily digest |
| `live-check.yml` | Called by `release.yml` right after each real release (no release, no check), or manual | Waits up to 15 minutes for Vercel's production deploy of the release commit, then `scripts/live-check.mjs` on the live site. Telegram only when something is off; a cancelled run sends nothing and records nothing |
| `recall.yml` | Sundays 9 AM Malaysia time (01:00 UTC), or manual | Weekly Telegram: lessons due for spaced review with two questions each (Claude, read-only), and the gaps |
| `telegram-ping.yml` | Manual | Sends a test Telegram message |

Telegram: one digest a day at 8 PM. Instant messages only for failures, a held release, a lesson ready to approve, and the weekly review.
Pushes and PRs made with the workflow token start no workflows, so an agent that pushes starts `copy-check.yml` on that branch itself (`gh workflow run`), and the release agent starts the reviewer and copy check on its release PR.

Claude auth: the writer, reviewer, reader, UI check and recall agents use TX's Claude subscription through the `CLAUDE_CODE_OAUTH_TOKEN` secret (made with `claude setup-token`). `ANTHROPIC_API_KEY` is only a fallback when that secret is missing. Subscription runs share TX's plan usage limits.

## Rules

1. **Write every lesson to `STYLE.md`.** Read it before writing or editing a lesson. Do not wait to be reminded.
2. **Source-neutral, always.** No platform, program, instructor names, no "course"/课程, no week/day numbering, no copied examples. Run `node scripts/check-copy.mjs` and `node scripts/check-counts.mjs` before every commit; both must pass. Never type a topic or lesson count into a page.
3. **Branches.** Work goes to `test` (Vercel builds a preview). `main` is the live site and changes only through the release pull request from `test`, merged by the release agent (it looks every hour) when everything is green. TX never needs to merge it.
4. **Agents notify before changing.** An agent never pushes straight to `main` or `test`. TX approves every lesson by merging its one pull request into `test`. Agents push directly only to the `agent-status` run log and, as fixes, to a lesson's own `writer/` draft branch before TX merges it. The release agent merges the release pull request only after its newest commit has waited an hour in it, so TX can add `hold`.
5. Keep English and 中文 in step: every `.en` has a matching `.zh`.
6. No build tools or frameworks. Plain files that open from disk.

## Adding a lesson

Easiest: drop notes in `inbox/<concept>/` on test and let the writer agent draft it (see `inbox/README.md`). By hand:

1. Copy `agentic-ai/_template.html` to `agentic-ai/NN-slug.html` (next free number).
2. Write it to `STYLE.md`, with the tag `<Topic> · Lesson N`.
3. Add `file:'NN-slug.html'` to its item in `agentic-ai/lessons.js` (or add the item under the right topic).
4. Run `node scripts/check-copy.mjs` and `node scripts/check-counts.mjs`, then open the page in a browser and click every widget.
