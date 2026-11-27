# tx-learns

Bilingual (EN/中文) interactive learning site. Static HTML/CSS/JS, no build step, deployed on Vercel. Live site: https://tx-learns.vercel.app/

- Lessons follow [`STYLE.md`](STYLE.md). The full repo rules (for people and for Claude) are in [`CLAUDE.md`](CLAUDE.md).
- `banned-words.txt` holds only generic copyright rules. Names of platforms and instructors are never written in this repo.

## Contributor commands

Everything runs with plain Node 22. Nothing needs installing except the browser checks.

| Command | What it does |
| --- | --- |
| `node scripts/check-copy.mjs` | Copyright scrubber and stray build files |
| `node scripts/check-counts.mjs` | Topic and lesson counts, lesson list and tags must match each track's `lessons.js` |
| `node scripts/check-pages.mjs` | Page check: lang, title, description, link previews, alt text, headings, EN/中文 twins, no script loaded twice, sitemap, canonical links, JSON-LD, `?v=` hashes, `vercel.json` |
| `node scripts/check-pages.mjs --fix` | Rewrites everything the page check generates. Never edit those parts by hand |
| `node scripts/check-pages.mjs <page.html>` | Checks only the named pages |
| `node scripts/check-security.mjs` | Secrets, unsafe links, outside scripts, untrusted text in workflow `run:` lines |
| `node scripts/check-code.mjs [lessons]` | Syntax-checks lesson code boxes (a note, not a gate) |
| `node scripts/run-evals.mjs` | Golden cases for the checks above. Add a case whenever you add a check rule |
| `node scripts/ui-check.mjs --pages <page.html>` | Hover, click and Tab through a page in a headless browser (needs Playwright) |
| `node scripts/ui-check.mjs --fit --pages <page.html>` | The quick phone check (390px): content wider than the screen, popups off the side |
| `node scripts/test-status.mjs` | Isolated API tests: accurate attention ownership/recovery, safe links, stale data, timeouts and cache limits (no network) |
| `node scripts/test-ecosystem.mjs` | Attention cards, polling, history, bilingual states, safe links and all compact agent popups on desktop and phone (needs Playwright) |
| `node scripts/test-site.mjs` | Behaviour tests for `assets/site.js`: language, theme, progress, feedback, no outside requests (needs Playwright) |
| `node scripts/daily-scan.mjs drift` | The docs check: `CLAUDE.md` and this file still match the workflows, scripts, tracks and agents |
| `node scripts/daily-scan.mjs smoke --pkg packages/<track>/<name>` | Smoke-run one project package: it parses, its requirements install, its imports exist |

Before every commit run the copy, count and page checks; all three must pass. Every change is a pull request into `main`; never push to `main`.

## How it is built

```
index.html, ecosystem.html, glossary.html, about.html   site pages
tracks.js                    the learning tracks (window.TRACKS): entry points, the path, and what follows each track
tracks-index.js              generated: every track's lesson files and titles in one file
<track>/lessons.js           topics and lessons of one track (the only source of counts)
<track>/NN-slug.html         one lesson per file, widgets in <track>/js/NN-slug.js
assets/site.css|js           shared layout, nav, progress
assets/teach.css|js          lesson widgets
packages/<track>/NN-slug/    each project's starter and final code
scripts/                     checks and agent scripts (no build tools)
evals/                       golden cases for the checks
inbox/                       raw notes for the content agent (notes branch only)
```

Order is easiest first: each track and topic has a `level` (1 to 3) that never decreases down the list.

## How the automation works

Agents run as GitHub Actions workflows in `.github/workflows/`. The "How it works" page (`ecosystem.html`) draws the whole system and keeps each agent's spec; `CLAUDE.md` has the table of workflows.

1. Notes go to `inbox/<concept>/` on the data-only `notes` branch. The writer agent turns them into a lesson draft and opens one pull request into `main`.
2. Every pull request gets the same checks: copy check (scrubber, security, counts, pages and the phone fit), a backend review that sets the required `Reviewer` status, and a scope guard that compares what the diff does with what the description says.
3. Auto-merge merges a pull request once `copy-check` and `Reviewer` are green on its newest commit. The UI check and live check run after the merge.
4. If a merge breaks the live site, the live check agent opens a `Rollback:` pull request that puts `main` back.
5. Every day the QA engineer agent's scan (`daily-scan.yml`) reads what readers did, smoke-runs one project package, checks the docs, a speed budget and reworked files. Lessons readers marked unclear go to the improvement engineer agent.
6. Telegram gets one digest a day and an instant message only for a failure, a rollback or a stuck pull request.

Pull requests that change auto-merge itself (`auto-merge.yml`, `scripts/auto-merge.mjs`, the ruleset in `.github/rulesets/`) wait for the owner to merge them. Everything else merges by itself.

## Moving or renaming a page

A published URL is never deleted. Move the file, add a `from`/`to` entry to `scripts/redirects.json`, update `lessons.js`, then run `node scripts/check-pages.mjs --fix`.
