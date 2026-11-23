# Tokens, context and the illusion of memory (my notes)

Topic: Talking to models. Planned item: "Tokens, context and the illusion of memory". Lesson 2 of the AI Engineer track. About 15 min.

## Tokens
Models do not read letters or words. They read tokens: chunks of text turned into numbers. A common word is often one token; a rare word or a name splits into several. I use tiktoken to look at this:
```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
ids = enc.encode("Two teh tarik, one roti canai, less sugar please")
for i in ids:
    print(i, repr(enc.decode([i])))
```
Why I care: price is per token (in and out), and the context window is a limit counted in tokens. Spelling mistakes and rare words cost more tokens.

## The aha moment: a model has no memory
Every call is stateless. I told the model my name in one call, asked "what's my name?" in the next, and it had no idea. Of course: the second call never contained the first.

So the "memory" in a chat product is a trick. The app sends the whole conversation so far on every single turn:
```python
messages = [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hi, I'm Hafiz and I fix phones."},
    {"role": "assistant", "content": "Hi Hafiz! How can I help?"},
    {"role": "user", "content": "What do I do for a living?"},
]
```
The model just predicts the most likely next tokens. If the text says "I fix phones" earlier, the most likely answer to the question contains "fix phones".

## Consequences
- Each turn re-sends everything, so a long chat costs more with every turn.
- The context window is the cap. When the chat is too long, something must be dropped or summarised.
- Putting facts in the messages is how you give a model knowledge. This idea leads straight to RAG later.
- I write the loop myself: append the user message, call, append the assistant reply, repeat.

## What I got wrong
I thought the model "remembered" me between sessions. It does not. If a product seems to remember, the product stores it and sends it again.

## Try it yourself
1. Ask the same follow-up with and without the earlier turns and see the difference.
2. Count tokens of a short message and of the same message with typos.
3. Write a loop that keeps a chat history list and prints tokens used so far.

## Takeaways
Tokens are the unit of cost and of the context limit. Calls are stateless. Memory = replaying the conversation. You are the one who manages it.
