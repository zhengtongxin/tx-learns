# Story for the AI Agentic track

> **Names and setting to reuse, nothing more.** `STYLE.md` decides the shape of a lesson: a story is optional (1 to 3 sentences) and lessons have no "Where we left off", "What changed", "Back at ..." or "At the ..." boxes and no required thread from lesson to lesson. Any rule below that asks for those is retired and kept only as history.

One thread, one artifact: **the Kopi Corner assistant**. Aina (Uncle Lim's niece) builds it for Uncle Lim's kopitiam in Singapore. Every lesson adds one capability to the same assistant. The lesson's own scenario (Alex's twin, a plant shop, a tuition centre, a night market...) stays as a **side case**: the same pattern, tried somewhere else. The kopitiam assistant is the main line.

- **Cast:** Uncle Lim (towkay), Auntie Suria (counter, remembers regulars), Aina (builder), Ah Seng (drinks), Kak Ros (noodles), Uncle Rahim (mamak credit notebook). Add nobody new unless the lesson cannot be taught without a new role.
- **Constraint:** the assistant may never promise what the kopitiam cannot do, never spend money without Uncle Lim's say.
- **Success measure:** fewer missed or wrong orders, and regulars greeted by their usual.

| # | After this lesson the assistant can... | Next problem |
| --- | --- | --- |
| 1 | follow a written workflow for an order | it does the same thing every time, even when it should decide |
| 2 | choose a pattern (route, parallel, check) for a request | it cannot talk to a customer yet |
| 3 | answer a customer with a model call | one model and one provider is brittle and costly |
| 4 | switch provider and use a cheaper model for easy questions | it can only talk, not do |
| 5 | call tools: save an order, note a regular's preference | the tool loop is unproven on real questions |
| 6 | answer customers about the shop and hand over what it cannot answer | one agent does everything |
| 7 | be rebuilt on an agent SDK in far fewer lines | drinks and noodles need different specialists |
| 8 | hand off to Ah Seng's and Kak Ros's agents, with guardrails | it needs to write to regulars |
| 9 | draft the monthly note to regulars | replies are free text, hard to use in code |
| 10 | return clean structured orders, checked by a checker agent | it knows nothing outside the shop |
| 11 | research suppliers on the web | one agent does every role badly |
| 12 | run as a small crew with roles and tasks | which new outlet or menu? |
| 13 | research a market question as a team | the shop software needs maintaining |
| 14 | have a team write and test a small shop tool | flows get tangled |
| 15 | run its flow as a graph with shared state | the graph forgets between runs |
| 16 | keep memory, tools and web search inside the graph | needs one helper that truly remembers a person |
| 17 | remember each regular across visits | it cannot talk to the supplier's own agent |
| 18 | talk to another agent through a protocol | which framework to stay on |
| 19 | be compared across Python and JS/TS frameworks | frameworks hide what the loop does |
| 20 | run on a hand-written agent loop | every tool is wired by hand |
| 21 | see why a shared tool standard (MCP) helps | no server exists yet |
| 22 | expose the order pad as an MCP server and use it from a client | one server is not enough |
| 23 | plug in many MCP servers, local and remote | time to put everything together |
| 24 | combine model, tools, memory, graph, guardrails, evaluation and MCP in one final project | (the end) |

Rules for threading a lesson:
1. After the hero, a **Where we left off** box (`.callout.thread`): "Last time the assistant could ___. Today it fails when ___. We fix it by ___."
2. The lesson's own scenario stays; label it as a side case when it is not the kopitiam, with one line tying it back.
3. Replace "Back at the kopitiam" with a **What changed** box (`.callout.tip`): "Now the assistant can ___. The next problem is ___." Name a concrete person or prop; no generic "this could help a shop".
