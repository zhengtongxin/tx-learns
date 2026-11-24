# context.py: the system prompt, in a fixed order: role, facts, rules
from resources import facts, profile, style, summary


def build_prompt(name: str = "Mei Ling") -> str:
    # TODO: return one f-string in this order (use the four variables imported above):
    #   1. "# Your role": who the twin is and its task
    #   2. "# Important context": summary, then Facts, Profile and How she talks
    #   3. "# Rules" LAST (models pay most attention to what is closest to the question):
    #        stay in character; only state what is in the context, else say "not sure";
    #        never share private details; steer off-topic questions back to her work
    return "TODO"
