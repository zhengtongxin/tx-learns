# Lesson style guide

Every lesson on this site follows this guide. Succinct, sleek, key point first.

## Who we write for

Two readers: TX, coming back months later to remember, and a friend who is new to AI.
Assume they are smart, busy and have never seen this topic. If a sentence needs a term, explain the term first.

## The shape of a lesson

Succinct and sleek. Lead with the key point, then stop. A lesson should read in a few minutes.

1. **Hero.** Tag `<Topic> · Lesson N` (or `<Topic> · Project`), a plain title, and a meta line. **Titles are short noun phrases**: 2 to 5 words in English, about 4 to 10 characters in 中文, the key concept only, never a sentence, no colons, no trailing clause, no "Project:" prefix. Under it: one sentence on what the reader will be able to do, then time and type (`~10 min · hands-on`).
2. **Steps** (`<h2>Step N · ...`). Two to four steps. Each is:
   - **Learn** (`.teach`): the key point first, in 1 to 3 short sentences. A bullet list beats a paragraph. An analogy only if it makes the idea click faster.
   - **Show**: only the code or diagram that carries the point. Few lines.
   - **Test** (`.try` predict, or `.sc` sorting game): one per lesson is enough; add more only where they teach something new. Every answer gets a one-line "why".
3. **Story: optional.** Default is no story. Keep one only when it makes the concept click faster than plain words would. Then it is 1 to 3 sentences, Singapore-set, directly on the point, and does not need to continue from lesson to lesson. No cast lists, no "Where we left off", no "What changed", no "Back at ..." boxes.
4. **What I got wrong** (optional `.callout warn`, one or two sentences). Keep only a mistake that teaches.
5. **Now make it yours** (`.cl` checklist). Two things to try.
6. **Takeaways** (`.card`). Three to five bullets, one idea each.

**Length.** Aim for roughly 600 to 1,000 words of visible prose per lesson in each language (widget scripts excluded). Cut padding, repetition, hedging and recaps. Say each thing once, at the point it matters.

## Settings

There is no required running story or cast. A track may keep a short `STORY.md` for names it likes to reuse, but lessons never depend on it, and each lesson must make sense on its own. If a story is used, it is Singapore-set.

## Writing rules

- Key point first. Short sentences, one idea each. Paragraphs of two sentences or fewer; bullets where they help.
- Cut padding, repetition, hedging, recaps and scene-setting.
- Use "you". Plain words, like explaining to a friend, not documentation.
- Build before you use. Code in a step never calls a function, agent or variable that a later step creates. If the story needs it, build that piece in an earlier step.
- No walls of code. Show the few lines that matter; the rest is dimmed or left out.
- English and 中文 must say the same thing. Every `.en` block has a matching `.zh` block. Chinese should read naturally, not as a word-for-word translation.
- Every interactive piece works without a server and gives feedback on both right and wrong answers.

## Source-neutral rules (copyright)

The site records what TX learnt, in TX's own words. It never reproduces where it came from.

- Never name the platform, the paid program, its instructor or its students. Never write "course" / 课程.
- Never use week, day or "Project N" numbering from a source. Lessons are grouped by concept in each track's `lessons.js`.
- Never reuse a source's example names, characters, prompts, project names or datasets. Invent our own.
- Code may show standard library usage (that is how the tool works), but rewrite comments, variable names and prompts in our own words. No copied notebooks.
- No screenshots or slides from a source.
- Tool and product names (OpenAI, n8n, CrewAI, LangGraph, MCP) are fine: they are what we use, not where we learnt.
- `node scripts/check-copy.mjs` must pass. Its rules are in `banned-words.txt`.

## Checklist before a lesson is done

- [ ] Key point first; nothing that does not earn its place (no story unless it speeds understanding)
- [ ] Every step has Learn and Show, and the lesson has at least one Test
- [ ] A newcomer could follow it without the source
- [ ] EN and 中文 match
- [ ] Code runs as written (correct package names, imports, `await` placement)
- [ ] Nothing in the code is used before the step that builds it
- [ ] Added to the track's `lessons.js` with a `file`
- [ ] Widget code is in `<track>/js/NN-slug.js` (loaded after `assets/teach.js`), not an inline `<script>`
- [ ] `node scripts/check-copy.mjs`, `node scripts/check-counts.mjs` and `node scripts/check-pages.mjs --fix` pass (the last one also stamps the lesson's "updated" date)
