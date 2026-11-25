# Writer rule packet (a short copy of STYLE.md and CLAUDE.md; open those two only if this is not enough)

Reader: a smart newcomer to AI. Voice: TX's, plain, "you", short sentences (one idea each, paragraphs of 3 or fewer).

Shape: hero (tag `<Topic> · Lesson N` or `<Topic> · Project`, plain title (short noun phrase: 2-5 words EN, 4-10 characters 中文, no sentence, no colon, no trailing clause, no `Project:` prefix), one-line meta with `~N min · type`) → `.story` with one named character and goal → "Where we left off" box (`callout thread`: Last time ___ could ___. Today it fails when ___. We fix it by ___.) → steps `<h2>Step N · ...` each with Learn (`.teach`, 2-4 sentences, one everyday analogy) + Show (small `.codebox`, changed lines in `.chg`, or a diagram) + Test (`.try` predict or `.sc` game; every answer gets a one-line why and a hint) → optional "What I got wrong" (`callout warn`, keep TX's real confusions) → "Now make it yours" (`.cl`, 2-3 things) → "What changed" box (`callout tip`: Now ___ can ___. The next problem is ___.) → takeaways (`.card`, 5-7 bullets).

Rules:
- Say why before how. Explain every term before using it. No wall of code.
- Build before use: no step's code calls anything a later step creates. Code boxes are complete enough to run (imports, right package names, `await` only where allowed).
- Every `.en` has a matching natural `.zh` (also in `{en,zh}` script strings). Widget code goes in `<track>/js/NN-slug.js`, never inline.
- Source-neutral: never name a platform, program, instructor or student; never write the C-word "course" / 课程; no week, day or "Project N" numbering; invent your own names, prompts and examples; rewrite code comments and variable names. Tool names (OpenAI, MCP...) are fine.
- Track setting: use `<track>/STORY.md` if it exists (never mix settings). AI Agentic uses the kopitiam cast (Uncle Lim, Auntie Suria, Aina, Ah Seng, Kak Ros, Uncle Rahim).
- Counts are never typed: every number comes from `lessons.js`. Order is easiest first: topic `level` 1-3 never goes down the list.
- Start from `agentic-ai/_template.html`; fill `<title>`, description and `og:` tags.

Done when: `check-copy`, `check-counts`, `check-pages --fix`, `search-index` have run clean, and `.writer-summary.md` lists the title, file, topic, a 3-line story and open questions for TX.
