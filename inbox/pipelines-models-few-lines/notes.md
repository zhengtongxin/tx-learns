# Pipelines: models in a few lines (my notes)

Topic: Open-source models. Planned item: "Pipelines: models in a few lines". Concept lesson, ~15 min. Ran in a free cloud notebook with a small GPU.

## The idea
Hugging Face is the hub of open models. The `transformers` library has two levels. The high level is `pipeline("task")`: name the job, get a ready tool. Low level (next lesson) is tokenizer + model.

## Tasks I tried
```python
from transformers import pipeline
pipeline("sentiment-analysis")("The queue was long but the chicken rice was worth it")
pipeline("ner", aggregation_strategy="simple")("Wei Jie repairs phones near Bishan MRT")
pipeline("question-answering")(question="Who repairs phones?", context="Wei Jie repairs phones near Bishan MRT.")
pipeline("summarization")(long_text)
pipeline("translation_en_to_fr")("Where is the bus stop?")
pipeline("zero-shot-classification")(text, candidate_labels=["billing","repair","praise"])
```
Also text generation, image generation (diffusion pipeline) and text-to-speech with a speaker-embedding model. Each pipeline downloads a default model the first time (it can be big), then runs on my GPU. Use `device="cuda"` when available.

## Why it matters
- No API bill, data stays with me.
- Many small specialised models beat one huge model for one narrow job (cheaper, faster).
- But I own the setup: GPU, downloads, versions.

## What I got wrong
Ran it on CPU and waited ages; switch the runtime to a GPU. Also forgot the first call downloads gigabytes.

## Try it yourself
1. Classify ten of your own sentences with zero-shot labels you invent.
2. Compare a pipeline summary with a frontier-model summary of the same text.
3. Pick a different model name from the hub for the same task.

## Takeaways
Pipeline = task name in, tool out. Open models run on a rented GPU. Small specialised models are a real option. Always check device and download size.
