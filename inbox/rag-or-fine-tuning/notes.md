# RAG or fine-tuning for your use case (notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-leader/09-rag-or-fine-tuning.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'09-rag-or-fine-tuning.html' to that item only (it is the item whose title matches: "RAG or fine-tuning for your use case").

Topic: Making the call with the tech team. Track story: STORY.md (Heng Huat Mart; end with the "Back at the mart" callout). This track has no code: use no code box; teach with a small diagram plus a decision widget (TX2.predict or TX2.game). Keep the lesson short, about 6 to 8 minutes.

## Goal
Choose between giving the model your documents at question time and training it further, using a simple test.

## Points
1. RAG (retrieval-augmented generation): look up the right passages from your own documents and hand them to the model with the question. Good when facts change, when you need sources, and when the answer lives in your files. Easy to update: change the document.
2. Fine-tuning: extra training on many examples so the model behaves a certain way: tone, format, a narrow skill. Good when the style or task is stable and you have hundreds or thousands of good examples. Slower to change and costs more to redo.
3. Quick test: if the problem is 'it does not know our facts', use RAG. If it is 'it does not behave the way we want', consider fine-tuning. Try better instructions and examples first; they are free.
4. They combine: retrieval for facts, a tuned model for voice.
5. Ask the team to show the same twenty questions answered each way.

## What I got wrong (common slip-ups; tell them through Mdm Rohani or Mr Tan)
- Fine-tuning to teach facts; facts go stale and are hard to remove.
- Skipping the cheap options: clearer instructions come first.
- Building RAG on messy, outdated documents.

## Try it yourself
Sort six needs into 'facts' or 'behaviour'. Mark which would use RAG, which fine-tuning, and which just needs a better prompt.

## Takeaways
Facts that change go in RAG; a stable style or skill may justify fine-tuning; try better instructions before either.

Written originally for this site; do not copy any outside slides, lecture or text.
