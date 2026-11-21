# TX Learns: rules for Claude

Bilingual (EN/中文) interactive learning site. Static HTML/CSS/JS, no build step. Deployed on Vercel.

## Layout

- `index.html` home page; `tracks.js` lists learning tracks (`window.TRACKS`).
- `inbox/` raw notes for the writer agent; never deployed (`.vercelignore`).
- `agentic-ai/` one track. `lessons.js` (`window.TRACK`) groups lessons into concept topics; a lesson with `file` is published, one without is "coming soon".
- `agentic-ai/NN-slug.html` one lesson per file; `_template.html` is the starting point.
- `assets/site.css|js` shared layout, nav, progress; `assets/teach.css|js` lesson widgets (`TX2.game`, `TX2.predict`, ...).
- `scripts/check-copy.mjs` + `banned-words.txt` the copyright scrubber.
- `scripts/notify-telegram.mjs` sends TX a Telegram message (secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; without the chat id it only sends a one-time setup tip).

## Agents (GitHub Actions)

| Workflow | Runs on | Does |
| --- | --- | --- |
| `copy-check.yml` | PRs into main/test, pushes to test | Runs the scrubber; fails and tells TX on Telegram |
| `review.yml` | PRs into main | Claude reviews against `STYLE.md`, comments once, Telegram summary. Never pushes |
| `writer.yml` | Pushes to `inbox/**` on test, or manual | Claude turns a notes folder into a lesson draft and opens a PR into test, Telegram link |
| `telegram-ping.yml` | Manual | Sends a test Telegram message |

## Rules

1. **Write every lesson to `STYLE.md`.** Read it before writing or editing a lesson. Do not wait to be reminded.
2. **Source-neutral, always.** No platform, program, instructor names, no "course"/课程, no week/day numbering, no copied examples. Run `node scripts/check-copy.mjs` before every commit; it must pass.
3. **Branches.** Work goes to `test` (Vercel builds a preview). `main` is the live site and changes only through a reviewed pull request from `test`.
4. **Agents notify before changing.** An agent never pushes straight to `main` or `test`. It opens a pull request or posts a comment, and TX merges.
5. Keep English and 中文 in step: every `.en` has a matching `.zh`.
6. No build tools or frameworks. Plain files that open from disk.

## Adding a lesson

Easiest: drop notes in `inbox/<concept>/` on test and let the writer agent draft it (see `inbox/README.md`). By hand:

1. Copy `agentic-ai/_template.html` to `agentic-ai/NN-slug.html` (next free number).
2. Write it to `STYLE.md`, with the tag `<Topic> · Lesson N`.
3. Add `file:'NN-slug.html'` to its item in `agentic-ai/lessons.js` (or add the item under the right topic).
4. Run `node scripts/check-copy.mjs`, then open the page in a browser and click every widget.
