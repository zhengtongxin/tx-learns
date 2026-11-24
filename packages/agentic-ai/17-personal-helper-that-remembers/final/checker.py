"""checker.py: does "done" mean done? Plus the errand loop around the worker."""
from langchain_openai import ChatOpenAI
from langgraph.types import Command
from pydantic import BaseModel, Field


class Verdict(BaseModel):
    feedback: str = Field(description="Short, concrete feedback")
    done: bool = Field(description="Has the 'done means' line been met?")
    need_human: bool = Field(description="Is the worker stuck or asking a question?")


checker = ChatOpenAI(model="gpt-5.4-mini").with_structured_output(Verdict)


async def settle_interrupts(worker, res, cfg):
    """Step 3: when the worker pauses before a risky tool, ask the human, then resume.

    added: the lesson showed one approve. This loop asks in the terminal and sends one
    decision per paused call.
    """
    while "__interrupt__" in res:
        asks = res["__interrupt__"][0].value["action_requests"]
        decisions = []
        for ask in asks:
            print("Kaki wants to:", ask["description"])
            answer = input("Press Enter to approve, or type a reason to reject: ").strip()
            decisions.append({"type": "approve"} if not answer else {"type": "reject", "message": answer})
        res = await worker.ainvoke(Command(resume={"decisions": decisions}), cfg)
    return res


async def run_errand(worker, errand: str, done_means: str, cfg: dict, tries: int = 3):
    msg = {"messages": [{"role": "user", "content": f"{errand}\n\nDone means: {done_means}"}]}
    reply = ""
    for _ in range(tries):
        res = await worker.ainvoke(msg, cfg)
        res = await settle_interrupts(worker, res, cfg)
        reply = res["messages"][-1].content
        used = [c["name"] for m in res["messages"] for c in (getattr(m, "tool_calls", None) or [])]
        v = await checker.ainvoke(
            f"Errand: {errand}\nDone means: {done_means}\nTools used: {used}\nReply: {reply}\n"
            "Judge using the tool calls as evidence.")
        if v.done or v.need_human:
            return reply, v.feedback
        msg = {"messages": [{"role": "user", "content": f"Not done yet. Feedback: {v.feedback}. Keep going."}]}
    return reply, "gave up after max tries"
