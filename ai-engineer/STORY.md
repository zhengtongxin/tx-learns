# Story for the AI Engineer track

> **Names and setting to reuse, nothing more.** `STYLE.md` decides the shape of a lesson: a story is optional (1 to 3 sentences) and lessons have no "Where we left off", "What changed", "Back at ..." or "At the ..." boxes and no required thread from lesson to lesson. Any rule below that asks for those is retired and kept only as history.

Setting: Block 12, a heartland HDB estate in Singapore, with its void deck, heartland mall and bus interchange. (The AI Agentic track uses the Singapore kopitiam; do not mix them.)

Cast:
- Wei Jie: the builder. Runs a small phone-repair and IT counter at the heartland mall and teaches himself AI engineering so the estate can use it.
- Mdm Tan: runs the provision shop; practical, asks about price, quality and "will it break?".
- Uncle Raj: a retired bus captain who runs the void-deck noticeboard and announcements (notifications).
- Priya: tuition teacher; patient, loves examples and checking answers (evaluation).
- Ah Boy: reseller of second-hand gadgets online; knows prices by heart (datasets, price prediction).
- Auntie Lim: the town council clerk; keeps the thick files (documents, retrieval).

Props: the void-deck noticeboard, the bus PA announcement, the lift that stops at every floor, the EZ-Link tap-in gate, the thick town-council file, hand-written price tags, the aircon compressor that hums when busy (compute).

Rule: each lesson ends with one short "Back at the void deck" callout (.callout tip, EN and 中文) just before the takeaways, tying its idea to the estate.

## One thread: the Block 12 helper

Wei Jie builds one thing across the track: **the Block 12 helper**, an assistant for the estate. Each lesson adds one capability; a lesson's own example (stall brochure, price guesser...) is a side case on the same skills.

- Constraint: it must answer from real estate facts, never invent a price or a rule. Success: neighbours get a right answer first time, and Uncle Raj stops answering the same questions at the noticeboard.
- Arc by topic: (1) talking to models: it answers one notice question and learns what a call and context are; (2) many models, one app: it gets a chat screen, tools, and picks a model; (3) open-source models: it runs locally and cheaply; (4) choosing the model: benchmarks decide which one stays; (5) retrieval: it reads Auntie Lim's town-council file; (6) predicting with data: Ah Boy's price knowledge becomes a dataset and a guesser; (7) fine-tuning: the guesser gets better with LoRA; (8) a working agent system: it sits behind an API and scans, estimates and decides in one deal-hunting system.
- Every lesson: a **Where we left off** box after the hero ("Last time the helper could ___. Today it fails when ___. We fix it by ___.") and a **What changed** box replacing "Back at the void deck" ("Now the helper can ___. The next problem is ___."). Side-case lessons say in one line how they feed the helper.
