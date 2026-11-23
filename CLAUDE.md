# TX Learns: rules for Claude

Bilingual (EN/中文) interactive learning site. Static HTML/CSS/JS, no build step. Deployed on Vercel.

## Layout

- `index.html` home page; `tracks.js` lists learning tracks (`window.TRACKS`).
- `ecosystem.html` the "How it works" page: one system diagram, six layers left to right (input, notes, AI agents, GitHub, Vercel, readers) with the numbered lesson path. Agents are the focus: each has its own colour (`hue` in `AGENTS`), a trigger line (`on`) and live status in its box (yellow pulsing while a run is working, then green/orange/red for passed/flagged/failed; red only for a real failure), with full specs in one solid popup on hover (click pins it, Escape closes it); the plumbing stays grey. Telegram is a node in column 06 ("Telegram → me") and each agent box carries a paper plane: filled = it messages TX every run, hollow = only on a problem (`tg`/`tga` in `AGENTS`; keep true to the workflows' Telegram steps). The popup lives on `<body>`, outside the glass panels, so nothing paints over it, and there is only ever one. Agent details are not repeated anywhere else on desktop. Under the diagram come guardrails, each with a plain-language title, one number with its unit, what it stops, what that means and the agents it applies to by name (`G` array; keep its numbers true to the workflows). Agents are always named "... agent". Phones get an ordered list where tapping an agent opens its details in place (one at a time). Keep the agent specs in its `AGENTS` array true to `.github/workflows/`. It reads `api/status` (`api/status.js`, public, so it passes on only each known agent's state, time, run count and plain summary: no links, branch names or error details; a Vercel function that needs the read-only token `STATUS_GITHUB_TOKEN` in Vercel env).
- `inbox/` raw notes for the writer agent. New notes go to `inbox/<concept>/` on the data-only `notes` branch (create it from main if it is missing; never merged, never deployed: `vercel.json`); `inbox/` is never deployed from main either (`.vercelignore`).
- `agentic-ai/` and `ai-engineer/` are tracks (one folder each, listed in `tracks.js`; the folder name is the track id). `ai-engineer/STORY.md` holds that track's own setting (a night market). Scripts and agents read every track from `tracks.js`; numbering (`NN-slug.html`, `Lesson N`) is per track. `lessons.js` (`window.TRACK`) groups lessons into concept topics; a lesson with `file` is published, one without is "coming soon".
- `agentic-ai/NN-slug.html` one lesson per file; `_template.html` is the starting point.
- `assets/site.css|js` shared layout, nav, progress; `assets/teach.css|js` lesson widgets (`TX2.game`, `TX2.predict`, ...).
- `scripts/check-copy.mjs` + `banned-words.txt` the copyright scrubber.
- `scripts/check-counts.mjs` the count check. `lessons.js` is the only source of truth for topic and lesson counts: pages compute them (`assets/site.js`), and the check fails on any count typed by hand, a lesson file missing from or doubled in `lessons.js`, or a tag that does not match its place.
- `scripts/check-pages.mjs` the page check: every page has `<html lang>`, a title, a meta description and `og:` link-preview tags, alt text on images, headings that never skip a level, and as many `.en` as `.zh` (in markup and in `{en,zh}` script strings). It also keeps `sitemap.xml`, the no-JavaScript lesson list on the track page (between `<!-- lessons:start -->` markers) and the `data-start` links in step with `lessons.js`: `--fix` rewrites them, never by hand. Each lesson also carries `<meta name="updated">`, shown as "Updated ...": `--fix` sets it to today when the lesson's text changed since the last commit. Runs in the copy check.
- `404.html` (uses `<base href="/">`), `robots.txt`, `favicon.ico`, `assets/icon.svg`, `assets/apple-touch-icon.png`, `assets/og.png` (link previews).
- `scripts/record-status.mjs <agent>` records an agent's last run (`STATE=run` marks it working, `idle` clears that mark; each workflow's `working` job sets it, and cancelled runs record nothing) in `status/all.json` on the data-only `agent-status` branch (never deployed, never merged).
- `scripts/ui-check.mjs` the UI check agent's browser test. Run `node scripts/ui-check.mjs --pages <page.html>` after changing anything people hover, click or open (needs Playwright).
- `scripts/notify-telegram.mjs` sends TX a Telegram message (secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; without the chat id it only sends a one-time setup tip).
- `scripts/digest.mjs` the daily Telegram digest (what went live, rollbacks, what waits for TX, agent runs). `DRY_RUN=1` prints instead of sending; `GITHUB_API` points it at a test server.
- `scripts/live-check.mjs --base <url>` the live check agent's script: every live page, lesson, link and file, rendered in a browser, counts against `lessons.js`.
- `scripts/recall.mjs plan|message` the recall agent: lessons due for spaced review (1, 3, 7, 14, 30... days after they went live) and the gaps; `models` lists the AI model names lessons use, for the monthly outdated-model check.
- `scripts/lib.mjs` shared helpers for the digest, live check and recall scripts (GitHub calls, Telegram, `lessons.js`, scrubbing).
- `.github/rulesets/main.json` the branch rules for main (pull request only; `copy-check`, `UI check` and `Reviewer` must pass on the exact commit). Import it in Settings → Rules → Rulesets.

## Agents (GitHub Actions)

