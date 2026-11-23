# Tokenizers and how models load (my notes)

Topic: Open-source models. Planned item: "Tokenizers and how models load". Concept lesson, ~20 min. Ran in a free cloud notebook with a small GPU.

## Tokenizers differ per model
Each model family has its own tokenizer and vocabulary. The same sentence becomes different token counts and ids in different families. `tokenizer.encode(text)`, `tokenizer.decode(ids)`, `tokenizer.batch_decode(...)`. Special tokens mark start, end and the roles of a chat.

## Chat templates
A chat model was trained on a specific text layout for system/user/assistant turns. `tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)` builds exactly that layout for me from the same list of dicts I use with APIs. It is what the API providers do behind the scenes. Different families use different markers, so never hand-write them.

## Loading a model
```python
from transformers import AutoTokenizer, AutoModelForCausalLM
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, device_map="auto")
inputs = tok.apply_chat_template(messages, return_tensors="pt").to("cuda")
out = model.generate(inputs, max_new_tokens=80)
print(tok.decode(out[0]))
```
`model.get_memory_footprint()` tells how much GPU memory it uses. A full-precision model of a few billion parameters can fill a free GPU.

## Quantisation
Store each weight in 4 bits instead of 16 using a quantisation config (bitsandbytes): memory drops to roughly a quarter, quality drops a little. That is how an 8-billion-parameter model fits on a free GPU. Looking inside a model prints its layers: embedding, a stack of transformer blocks with attention and MLP, then an output layer.

## Streaming
A text streamer prints tokens as they are produced so I don't stare at a blank cell.

## What I got wrong
Mixed up tokenizer and model from different families, which gives nonsense. They must match. Some models need a licence accepted and an access token from the hub.

## Try it yourself
1. Tokenise one sentence with two model families and compare counts.
2. Load a model in full precision and in 4-bit and compare memory and speed.
3. Print the chat-template output for a 3-turn conversation.

## Takeaways
Tokenizer and model are a pair. Chat template = the format the model was trained on. Quantisation trades a little quality for a lot of memory. Memory, not speed, is the first wall.
