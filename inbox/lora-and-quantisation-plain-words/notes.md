# LoRA and quantisation, in plain words (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/22-lora-and-quantisation-plain-words.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'22-lora-and-quantisation-plain-words.html' to that item only.

Topic: Fine-tuning open models. Planned item: "LoRA and quantisation, in plain words". Concept lesson, ~20 min. Ran in a free cloud notebook with a small GPU.

## The problem
Fine-tuning a whole model means updating billions of numbers: too much memory and time for my budget.

## LoRA (low-rank adaptation)
Freeze the original weights. Next to some layers, add a small pair of thin matrices (rank r, e.g. 8 to 32). Only those are trained; at run time their product is added to the original weights. Trainable parameters drop from billions to millions (often well under 1 percent). Settings I note:
- r: the thinness. Bigger learns more, uses more memory.
- alpha: a scaling factor, often 2r or set equal to r.
- target modules: which layers get adapters (attention projections are the usual start).
- dropout: a little, to avoid overfitting.
The result is a small adapter file I can share, and the base model stays untouched.

## Quantisation
Store the frozen base weights in 4 bits instead of 16, so a 3B-8B parameter model fits on one small GPU. Details I keep: use the "NF4" 4-bit type, a compute dtype of bfloat16, optional double quantisation. LoRA on a quantised base = QLoRA.

## Choosing a base model
Pick a size my GPU can hold (3B to 8B is fine on a free or cheap GPU), a family with a good tokenizer, a permissive licence, and check that it tokenises numbers sensibly: some families split each digit, which makes price prediction easier. Also count tokens in my examples and set a cutoff so all prompts fit.

## Data prep for tuning
Each training example is a prompt, then a short completion ("Price is $123"). Truncate descriptions at a token cutoff. Use a "response only" loss so the model is trained to produce the price, not to repeat the description.

## What I got wrong
Confused the two ideas: LoRA reduces what is trained, quantisation reduces how much memory the frozen part uses. They are independent and combine well.

## Try it yourself
1. Load a small model in 4-bit and print its memory.
2. Wrap it with a LoRA config and print the trainable parameter count.
3. Compare the count at r=8 and r=64.

## Takeaways
Freeze the big thing, train a tiny add-on. Shrink the frozen part to 4 bits. Choose model size by GPU memory. Teach it only the answer part.
