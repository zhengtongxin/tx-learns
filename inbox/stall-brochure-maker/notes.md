# Project: a stall brochure maker (my notes)

Topic: Talking to models. Planned item: "Project: a stall brochure maker" (a project, so the tag is "Talking to models · Project"). About 25 min, hands-on. Builds on the two lessons before it.

## Goal
Give a business name and its website; get back a short brochure (for customers, investors or job seekers). My first time chaining more than one model call, and honestly the first small taste of an agentic pattern.

## Step 1: a summariser
- A system prompt sets the task and tone. A user prompt carries the page text.
- A helper that fetches a web page and strips it to plain text (requests + BeautifulSoup, remove scripts/styles/images).
- One function builds the messages list, another calls the model and returns the text. Show it with markdown.
- Limitation: pages that need JavaScript to render come back nearly empty with this simple approach; some sites also block scrapers with a 403.

## Step 2: let the model choose which links matter
A brochure needs the About and Careers pages, not the Privacy page. Hard to code with rules, easy for a model.
- Fetch all links on the landing page.
- Ask the model to return JSON only: a list of {type, url}, using one example in the prompt ("one-shot prompting") so it copies the shape. Turn relative links like /about into full URLs. Exclude terms, privacy, mailto.
- Ask for JSON mode: `response_format={"type": "json_object"}`, then `json.loads` the reply.
- (Later topic: Structured Outputs force an exact schema, stronger than asking nicely.)

## Step 3: build the brochure
- Fetch the landing page and each chosen page, join them under headings ("Landing page", "Link: about page").
- Cut the combined text to a fixed length so the call stays cheap and inside the context window.
- Second system prompt: write a short brochure in markdown, include culture, customers and careers if present.
- Changing one sentence of the system prompt changes the tone (formal vs a funny one). Tone is just prompt.

## Step 4: stream the answer
Pass `stream=True` and append each chunk's delta to the text, updating the display as it arrives. Same call, much nicer feel, because the reader sees words immediately.

## Structure of the finished thing
fetch page text -> model call 1 (pick links) -> fetch those pages -> model call 2 (write brochure, streamed).

## What I got wrong
- I pasted a whole site into one prompt and hit the length limit. Truncating, or choosing pages first, fixed it.
- I forgot that the link list came back as a JSON string, not a Python dict, until json.loads.

## Try it yourself
1. Make a brochure for a business you know.
2. Switch the tone to funny and compare.
3. Swap in a local model and see what gets worse.

## Takeaways
Two small calls beat one giant one. Let the model do the fuzzy decision (which links), code does the plumbing. Prompts set tone. Stream for feel. Cut the input.
