# Lesson style guide

Every lesson on this site follows this guide. It exists so nobody has to ask twice for the human touch.
The model lessons are `agentic-ai/05-autonomy-and-tools.html`, `06-career-agent.html` and `07-agents-sdk-basics.html`.

## Who we write for

Two readers: TX, coming back months later to remember, and a friend who is new to AI.
Assume they are smart, busy and have never seen this topic. If a sentence needs a term, explain the term first.

## The shape of a lesson

1. **Hero.** Tag `<Topic> · Lesson N` (or `<Topic> · Project`), a plain title, and a meta line. **Titles are short noun phrases**: 2 to 5 words in English, about 4 to 10 characters in 中文, the key concept only, never a sentence, no colons, no trailing clause ("and ...", "for your ..."), and no "Project:" prefix (the Project chip already says so). Example: "Proving AI ROI", not "Proving the return: measurable ROI from AI":
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

## The running setting

Each track has its own setting. AI Agentic uses the kopitiam below; the AI Engineer track uses a Singapore HDB estate (see `ai-engineer/STORY.md`, which has its own cast, props and "Back at the void deck" callout). The AI FDE track uses a Tanjong Pagar shophouse insurer (`ai-fde/STORY.md`, "Back at the shophouse"). Never mix settings.

### The kopitiam thread (AI Agentic)

Kopi Corner, Uncle Lim's kopitiam in Singapore, is the recurring setting. Every lesson ends with one short "Back at the kopitiam" callout (`.callout tip`, EN and 中文) that ties its idea to the shop, just before the takeaways. Keep the cast and props the same:

- People: Uncle Lim (towkay), Auntie Suria (counter, remembers regulars), Aina (his niece, the builder), Ah Seng (drinks), Kak Ros (noodles), Uncle Rahim (mamak credit notebook).
- Props: the order pad (shared state), the chalkboard menu (tool list), the "ting!" bell (handoff), the QR sign (cashless payment), kopi, teh, kaya toast.
- A lesson's own story can use another setting. The callout is the bridge back.

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
- Never use week, day or "Project N" numbering from a source. Lessons are grouped by concept in each track's `lessons.js`.
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
- [ ] Added to the track's `lessons.js` with a `file`
- [ ] Widget code is in `<track>/js/NN-slug.js` (loaded after `assets/teach.js`), not an inline `<script>`
- [ ] `node scripts/check-copy.mjs`, `node scripts/check-counts.mjs` and `node scripts/check-pages.mjs --fix` pass (the last one also stamps the lesson's "updated" date)

## One story per track

Each track has one artifact that grows (AI Agentic: the Kopi Corner assistant; AI Engineer: the Block 12 helper; AI FDE: the claims desk pilot; AI Production: the wharf product). The plan is in each track's `STORY.md`. A lesson:

- opens with a **Where we left off** box (`<div class="callout thread">`): "Last time ___ could ___. Today it fails when ___. We fix it by ___.";
- keeps its own scenario as a side case when it is not the main thread, with one line tying it back;
- closes with a **What changed** box (`<div class="callout tip">`) in place of the old "Back at the ..." callout: "Now ___ can ___. The next problem is ___.", naming a concrete person or prop;
- shows each key idea as a small diagram (`<figure class="fig">` with inline SVG, `.box`/`.lnk` classes, a `<text class="en">` and `<text class="zh">` per label) where the lesson is mostly code.
