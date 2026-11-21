# Agents as tools, handoffs, guardrails (sample notes to test the writer agent)

- agent.as_tool(tool_name=..., tool_description=...) turns an agent into a tool another agent can call.
  The calling agent ("manager") gets the result back and keeps talking to the user.
- handoffs=[other_agent] on an Agent: the model can choose to hand the whole conversation over.
  After a handoff the other agent replies to the user, the first one is done.
- My confusion: I thought handoff and as_tool were the same thing. The difference is who talks next.
  Click moment: as_tool = asking a colleague for an answer; handoff = transferring the phone call.
- Guardrails: @input_guardrail runs on the user input before/alongside the agent,
  @output_guardrail checks the final output. They return GuardrailFunctionOutput(tripwire_triggered=...).
  If the tripwire fires, the SDK raises InputGuardrailTripwireTriggered / OutputGuardrailTripwireTriggered.
- Mistake I made: I put the guardrail on a sub-agent used as a tool and it never ran,
  input guardrails only run for the first agent in the run, output guardrails only for the agent that gives the final output.

```python
from agents import Agent, Runner, input_guardrail, GuardrailFunctionOutput

@input_guardrail
async def no_homework(ctx, agent, message):
    is_homework = "homework" in str(message).lower()
    return GuardrailFunctionOutput(output_info={"homework": is_homework}, tripwire_triggered=is_homework)

translator = Agent(name="Translator", instructions="Translate the text to Malay.")
manager = Agent(
    name="Manager",
    instructions="Answer the user. Use the translator tool when they want Malay.",
    tools=[translator.as_tool(tool_name="translate_to_malay", tool_description="Translate English text to Malay")],
    input_guardrails=[no_homework],
)
```
- Second thought: as_tool is like a function call that happens to be an agent.
