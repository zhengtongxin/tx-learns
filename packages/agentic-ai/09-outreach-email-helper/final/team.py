"""team.py: the writers, the picker, the mailroom and the coordinator."""
from agents import Agent, ModelSettings, function_tool

from mail import send_message

MODEL = "gpt-5.4-mini"  # the model name the lesson uses

base = ("You write emails for Little Lanterns, a weekend tutoring centre. "
        "Invite parents to the new Saturday coding club for kids aged 9 to 12.")

writers = [
    Agent(name="Formal writer", instructions=base + " Tone: polite and professional.", model=MODEL),
    Agent(name="Playful writer", instructions=base + " Tone: warm and a little playful.", model=MODEL),
    Agent(name="Brief writer", instructions=base + " Tone: short and clear for busy parents. Under 80 words.", model=MODEL),
]

picker = Agent(
    name="Picker", model=MODEL,
    instructions="You get several email drafts. Pick the one a busy parent is most likely to answer. Reply with that draft only.")


@function_tool
def send_email(subject: str, body: str) -> str:
    """Send one email to the parents' mailing list.
    Args:
        subject: The subject line parents will see.
        body: The plain-text body of the email.
    """
    send_message(subject, body)
    return "Sent"


# Step 3: the mailroom, forced to really call the tool
mailroom = Agent(
    name="Mailroom", model=MODEL,
    instructions="Turn the draft you get into a clear subject and body, then send it with send_email.",
    tools=[send_email], model_settings=ModelSettings(tool_choice="required"))

# Step 4: the manager version (agents as tools)
writer_tools = [w.as_tool(tool_name=w.name.lower().replace(" ", "_"),
                          tool_description="Write a draft invitation email in this tone")
                for w in writers]

coordinator = Agent(
    name="Coordinator", model=MODEL,
    tools=writer_tools + [send_email],
    instructions="""You send one invitation email for Little Lanterns.
1. Get one draft from each of the three writer tools. Do not go on until you have all three.
2. Choose the single best draft yourself.
3. Send exactly one email with send_email. Never send more than one.""")

# Step 5: the handoff version. The mailroom gets a description so the coordinator knows when to hand off.
# added: a separate agent object, so both versions can exist side by side
mailroom_for_handoff = Agent(
    name="Mailroom", model=MODEL,
    instructions="Turn the draft you get into a clear subject and body, then send it with send_email.",
    handoff_description="Formats the chosen draft and sends it to parents",
    tools=[send_email], model_settings=ModelSettings(tool_choice="required"))

coordinator_handoff = Agent(
    name="Coordinator", model=MODEL,
    tools=writer_tools, handoffs=[mailroom_for_handoff],
    instructions="""1. Get one draft from each of the three writer tools.
2. Choose the single best draft.
3. Hand off to Mailroom with that draft. Do not write the email yourself.""")
