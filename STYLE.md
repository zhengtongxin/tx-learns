# Lesson style guide

Every lesson on this site follows this guide. It exists so nobody has to ask twice for the human touch.
The model lessons are `agentic-ai/05-autonomy-and-tools.html`, `06-career-agent.html` and `07-agents-sdk-basics.html`.

## Who we write for

Two readers: TX, coming back months later to remember, and a friend who is new to AI.
Assume they are smart, busy and have never seen this topic. If a sentence needs a term, explain the term first.

## The shape of a lesson

1. **Hero.** Tag `<Topic> · Lesson N` (or `<Topic> · Project`), a plain title, and a meta line:
   one sentence on what changes for the reader, then time and type (`~20 min · hands-on`).
2. **The story** (`.story`). One running example with a named character and a concrete goal.
   Every step moves that same example forward. Pick our own names and situations, never the source's.
3. **Steps** (`<h2>Step N · ...`). Each step is:
   - **Learn** (`.teach`): the idea in 2 to 4 short sentences, with one everyday analogy when it helps.
   - **Show**: a small code box (`.codebox`, with the changed lines in `.chg`) or a diagram.
   - **Test** (`.try` predict, or `.sc` sorting game): the reader commits to an answer before seeing it.
     Every answer gets a one-line "why" and a hint for the wrong choice.
4. **What I got wrong** (optional `.callout warn`). A real mistake TX made and how it was fixed.
5. **Now make it yours** (`.cl` checklist). Two or three things to try on their own.
6. **Takeaways** (`.card`). Five to seven bullets, one idea each.

## Writing rules

- Short sentences, one idea each. Paragraphs of three sentences or fewer.
- Say why before how. Open each step with the problem it solves.
- Use "you". Write like you are explaining to a friend next to you, not like documentation.
- Build before you use. Code in a step never calls a function, agent or variable that a later step creates. If the story needs it, build that piece in an earlier step.
- No walls of code. Show the few lines that matter; the rest is dimmed or left out.
- English and 中文 must say the same thing. Every `.en` block has a matching `.zh` block. Chinese should read naturally, not as a word-for-word translation.
- Every interactive piece works without a server and gives feedback on both right and wrong answers.

## Source-neutral rules (copyright)

The site records what TX learnt, in TX's own words. It never reproduces where it came from.

- Never name the platform, the paid program, its instructor or its students. Never write "course" / 课程.
- Never use week, day or "Project N" numbering from a source. Lessons are grouped by concept in `agentic-ai/lessons.js`.
- Never reuse a source's example names, characters, prompts, project names or datasets. Invent our own.
- Code may show standard library usage (that is how the tool works), but rewrite comments, variable names and prompts in our own words. No copied notebooks.
- No screenshots or slides from a source.
- Tool and product names (OpenAI, n8n, CrewAI, LangGraph, MCP) are fine: they are what we use, not where we learnt.
- `node scripts/check-copy.mjs` must pass. Its rules are in `banned-words.txt`.

## Checklist before a lesson is done

- [ ] One running story from start to end
- [ ] Every step has Learn, Show and Test
- [ ] A newcomer could follow it without the source
- [ ] EN and 中文 match
- [ ] Code runs as written (correct package names, imports, `await` placement)
- [ ] Nothing in the code is used before the step that builds it
- [ ] Added to `agentic-ai/lessons.js` with a `file`
- [ ] `node scripts/check-copy.mjs`, `node scripts/check-counts.mjs` and `node scripts/check-pages.mjs --fix` pass (the last one also stamps the lesson's "updated" date)
