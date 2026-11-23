# Neural networks and frontier models as predictors (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/20-neural-nets-and-frontier-as-predictors.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'20-neural-nets-and-frontier-as-predictors.html' to that item only.

Topic: Predicting with data. Planned item: "Neural networks and frontier models as predictors". Concept lesson, ~25 min.

## A human baseline
I exported 100 test descriptions to a CSV, guessed the prices myself, and read them back through the same evaluate function. I was not great; knowing prices from daily life only gets me so far. A useful humility check: a human on this task is worse than a decent model, and better than random.

## A vanilla neural network
Turn each description into a sparse vector of 5000 hashed word counts (no vocabulary to store). A small PyTorch network of several linear layers with activation functions, trained with an optimiser to reduce prediction error. The code defines the layers in `__init__`, the forward pass, then a loop: forward, loss, backward, step. I tracked parameter count and validation loss per epoch. It did about as well as the best classical model: neural nets are not magic on small features.
(There is also a deeper network trained longer with a saved weights file; I only ran the saved one.)

## A frontier model as predictor
No training at all: ask a big model "Estimate the price of this product. Reply with the price only" plus the summary. Parse the number from its reply. Surprisingly strong, because it has seen the world's prices during training, but costs money per call and a smaller model is usually weaker. I compared two sizes. Parsing tip: ask for just a number and pull it out with a regex, since models add words anyway.

## Prepare for the next step: fine-tuning a hosted model
The platform wants examples in JSON Lines, one chat per line: a user message with the item, and an assistant message with the price (rounded to a whole number to save tokens). Providers suggest 50 to 100 examples to start, so I used 100 for one epoch to keep the bill tiny, plus a small validation file. Upload files, start a job, wait, then plug the fine-tuned model name into the same predictor function and the same evaluate.

## What I got wrong
Believed a fine-tuned model would clearly beat the plain frontier model. For a strong base and only 100 examples the change is small; more data and a cheaper base model show the real benefit (cost and consistency).

## Try it yourself
1. Guess 20 prices yourself and score them.
2. Write the one-line "price only" prompt and parse it.
3. Produce the JSONL for 20 examples and open it to look at one line.

## Takeaways
Same harness, many predictors: human, classic ML, neural net, prompted frontier model, fine-tuned model. Compare them fairly, then pick by error and cost.