| Workflow | Runs on | Does |
| --- | --- | --- |
| `copy-check.yml` | PRs into main, or started by an agent after it pushes | Runs the scrubber (source names, and stray build files like `.pyc`), the count check and the page check; fails and tells TX on Telegram |
| `writer.yml` | Pushes to `inbox/**` on the `notes` branch (handed over to main's copy), or manual (`folder`) | Claude turns a notes folder into a lesson draft, drops any scratch files it made outside `agentic-ai/`, `assets/` and `inbox/`, and opens the one PR for that lesson into main. Telegram only on failure |
| `reader.yml` | Every finished Vercel preview deploy, or manual | Claude reads changed lessons as a newcomer and scores clarity. On a lesson's own PR (`writer/` branch) it adds its fixes as one `Reader:` commit when a lesson scores under 8/10, comments, then starts the reviewer. Elsewhere it only comments; it skips merges of lesson PRs and agents' own fix commits. Telegram only on failure |
| `review.yml` | Started by the reader on a lesson PR; every other PR into main when it opens or gets a commit; or manual | Claude reviews against `STYLE.md` and comments once, and sets the required `Reviewer` status (green only for ✅) on the exact commit it read. On a lesson PR it adds its fixes as one `Reviewer:` commit (marked too) and tells TX on Telegram the lesson is ready to approve; on other PRs Telegram only on ⚠️. A later hand edit needs a new review. Claude runs read-only; a separate job writes |
| `ui-check.yml` | Every finished Vercel preview deploy, or manual | `scripts/ui-check.mjs` hovers, clicks and Tabs through every page in a headless browser (desktop + phone) and flags anything clickable that Tab cannot reach, overlapping, covered (opening behind other content) or see-through popups, content wider than the screen and script errors (locally it serves a full fake `api/status` so popups are full size); Claude looks at screenshots of changed pages. Sets a `UI check` status, one PR comment, Telegram only when something is flagged. The browser and Claude run in a read-only job; a separate share job with trusted scripts from main does the writing |
| `live-check.yml` | Every push to main (each merge), or manual | Waits up to 15 minutes for Vercel's production deploy of that commit, then `scripts/live-check.mjs` on the live site. If the merge broke a site that was fine before (last live check passed, deploy succeeded), the rollback job opens a `Rollback:` PR that reverts it, sets its `Reviewer` status, merges it as soon as the checks allow (up to 20 minutes, else TX gets the link) and checks the site again. One Telegram message; a cancelled run sends nothing and records nothing. Manual runs never roll back |
| `digest.yml` | Daily 8 PM Malaysia time (12:00 UTC), or manual | `scripts/digest.mjs`: the one daily Telegram digest |
| `recall.yml` | Sundays 9 AM Malaysia time (01:00 UTC), or manual | Weekly Telegram: lessons due for spaced review with two questions each (Claude, read-only), and the gaps. On the first Sunday of the month (or manual `models: true`) Claude also web-searches which model names in lessons are outdated |
| `telegram-ping.yml` | Manual | Sends a test Telegram message |

Telegram: one digest a day at 8 PM. Instant messages only for failures, a rollback, a lesson ready to approve, a ⚠️ review, and the weekly review.
Pushes and PRs made with the workflow token start no workflows, so an agent that pushes starts `copy-check.yml` on that branch itself (`gh workflow run`), the reader starts the reviewer, and the writer hands notes over with `gh workflow run writer.yml --ref main`.

Claude auth: the writer, reviewer, reader, UI check and recall agents use TX's Claude subscription through the `CLAUDE_CODE_OAUTH_TOKEN` secret (made with `claude setup-token`). `ANTHROPIC_API_KEY` is only a fallback when that secret is missing. Subscription runs share TX's plan usage limits. Models are pinned to keep usage low: the writer and reviewer use `sonnet`, the reader, UI check and recall use `haiku` (`--model` on each `claude -p`). Interactive Claude sessions use the same plan. Prompt caching is automatic in `claude -p` (system prompt, tools and the growing conversation are cached within a run); every `claude -p` also passes `--exclude-dynamic-system-prompt-sections` so the cached start is the same between runs. The reader reads at most 6 lessons per run.

## Rules

1. **Write every lesson to `STYLE.md`.** Read it before writing or editing a lesson. Do not wait to be reminded.
2. **Source-neutral, always.** No platform, program, instructor names, no "course"/课程, no week/day numbering, no copied examples. Run `node scripts/check-copy.mjs`, `node scripts/check-counts.mjs` and `node scripts/check-pages.mjs` before every commit; all must pass. Never type a topic or lesson count into a page.
3. **Branches.** Every change is a pull request into `main` (Vercel builds its own preview; that is the test). `main` is the live site. TX merges once the copy check, the UI check and the reviewer agent's ✅ are green. There is no `test` branch and no release step. If a merge breaks the live site, the live check agent rolls it back.
4. **Agents notify before changing.** An agent never pushes straight to `main`. TX approves every change by merging its one pull request. Agents push directly only to the `agent-status` run log, the `notes` branch (notes only) and, as fixes, to a lesson's own `writer/` draft branch before TX merges it. The only merge an agent makes is a `Rollback:` pull request that puts main back to the reviewed state before a merge that broke the live site.
5. Keep English and 中文 in step: every `.en` has a matching `.zh`.
6. No build tools or frameworks. Plain files that open from disk.

## Adding a lesson

Easiest: drop notes in `inbox/<concept>/` on the `notes` branch and let the writer agent draft it (see `inbox/README.md`). Notes for a track other than `agentic-ai` carry a one-line `TRACK` file with the track id. By hand:

1. Copy `agentic-ai/_template.html` to `<track>/NN-slug.html` (next free number in that track).
2. Write it to `STYLE.md`, with the tag `<Topic> · Lesson N`.
3. Add `file:'NN-slug.html'` to its item in `<track>/lessons.js` (or add the item under the right topic), then run `node scripts/check-pages.mjs --fix` (it also stamps the lesson's updated date).
4. Fill in the `<title>`, description and `og:` tags, run `node scripts/check-copy.mjs`, `node scripts/check-counts.mjs` and `node scripts/check-pages.mjs`, then open the page in a browser and click every widget.
