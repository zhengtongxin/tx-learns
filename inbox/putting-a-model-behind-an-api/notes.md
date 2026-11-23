# Putting a model behind an API (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/25-putting-a-model-behind-an-api.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'25-putting-a-model-behind-an-api.html' to that item only.

Topic: A working agent system. Planned item: "Putting a model behind an API". Concept lesson, ~20 min.

## The problem
My tuned model needs a GPU. My laptop doesn't have one, and I don't want to rent one all day. I want a function I can call from anywhere that wakes a GPU only when needed and sleeps otherwise: serverless.

## What I did
Used a serverless cloud platform that lets me define infrastructure in Python:
1. Sign up, create a token, install the command-line tool, authenticate.
2. Declare an `App`, an `Image` (a base Linux with the Python packages my model needs), a secret holding my hub token, and a GPU type.
3. Decorate a function so it runs remotely: `@app.function(image=image, secrets=secrets, gpu="T4", timeout=1800)`.
4. The function loads the base model in 4-bit, attaches the adapter, builds the prompt, generates a few tokens, returns a number.
5. Call it from a notebook: `with app.run(): result = price.remote(text)`. First call has a "cold start" (container boots, weights load) and can take minutes; later calls reuse a warm container for a while. A cache volume for model weights avoids re-downloading.
6. Deploy it so it has a stable name I can look up from any other program.

## Good habits
- A small preprocessing step before the model: use a cheap LLM to rewrite a messy listing into the same tidy format used in training; the model only does well on inputs that look like its training data.
- Secrets live in the platform's secret store, never in code.
- Set timeouts and a scale-down time to control cost.
- Test `local` and `remote` versions of the same function.

## What I got wrong
Pasted a token into the notebook. Moved it to a named secret and rotated the token. Also forgot that secret names and the environment variable keys inside them are separate things.

## Try it yourself
1. Deploy a "hello" function that returns a string, from your own laptop.
2. Time cold vs warm calls.
3. Add the preprocessing step and compare outputs.

## Takeaways
Serverless GPU = pay per use. Cold starts are normal. Secrets in a store. Normalise inputs to look like training data.
