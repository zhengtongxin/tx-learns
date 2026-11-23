# Tools, images and voice (my notes)

Topic: Many models, one app. Planned item: "Tools, images and voice". Concept lesson, ~20 min.

## Tools (function calling)
A tool is a normal Python function I own. I describe it to the model in JSON (name, plain-English description, parameters). The model never runs it. Instead it replies "please call get_price with city=X". My code runs the function, appends the result as a message with role "tool", and calls the model again so it can answer in words.

```python
menu_prices = {"chicken rice": 4.5, "laksa": 5.0, "teh peng": 1.4}
def get_price(item): return f"{item}: S${menu_prices.get(item.lower(), 'unknown')}"

price_tool = {"type": "function", "function": {
  "name": "get_price", "description": "Get the price of a menu item.",
  "parameters": {"type": "object", "properties": {"item": {"type": "string"}}, "required": ["item"]}}}
```
Loop: call model with tools=[price_tool]; if `response.choices[0].finish_reason == "tool_calls"`, run each requested call (there can be several in one reply), append the assistant message and one tool message per call (with tool_call_id), call the model again. Wrap it in `while` so the model can chain tools one after another.

## Real data behind the tool
I replaced the dict with a small SQLite table and a second tool to update a price. Now the model reads and writes real state. Exercise: add the "set price" tool, and think about who is allowed to call it.

## Images and voice
- Image model: one call, a prompt, a size, and back comes base64 text; decode it with PIL to show. Costs a few cents each, so don't loop.
- Text-to-speech: one call with text and a voice, returns audio bytes; play them.
These are just more API calls: the chat model decides what to say, other models draw or speak it.

## What I got wrong
Thought the model executes my function. It doesn't, it only asks. Forgot to return the tool message for every call id, which gives an API error.

## Try it yourself
1. Add a second tool and ask a question that needs both.
2. Draw a picture for each item mentioned in the reply.
3. Make the bot speak its answer.

## Takeaways
Tools = model asks, code acts. Describe tools clearly: the description is the prompt. Handle many and chained calls. Images and voice are separate models behind separate calls. This is a first step toward agents.
