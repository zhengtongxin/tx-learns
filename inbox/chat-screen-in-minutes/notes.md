# A chat screen in minutes (my notes)

Topic: Many models, one app. Planned item: "A chat screen in minutes". Concept lesson, ~15 min.

## Why Gradio
I do not want to learn front-end just to try my model. Gradio builds a web page from plain Python. Under the hood it starts a small web server and serves a page that calls my function.

## Three levels
1. `gr.Interface(fn, inputs, outputs)`: any function becomes a form. I started with a silly function that upper-cases text, then swapped in an LLM call. Handy options: `.launch(inbrowser=True)`, `share=True` for a temporary public link (careful: it exposes my laptop code), `auth=(user, password)` for a login (keep the password in .env, not in the notebook).
2. `gr.ChatInterface(fn)`: the function receives `(message, history)` and returns a string, or yields text so it streams.
3. `gr.Blocks()`: build my own layout: rows, columns, a chatbot, an image box, buttons, callbacks.

## The chat function (where "no memory" bites)
Remember models are stateless. Gradio hands me the history; I must rebuild the messages list every turn:
```python
def chat(message, history):
    messages = [{"role": "system", "content": system_message}] + history + [{"role": "user", "content": message}]
    stream = client.chat.completions.create(model=MODEL, messages=messages, stream=True)
    text = ""
    for chunk in stream:
        text += chunk.choices[0].delta.content or ""
        yield text
```
`yield` makes Gradio show words as they arrive. (Generator = a function that yields many times.)

## Prompts as product
I gave the assistant a system message for a neighbourhood shop: be friendly, nudge people to sale items, give one example reply (one-shot prompting). Then I changed the system message while testing (global variable, quick and dirty) and watched behaviour change. I also tried adding a rule in code: if the user's message mentions a word like "umbrella", append an extra sentence to the system message for that turn only. Context injected per message is the seed of RAG.

## What I got wrong
- Forgot that history items from Gradio carry extra keys; the API wants only role and content. Clean them first.
- Left share=True on and forgot it was public.

## Try it yourself
1. Add a dropdown that picks between two models.
2. Make the bot reply in a different tone based on a radio button.
3. Add a login.

## Takeaways
A UI is a function wrapper. ChatInterface gives you a chatbot in ten lines. You rebuild messages from history each turn. Yield to stream. System message = the product's personality. Injecting extra context per turn is cheap and powerful.
