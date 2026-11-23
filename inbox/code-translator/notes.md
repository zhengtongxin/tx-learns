# Project: a code translator (my notes)

Topic: Choosing the right model. Planned item: "Project: a code translator" (project, tag "Choosing the right model · Project"). ~30 min, hands-on.

## Goal
Give Python code, get back fast compiled-language code (I used C++, then Rust) that prints the same output, and measure how much faster it runs. It is also a neat way to compare many models on a task with an objective score: speed, and "does it run at all".

## Steps
1. Ask a model what compiler my machine needs, giving it a system-info report (operating system, chip, installed tools). Then I write down the compile and run commands (optimisation flags, native CPU, link-time optimisation).
2. System prompt: "convert this Python to fast C++, reply with code only, same output, comments only if useful". The user prompt includes the Python code and a note about integer overflow and big numbers (Python integers never overflow, C++ ones do: use 64-bit or wider types).
3. Helper that writes the reply to main.cpp, compiles, runs, and times it. A helper that strips markdown fences from the reply.
4. A benchmark program: a series sum that loops millions of times (Python takes ~20 seconds). One model's C++ ran it in about 0.08 seconds: a couple of hundred times faster.
5. A harder program (a random-number generator feeding a maximum-subarray search with big numbers) that breaks sloppy translations.
6. A Gradio screen: Python on the left, translated code on the right, a model dropdown, Convert, Run Python, Run C++, and timing boxes. Same prompt through many models: frontier ones, open ones via a hosted API, and small local ones.

## Results pattern
The hard program separated models: many failed to compile or gave different output (overflow); the best open and closed models matched output and ran thousands of times faster. Small local code models often failed. Price and speed varied a lot too. Reading from results: bigger and "thinking" models won, but a cheap open model was close for far less.

## What I got wrong
- Trusted output without comparing it to the Python output; two models silently printed a wrong number.
- Forgot optimisation flags and saw almost no speedup.

## Try it yourself
1. Port a loop you wrote to Rust or C++ and compare timings.
2. Add an automatic check that outputs match.
3. Rank three models by speedup divided by cost.

## Takeaways
Pick models by running them on an objectively scored task. Always verify behaviour, not just that it compiles. Speedups can be enormous, but only for correct code.
