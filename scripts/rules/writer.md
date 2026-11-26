# Writer rule packet (a short copy of STYLE.md and CLAUDE.md; open those two only if this is not enough)

Reader: a smart newcomer to AI. Voice: TX's, plain, "you", short sentences (one idea each, paragraphs of 3 or fewer).

Shape (succinct and sleek, key point first, roughly 600-1,000 words of prose per language): hero (tag `<Topic> · Lesson N` or `<Topic> · Project`, plain title (short noun phrase: 2-5 words EN, 4-10 characters 中文, no sentence, no colon, no trailing clause, no `Project:` prefix), one-line meta with `~N min · type`) → 2-4 steps `<h2>Step N · ...`, each Learn (`.teach`, key point first, 1-3 sentences or bullets) + Show (only the few code lines or the diagram that carry the point) + Test (`.try` predict or `.sc` game; at least one per lesson; every answer gets a one-line why) → optional one-or-two-sentence "What I got wrong" (`callout warn`) → "Now make it yours" (`.cl`, 2 things) → takeaways (`.card`, 3-5 bullets).

Story is optional and off by default: add one only if it makes the concept click faster; then 1-3 sentences, Singapore-set, on the point. No cast lists, no "Where we left off" / "What changed" / "Back at ..." boxes, no padding, recaps or hedging.

Rules:
- Key point first. Explain every term before using it. No wall of code: a box is about 25 lines at most. Every library, class, function, setting or environment variable is explained the first time it appears, in the Learn text or in a comment on that line. A project lesson names every key and account it needs and how to get the data.
- Build before use: no step's code calls anything a later step creates. Code boxes are complete enough to run (imports, right package names, `await` only where allowed).
- Every `.en` has a matching natural `.zh` (also in `{en,zh}` script strings). Widget code goes in `<track>/js/NN-slug.js`, never inline.
- Source-neutral: never name a platform, program, instructor or student; never write the C-word "course" / 课程; no week, day or "Project N" numbering; invent your own names, prompts and examples; rewrite code comments and variable names. Tool names (OpenAI, MCP...) are fine.
- No track-wide story or cast is required; each lesson stands alone.
- Counts are never typed: every number comes from `lessons.js`. Order is easiest first: topic `level` 1-3 never goes down the list.
- Start from `agentic-ai/_template.html`; fill `<title>`, description and `og:` tags.

Done when: `check-copy`, `check-counts`, `check-pages --fix` have run clean, and `.writer-summary.md` lists the title, file, topic, a 3-line story and open questions for TX.
