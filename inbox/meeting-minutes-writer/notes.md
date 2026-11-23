# Project: a meeting minutes writer (my notes)

Topic: Open-source models. Planned item: "Project: a meeting minutes writer" (project, tag "Open-source models · Project"). ~25 min, hands-on. Free cloud notebook with GPU.

## Goal
Upload a recording of a meeting, get back tidy minutes: summary, key points, decisions and action items with owners.

## Pipeline
1. Speech to text: an open speech-recognition model (via a transformers pipeline) turns the audio file into a transcript. Mount cloud drive storage to reach the file.
2. Text to minutes: a quantised open chat model, prompted with a system message ("write minutes in markdown: summary, discussion points, takeaways, action items with owners") plus the transcript.
3. Stream the result token by token.

```python
asr = pipeline("automatic-speech-recognition", model=SPEECH_MODEL, device="cuda")
transcript = asr(audio_path)["text"]
messages = [{"role":"system","content":MINUTES_PROMPT},{"role":"user","content":"Transcript:\n"+transcript}]
inputs = tok.apply_chat_template(messages, return_tensors="pt").to("cuda")
model.generate(inputs, streamer=streamer, max_new_tokens=2000)
```

## Sidebar I found cool
Inference is just "predict the next token" in a loop: the model gives probabilities for every possible next token; one is chosen, appended, and repeated. A frontier API can also return the top candidates (log-probabilities), so I can see the model hesitate between words.

## What I got wrong
- Long meetings overflow the context window. Fix: split the transcript into chunks, summarise each, then summarise the summaries.
- Wrong sampling rate or format of the audio gave an empty transcript.
- Names are often misspelled by speech models; give a list of names in the prompt.

## Try it yourself
1. Record a two-minute chat with a friend and run it end to end.
2. Add "decisions" and "open questions" sections.
3. Swap the chat model for a frontier API and compare minutes.

## Takeaways
Two models in a row: ears then brain. Open models + quantisation make it free to run. Chunk what doesn't fit. Check names.
