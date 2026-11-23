# Comparing frontier and local models (my notes)

Topic: Many models, one app. Planned item: "Comparing frontier and local models". Concept lesson, ~15 min. Builds on "What an LLM call really is".

## The idea
One client, many providers. Because most providers copy the chat-completions shape, I keep one helper and only swap base_url, key and model name. Providers I tried: OpenAI, Anthropic, Google, DeepSeek, Groq, Grok, and a local Ollama. Anthropic and Google both expose an OpenAI-compatible URL, so the same `OpenAI(base_url=..., api_key=...)` object works.

```python
clients = {
  "cloud-a": OpenAI(),
  "cloud-b": OpenAI(base_url="https://<provider>/v1/", api_key=KEY_B),
  "local":   OpenAI(base_url="http://localhost:11434/v1", api_key="ollama"),
}
def ask(which, model, prompt, **extra):
    r = clients[which].chat.completions.create(model=model, messages=[{"role":"user","content":prompt}], **extra)
    return r.choices[0].message.content
```

## What I tried
1. A joke prompt on two providers: easy, tells me nothing. Differences show only on hard prompts.
2. A trick probability puzzle (two coins, one is heads, chance the other is tails). A small model with no thinking gets it wrong; give it a "reasoning effort" setting (low) and it fixes itself; a bigger reasoning model gets it right. So there are two dials: a bigger model (training-time scale) and more thinking before answering (inference-time scale). More thinking costs more tokens and time.
3. A riddle with a trap (a worm gnawing through two books on a shelf: the covers and page order are the trick). Several top models fall for the obvious reading; the ones that "think" don't.
4. A game-theory prompt (cooperate or betray, with money at stake) sent to many providers. Same question, different personalities and different reasoning. Fun, but opinion, not measurement.
5. Local: `ollama pull llama3.2`, then point the client at localhost. Rule: never pull a model bigger than the laptop's memory (16 GB laptop is fine for ~20B-sized open models; small laptop use a 1B-3B size).

## What I got wrong
I assumed "newest model" always means "best answer". On easy tasks a cheap fast model is the same; on tricky ones the thinking dial matters more than the logo.

## Try it yourself
1. Ask the same tricky question to a small model with no reasoning, then with low reasoning effort; compare answer, time and tokens.
2. Add a third provider using only a new base_url and key.
3. Add a timer around each call and print a small table: model, seconds, answer length.

## Takeaways
One helper, many providers. Two dials: model size and thinking effort. Cost and speed matter as much as the answer. Local = free and private but weaker. Opinions from a few prompts aren't a benchmark (that comes in "Choosing the right model").
