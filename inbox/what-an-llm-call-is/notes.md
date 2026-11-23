# What an LLM call really is (my notes)

Topic: Talking to models. Planned item: "What an LLM call really is". This is lesson 1 of the AI Engineer track: foundations, no prior API experience assumed. About 15 min.

## What I finally understood
I used to think calling a model was something magic. It is not. It is one HTTP POST to a URL (an endpoint) with a JSON body: a model name and a list of messages. The answer comes back as JSON. That's it.

The OpenAI Python package is just a thin wrapper that builds this request for me. It has no model inside it. I had assumed it did.

## The shape of a call
Messages are a list of dicts, each with a role and content:
- system: who the model is and what tone to use (set once)
- user: the actual request
- assistant: what the model said before (used later to replay a chat)

```python
import os, requests
headers = {"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}", "Content-Type": "application/json"}
payload = {
    "model": "gpt-5-mini",
    "messages": [
        {"role": "system", "content": "You are a friendly market-stall helper."},
        {"role": "user", "content": "Give me one fun fact about durian."},
    ],
}
r = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
print(r.json()["choices"][0]["message"]["content"])
```

Same thing with the client library:
```python
from openai import OpenAI
client = OpenAI()
reply = client.chat.completions.create(model="gpt-5-mini", messages=payload["messages"])
print(reply.choices[0].message.content)
```

## The aha: one API shape, many providers
The chat-completions format was so popular that other providers copied it ("OpenAI-compatible endpoints"). So the same client works with another provider by changing only base_url and api_key. Even a model on my own laptop (Ollama, at http://localhost:11434/v1) speaks it:
```python
local = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
local.chat.completions.create(model="llama3.2", messages=[{"role":"user","content":"Tell me a fun fact"}])
```
Trade-off I noted: local = no API bill and data stays on my machine, but much weaker than the big cloud models. Don't pull a huge local model on a small laptop (pick a small size).

## Things that tripped me up
- API key problems: no key found, a stray space or newline at the start or end of the key, or the notebook ran before the .env was loaded. Check the key first, before blaming the code.
- Run notebook cells top to bottom or you get NameError.
- Models get retired every few months. Use a current one from the same provider when a model name stops working.
- A key is a password: keep it in a .env file, never in the notebook, never in git.

## Try it yourself
1. Send the raw HTTP call and print the JSON before taking the content out.
2. Repeat the same question through a second provider by changing only the base URL, key and model name.
3. Run a small local model and compare the answer quality and speed.

## Takeaways
A call is a POST. Messages are a list of role+content dicts. The client library is a wrapper. Many providers share one shape, so switching is cheap.
