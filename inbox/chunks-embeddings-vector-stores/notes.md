# Chunks, embeddings and vector stores (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/14-chunks-embeddings-vector-stores.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'14-chunks-embeddings-vector-stores.html' to that item only.

Topic: Retrieval (RAG). Planned item: "Chunks, embeddings and vector stores". Concept lesson, ~20 min.

## Chunks
Whole documents are too big and too mixed. Split each one into pieces of about 1000 characters with a 200-character overlap, so a sentence cut at a boundary still appears whole in the neighbour. LangChain's recursive splitter tries paragraph breaks first, then sentences, then characters. Each chunk keeps metadata (which folder or file it came from).
I first measured: how many files, how many characters, how many tokens in total. If everything fits in the context window, ask whether RAG is needed at all.

## Embeddings
An embedding model turns text into a list of numbers (a vector, often 384 to 3072 numbers long) where texts with similar meaning land near each other. I tried a free small open model that runs locally and a paid hosted one. Both work; hosted is usually better and costs a little.

## Vector store
A database built for "which stored vectors are closest to this one?". I used Chroma, saved to a folder so I don't re-embed every time (rebuild by deleting the folder). I printed the count and the number of dimensions to see what I had.

## Seeing it
Squash the vectors into 2D or 3D with t-SNE and colour each point by document type. Chunks about the same topic cluster together, with fuzzy overlaps between related types. It made "meaning as location" click.

## What I got wrong
Changed the embedding model but kept the old store, so questions and chunks lived in different spaces and results were rubbish. One embedding model for both sides, always.

## Try it yourself
1. Re-chunk with 300 and with 3000 characters and compare retrieved results for the same question.
2. Plot your own documents in 2D.
3. Embed a question and print the three closest chunk titles.

## Takeaways
Chunk, embed, store. Overlap protects sentences. Same embedding model on both sides. Similar meaning = nearby vectors.
