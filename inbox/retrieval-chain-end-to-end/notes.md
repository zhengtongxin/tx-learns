# A retrieval chain end to end (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/15-retrieval-chain-end-to-end.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'15-retrieval-chain-end-to-end.html' to that item only.

Topic: Retrieval (RAG). Planned item: "A retrieval chain end to end". Concept lesson, ~15 min.

## Surprise: it is short
After chunking and storing, answering a question is about ten lines.
```python
retriever = vectorstore.as_retriever()          # top few similar chunks
llm = ChatOpenAI(temperature=0, model=MODEL)

def answer(question, history):
    docs = retriever.invoke(question)
    context = "\n\n".join(d.page_content for d in docs)
    system = TEMPLATE.format(context=context)   # "use this context; if you don't know, say so"
    msgs = [("system", system)] + history + [("user", question)]
    return llm.invoke(msgs).content
```
Put it behind `gr.ChatInterface(answer)` and I have a company chatbot.

## Pieces to remember
- Retriever and LLM objects both have `.invoke()`. LangChain mostly gives me a common shape.
- Temperature is how adventurous the next-token pick is. For fact answering use 0.
- The prompt needs a rule: answer from the context; say "I don't know" otherwise.
- I can still pass the whole history, so follow-up questions work. But retrieval uses only the latest question, so "and what about her manager?" retrieves nothing useful. That motivates rewriting the query (later lesson).

## What I got wrong
Believed RAG needed a big framework. The framework only saves a few lines; the idea is "search, paste, answer".

## Try it yourself
1. Ask a question that is answered in the documents, one that isn't, and a follow-up with a pronoun. Note which fail.
2. Change how many chunks are fetched (k) and watch quality and cost.
3. Print the retrieved chunks beside each answer so you can see where it came from.

## Takeaways
Retrieval chain = retriever + prompt + model. Temperature 0 for facts. Follow-up questions are the weak spot.
