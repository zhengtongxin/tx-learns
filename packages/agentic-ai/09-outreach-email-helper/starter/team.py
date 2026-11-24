"""team.py: the writers, the picker, the mailroom and the coordinator."""
from agents import Agent, ModelSettings, function_tool

from mail import send_message

MODEL = "gpt-5.4-mini"  # the model name the lesson uses

base = ("You write emails for Little Lanterns, a weekend tutoring centre. "
        "Invite parents to the new Saturday coding club for kids aged 9 to 12.")

# TODO (Step 2): make three writers from `base`: formal, playful, and brief (under 80 words).
writers = []

# TODO (Step 2): make a picker agent that gets all drafts and replies with the best one only.
picker = None


@function_tool
def send_email(subject: str, body: str) -> str:
    """Send one email to the parents' mailing list.
    Args:
        subject: The subject line parents will see.
        body: The plain-text body of the email.
    """
    # TODO: Send one email to the parents' mailing list.
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


# TODO (Step 3): mailroom = an Agent with tools=[send_email] and ModelSettings(tool_choice="required").
mailroom = None

# TODO (Step 4): writer_tools = each writer .as_tool(...) (tool names cannot have spaces).
writer_tools = []

# TODO (Step 4): coordinator = an Agent with writer_tools + [send_email] and numbered instructions:
# get all three drafts, choose the best, send exactly one email.
coordinator = None

# TODO (Step 5): a mailroom with handoff_description, and a coordinator_handoff with
# tools=writer_tools and handoffs=[mailroom_for_handoff].
mailroom_for_handoff = None
coordinator_handoff = None
