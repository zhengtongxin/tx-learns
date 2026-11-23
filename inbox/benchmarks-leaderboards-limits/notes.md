# Benchmarks, leaderboards and their limits (my notes)

Topic: Choosing the right model. Planned item: "Benchmarks, leaderboards and their limits". Concept lesson, ~15 min.

## Why this lesson
Twenty models, which one for my job? I had been picking by brand and mood. Better: look at what is measured, then measure my own task.

## What people measure
- Knowledge and reasoning exam-style sets (multiple choice, hard science and maths questions).
- Coding sets: write a function that passes hidden tests.
- Instruction following, long-context recall, tool use.
- Human preference arenas: people compare two anonymous answers and vote; a rating (like chess Elo) is computed.
- Practical columns: price per million tokens in and out, speed in tokens per second, context window size, licence (open or closed).

## Limits I noted
- Leakage: a model may have seen test questions in training, so scores flatter it.
- Scores saturate: when everyone gets 95 percent the test stops separating models.
- Arena votes reward style (long, confident, friendly) as much as correctness.
- A leaderboard average hides my task. A model that is top overall can be mediocre at my narrow job.
- Models change monthly; my notes age fast.

## What to do instead
1. Shortlist 3 to 5 models from public rankings plus price and speed.
2. Write 20 real examples from my own job with known good answers.
3. Run all models on them with the same prompt, score by a simple rule or by another model as judge, record cost and time.
4. Pick the cheapest model that is good enough, and re-test every few months.

## What I got wrong
Chose a model because it topped one chart, then paid ten times more than needed for a task a small model did equally well.

## Try it yourself
Build a tiny table (model, correct out of 10, seconds, cost) for three models on your own ten questions.

## Takeaways
Benchmarks are a starting list, not a verdict. Your own small test beats any leaderboard for your job. Always compare cost and speed with quality.
