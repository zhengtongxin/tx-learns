# Training run: what to watch (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/23-training-run-what-to-watch.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'23-training-run-what-to-watch.html' to that item only.

Topic: Fine-tuning open models. Planned item: "Training run: what to watch". Concept lesson, ~20 min. Free or cheap rented GPU.

## Setting up the run
Use the supervised fine-tuning trainer from the TRL library with: the quantised base model, the LoRA config, the training and validation datasets (prompt + completion text), and a config:
- epochs: 1 to 3 (more passes = more risk of memorising)
- batch size and gradient accumulation: if the GPU can't hold a big batch, accumulate small ones
- learning rate: small, around 1e-4 to 2e-4 for LoRA, with a cosine schedule and a short warm-up
- optimiser: a paged 8-bit variant to save memory
- save and evaluate every N steps; push checkpoints to the hub
Log metrics to a dashboard (Weights & Biases) so I can watch from my phone.

## What to watch
- Training loss going down steadily but noisily: normal.
- Validation loss: if it starts going up while training loss goes down, I'm overfitting: stop early or use fewer epochs.
- Loss spikes or NaN: learning rate too high.
- GPU memory near the cap: lower the batch size, shorten the cutoff.
- Time per step and estimated cost: stop if it's blowing the budget.
- Check a few real generations during the run, not only the loss number.

## After training
Load the base model and the saved adapter, run the same evaluate function from the earlier lessons on the test set. This is where I find out if the whole thing was worth it. Keep each run named with a timestamp and save the revision id so I can reproduce it.

## What I got wrong
Trained for too many epochs because training loss was still dropping; validation loss had stopped improving two checkpoints ago. Also forgot to push checkpoints and lost a run when the cloud notebook disconnected.

## Try it yourself
1. Run 100 steps on a tiny subset and read the loss curve.
2. Raise the learning rate by 10x on purpose and watch it break.
3. Compare checkpoints by test error, not just by loss.

## Takeaways
Watch validation, not just training. Save checkpoints. Judge success by the same test harness as before.
