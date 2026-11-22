# Structured outputs: getting a form back instead of a paragraph

My notes from a hands-on lab with the OpenAI Agents SDK. Rewritten in my own words, example changed.
New item for lessons.js under "Agent SDKs", after the outreach email helper:
"Structured outputs and a checker agent" (结构化输出与检查员智能体), kind `c`.
Lesson 08 already explains where guardrails run, so do not re-teach that. This one is about
getting typed answers from an LLM and using them to build a real check.

## My example for the lesson
Uncle Lim runs a small kopitiam (a neighbourhood coffee shop) and emails his regulars every month.
This month: a new breakfast set, kaya toast + soft-boiled eggs + kopi for RM8.50.
Three agents on three different model providers write the announcement, a manager agent picks the best one,
and a checker agent makes sure nothing embarrassing goes out (a leftover "[Customer Name]", a rude tone,
a wrong price).

## Part 1: one team, many model providers
- Lesson 04 showed that many providers speak the same API if you change `base_url`. The SDK uses the same trick.
- Three steps per provider:
  1. Find the provider's OpenAI-compatible base URL (Gemini, OpenRouter and Groq all have one).
  2. Make an async client: `AsyncOpenAI(base_url=..., api_key=...)` (keys in `.env`, loaded with `load_dotenv`).
  3. Wrap it: `OpenAIChatCompletionsModel(model="...", openai_client=client)` and pass that as `model=` to `Agent`.
- So writer 1 runs on Gemini, writer 2 on a model through OpenRouter, writer 3 on Groq. The manager stays on a
  small OpenAI model (`model="gpt-5.4-mini"` as a plain string works for OpenAI models).
- Each writer becomes a tool with `.as_tool(...)`, plus a `@function_tool` that sends the email. Same manager pattern
  as the outreach helper, only now the drafts really come from different "brains". Fun to compare them in the trace.

```python
gemini = AsyncOpenAI(base_url=GEMINI_BASE_URL, api_key=os.getenv("GOOGLE_API_KEY"))
writer_a = Agent(name="Writer A", instructions=shop_voice,
                 model=OpenAIChatCompletionsModel(model="gemini-3.1-flash-lite", openai_client=gemini))
```

## Part 2: structured outputs (the main idea)
- Normally an LLM gives me a paragraph, and my code would have to read it like a human. Structured output means the
  answer comes back as a Python object with fields I can check with `if`.
- How: describe the shape as a Pydantic class (subclass of `BaseModel`), then give it to the agent as `output_type=`.
  The SDK turns the class into a JSON schema, tells the model to answer in that JSON, and builds the object for me.
- `Field(description=...)` matters: the description is what the model reads to know what to put in each field.
- `EmailCheck.model_json_schema()` prints the schema the model actually sees. Worth looking at once.
- Behind the scenes some providers use "constrained decoding": the model is only allowed to produce tokens that
  fit the schema, so the JSON cannot be broken. Not every provider supports structured outputs, so the checker
  stays on a model that does.

```python
class EmailCheck(BaseModel):
    is_friendly: bool = Field(description="Warm and polite, the way a shop owner talks to regulars")
    has_placeholders: bool = Field(description="Contains leftover blanks like [Customer Name] or {name}")
    price_mentioned: str = Field(description="The price of the breakfast set as written, or '' if none")

checker = Agent(name="Checker", instructions="You check shop emails before they are sent",
                model="gpt-5.4-mini", output_type=EmailCheck)
result = await Runner.run(checker, draft)
check = result.final_output        # an EmailCheck, not a string
if check.has_placeholders: ...
```

- I tested it on a deliberately bad draft ("Hi [Customer Name], come buy lah, very cheap, don't miss out") and got
  `is_friendly=False, has_placeholders=True`. That felt like magic the first time.

## Part 3: the checker as a guardrail
- An output guardrail can call another agent. My guardrail runs the checker on the writer's email and trips if
  there are placeholders or the tone is off. `output_info` keeps the whole `EmailCheck` so I can see why it tripped.

```python
@output_guardrail
async def shop_email_check(ctx, agent, message):
    result = await Runner.run(checker, message, context=ctx.context)
    check = result.final_output
    bad = check.has_placeholders or not check.is_friendly or "8.50" not in check.price_mentioned
    return GuardrailFunctionOutput(output_info={"check": check}, tripwire_triggered=bad)
```

- To see it trip, I gave a writer silly extra instructions ("write like an angry movie villain") and the guardrail
  stopped it with `OutputGuardrailTripwireTriggered`.
- Same gotcha as lesson 08: the output guardrail only runs on the agent that gives the final answer. If the writer is
  a tool inside the manager, its guardrail never runs.

## The plain-code way (what clicked for me)
- You do not need the guardrail decorator at all. Run the writer, then run the checker, then `if` in normal Python:

```python
draft = (await Runner.run(writer, "Write this month's email")).final_output
check = (await Runner.run(checker, draft)).final_output
if check.has_placeholders or not check.is_friendly:
    print("Not sending, fix the draft first")
else:
    send_email(...)
```

- This works in any framework, is easy to read, and I can also put the same check inside the send tool so a bad email
  can never leave. The framework guardrail is neat, but the explicit version is easier to trust and debug.
- Click moment: structured output turns "the LLM's opinion" into data. Once it is data, a guardrail is just an `if`.

## What confused me
- First try, I forgot `output_type` and got a paragraph back, then tried `result.final_output.is_friendly` and got
  an AttributeError on a string.
- One provider ignored the schema. Structured outputs depend on the model, so keep the checker on one that supports it.
- The price check: asking the model for `price_mentioned` as text and checking it in code was more reliable than a
  field like `price_is_correct: bool`, because then the model has to know the right price.

## Extras I tried (maybe a box at the end, or later lessons)
- **Sandbox agents**: the SDK can give an agent a workspace on my machine (a "manifest" says which folders it sees,
  "capabilities" say what it may do, a run config says where it runs). I pointed it at a small buggy script and it
  wrote a fixed copy to an output folder. Mac/Linux only (or Windows with WSL2).
- **A first taste of MCP**: asked a small model about a brand-new SDK feature and it guessed wrong. Connected a
  documentation MCP server (`MCPServerStreamableHttp`, `mcp_servers=[server]`) and the same agent answered correctly
  from up-to-date docs. Save the details for the MCP topic.

## Ideas to try myself
- Make the writers return structured output too (`subject`, `body`), so the send tool never has to guess.
- Add an input guardrail that refuses to write about prices that are not on the menu.
- Compare the three providers' drafts side by side in the trace and note which one Uncle Lim would pick.
