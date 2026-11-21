# Outreach email helper: orchestrating agents by code vs by the LLM

My notes from a hands-on lab with the OpenAI Agents SDK. Rewritten in my own words, example changed.
Planned item in lessons.js: "Project: an outreach email helper" (Agent SDKs).

## The goal
Build a small team of agents that writes a cold outreach email, picks the best draft and sends it.
My own example for the lesson: a small tutoring centre wants to email parents about a new coding club.

## Side quest: sending the message
- Easiest free way: plain SMTP from my own mailbox (`smtplib`, `starttls`, an app password, values in `.env`).
- Proper email services need a domain you own plus DNS records, which is a lot of setup for a demo.
- Fallback when email is not set up: send a phone push notification instead. One `send_message()` wrapper picks
  email or push, so the agent code does not care.
- Point I want to remember: the sending is not the lesson. The agent work is.

## Two ways to orchestrate
1. **By code**: my Python decides the order. Predictable, repeatable, easy to debug.
2. **By the LLM**: a "manager" agent decides which tools/agents to call. More flexible, less predictable.

### By code
- Three writer agents, same base instructions, different tone: formal, playful, short-and-busy.
- Run all three at once: `await asyncio.gather(Runner.run(a1, msg), Runner.run(a2, msg), Runner.run(a3, msg))`.
- A fourth "picker" agent gets all drafts joined into one string and replies with the best one only.
- Wrap the whole thing in `with trace("..."):` so the run shows up as one trace in the dashboard. Traces = best debugger.
- `Runner.run_streamed(...)` + `stream_events()` to print tokens as they arrive (look for `ResponseTextDeltaEvent`).

```python
drafts = await asyncio.gather(*(Runner.run(w, "Write an outreach email") for w in writers))
joined = "Drafts:\n\n" + "\n\n---\n\n".join(d.final_output for d in drafts)
best = await Runner.run(picker, joined)
```

### Adding a real tool
- `@function_tool` on a normal Python function with type hints + docstring. The SDK builds the JSON schema for me
  (I printed `tool.params_json_schema` and it was all there, arg descriptions from the docstring).
- `ModelSettings(tool_choice="required")` forces the agent to call a tool instead of just answering in text.
  Without it, the small model sometimes "pretended" to send.

### By the LLM: agents as tools
- `writer.as_tool(tool_name=..., tool_description=...)` makes each writer agent a tool.
- Manager agent gets tools = 3 writer tools + the send tool, and step-by-step instructions:
  get one draft from each writer, choose the best, send exactly one email.
- Control comes back to the manager each time: A -> B -> A. Good fit for a "planner" agent.
- `draw_graph(agent)` (needs Graphviz installed) draws the agent and its tools. Optional, nice to see.

### By the LLM: handoffs
- `handoffs=[sender_agent]`: the manager collects drafts with tools, then hands the job to the sender.
- Handoff = control moves across, A -> B, it does not come back.
- Under the hood the SDK implements handoffs as tool calls anyway.

## What confused me / what went wrong
- Results were flaky with the small model: sometimes only two drafts, sometimes it sent two emails.
  Fix was clearer numbered steps in the instructions ("do not continue until you have all three drafts",
  "send only one email"), forcing tool use, or a bigger model.
- Handoffs were the least reliable part. Without forcing tool use the sender sometimes never sent.
- My email landed in spam. Of course it did, it is a cold email.
- Click moment: "by code" is me being the manager; "by LLM" is hiring a manager and hoping it follows the plan.
  Use code when the steps are fixed, the LLM when the path depends on the content.

## Ideas to try myself
- Add a second round where an agent improves the chosen draft before sending (by code, then by LLM).
- Harder: use a real email service, read replies, and let the agent answer to keep the conversation going.
