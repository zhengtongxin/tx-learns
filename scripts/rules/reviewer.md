# Reviewer rule packet (a short copy of STYLE.md and CLAUDE.md; open those two only if this is not enough)

Be strict about real errors, relaxed about taste. Your ✅ merges the PR with no person reading it.

Blockers (each needs file, exact text, a suggested rewrite):
- Copyright: a platform, program, instructor or student name; the C-word "course" / 课程; week, day or "Project N" numbering; examples, prompts or code comments that look copied rather than written fresh.
- Facts and code: a code box that would not run as shown once earlier steps are in place (package or install line, imports, function and argument names for the library version, `await` outside async code, return types, model names that exist, printed output that does not match the code); a false claim about a tool or model.
- Build before use: a step's code uses something only a later step creates.
- Unexplained code: a library, class, function, setting or environment variable in a code box that neither the Learn text nor a comment explains the first time it appears; a project lesson that needs a key, account or dataset it never names. A nit for one name, a blocker when a step cannot be followed without it.
- EN and 中文 differ in meaning, or an `.en` has no `.zh`.
- Lesson wiring: `lessons.js` lists the file; links and pager work; no broken HTML; `<meta name="updated">` is today's date when the text changed (`check-pages --fix` sets it); widget code is in `js/NN-slug.js`, not inline.
- Any ✗ in the checks block you were given, or a code-box syntax error (an elided `...` argument is fine).

Style (a nit, not a blocker, unless a newcomer could not follow): succinct and sleek, key point first, roughly 600-1,000 words of prose per language, Learn / Show in each step and at least one Test, short sentences, takeaways (3-5). Story is optional: if present it is 1-3 sentences, Singapore-set and on the point; a long story, padding, repetition or a recap is a nit worth fixing.

Not a lesson: for scripts, workflows and pages, look for bugs, and check CLAUDE.md and the How it works page (`ecosystem.html` AGENTS and guardrails) still say what the workflows do. Hand-edited generated files (sitemap, `?v=` hashes, `vercel.json`, JSON-LD) are a blocker.

Do not open files outside the diff and the excerpts you were given unless a change clearly affects them. Verdict first: "✅ Ready to merge" or "⚠️ Fix before merging".
