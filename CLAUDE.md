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

## Agents (GitHub Actions)

| Workflow | Runs on | Does |
| --- | --- | --- |
| `copy-check.yml` | PRs into main/test, pushes to test | Runs the scrubber (source names, and stray build files like `.pyc`) and the count check; fails and tells TX on Telegram. On a release PR into main, "Release waits for open fixes" turns red while an open PR into test changes one of the released pages |
| `review.yml` | PRs into main | Claude reviews against `STYLE.md`, comments once, Telegram summary. Never pushes |
| `writer.yml` | Pushes to `inbox/**` on test, or manual | Claude turns a notes folder into a lesson draft and opens a PR into test, Telegram link |
| `reader.yml` | Every finished Vercel preview deploy, or manual | Claude reads changed lessons as a newcomer, scores clarity, Telegram summary. On test it opens a fix PR into test only when a lesson scores under 8/10, and while a reader fix PR for that lesson is still open it comments there instead of opening another; elsewhere it comments |
| `ui-check.yml` | Every finished Vercel preview deploy, or manual | `scripts/ui-check.mjs` hovers, clicks and Tabs through every page in a headless browser (desktop + phone) and flags overlapping, covered (opening behind other content) or see-through popups, content wider than the screen and script errors (locally it serves a full fake `api/status` so popups are full size); Claude looks at screenshots of changed pages. Sets a `UI check` status, one PR comment, Telegram only when something is flagged. The browser and Claude run in a read-only job; a separate share job with trusted scripts from main does the writing |
| `telegram-ping.yml` | Manual | Sends a test Telegram message |

Claude auth: the writer, reviewer and reader use TX's Claude subscription through the `CLAUDE_CODE_OAUTH_TOKEN` secret (made with `claude setup-token`). `ANTHROPIC_API_KEY` is only a fallback when that secret is missing. Subscription runs share TX's plan usage limits.

## Rules

1. **Write every lesson to `STYLE.md`.** Read it before writing or editing a lesson. Do not wait to be reminded.
2. **Source-neutral, always.** No platform, program, instructor names, no "course"/课程, no week/day numbering, no copied examples. Run `node scripts/check-copy.mjs` and `node scripts/check-counts.mjs` before every commit; both must pass. Never type a topic or lesson count into a page.
3. **Branches.** Work goes to `test` (Vercel builds a preview). `main` is the live site and changes only through a reviewed pull request from `test`.
4. **Agents notify before changing.** An agent never pushes straight to `main` or `test`. It opens a pull request or posts a comment, and TX merges. The only thing agents push directly is the run log on the `agent-status` branch.
5. Keep English and 中文 in step: every `.en` has a matching `.zh`.
6. No build tools or frameworks. Plain files that open from disk.

## Adding a lesson

Easiest: drop notes in `inbox/<concept>/` on test and let the writer agent draft it (see `inbox/README.md`). By hand:

1. Copy `agentic-ai/_template.html` to `agentic-ai/NN-slug.html` (next free number).
2. Write it to `STYLE.md`, with the tag `<Topic> · Lesson N`.
3. Add `file:'NN-slug.html'` to its item in `agentic-ai/lessons.js` (or add the item under the right topic).
4. Run `node scripts/check-copy.mjs` and `node scripts/check-counts.mjs`, then open the page in a browser and click every widget.
