# Agents as graphs

Fills the planned lesson "Agents as graphs" under "Graphs and state".

## My example for the lesson

Think about the order flow at a busy kopitiam in Ipoh:

1. The customer shouts an order at the counter (**START**).
2. The counter auntie writes it on the order pad. Everyone looks at this one pad: that's the **State**.
3. If the order needs food, the slip goes to the kitchen stall. If it's just drinks, it goes to the drinks station. That choice is a **conditional edge**.
4. When the kitchen finishes, the slip comes *back* to the counter, which checks if anything else is needed. That's a **loop**.
5. The customer gets the bill (**END**).

Each station is a **node**: a plain function that reads the pad and adds a line to it. The auntie never wipes the pad. New lines are *appended*, and that "how do I combine old and new" rule is called a **reducer**.

LangGraph is exactly that: functions on a shared pad, joined by arrows.

## Part 1: The building blocks before graphs

LangChain's lowest layer is basically a provider wrapper: one chat-model object, messages, tools and structured output.

```bash
pip install langchain langchain-openai langgraph langgraph-checkpoint-sqlite langchain-community python-dotenv
```

Env var names: `OPENAI_API_KEY` (plus `OPENROUTER_API_KEY` if you use another OpenAI-compatible endpoint, and `SERPER_API_KEY` for search later).

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel, Field

llm = ChatOpenAI(model="gpt-4o-mini")
print(llm.invoke("One sentence: what is a kopitiam?").content)

for chunk in llm.stream("Two-line pantun about teh tarik"):
    print(chunk.content, end="", flush=True)

@tool
def menu_price(item: str) -> float:
    """Return the price in RM of a drink or dish on today's menu."""
    return {"kopi o": 1.6, "roti canai": 1.5, "nasi lemak": 4.0}.get(item.lower(), 0.0)

class Order(BaseModel):
    item: str = Field(description="What the customer wants")
    qty: int = Field(description="How many")

parser = llm.with_structured_output(Order)
print(parser.invoke("Boss, bagi tiga roti canai"))   # Order(item='roti canai', qty=3)
```

`llm.bind_tools([menu_price])` lets the model *ask* for a tool, but at this layer **you** write the loop yourself: run each `tool_call`, append a `ToolMessage(content=..., tool_call_id=call["id"])`, and invoke again. Graphs are what remove that boilerplate.

## Part 2: State, reducers, nodes, edges

The recipe is always the same five steps: define the state, create the builder, add nodes, add edges, compile.

```python
import random
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class Pad(TypedDict):
    messages: Annotated[list, add_messages]   # reducer: append, don't overwrite

def auntie(state: Pad) -> dict:
    shout = random.choice(["Kopi siap!", "Roti dah habis!", "Tunggu sekejap!"])
    return {"messages": [{"role": "assistant", "content": shout}]}

g = StateGraph(Pad)
g.add_node("auntie", auntie)
g.add_edge(START, "auntie")
g.add_edge("auntie", END)
app = g.compile()

print(app.invoke({"messages": [{"role": "user", "content": "order"}]})["messages"][-1].content)
```

There's no LLM at all in that graph, which helped me see that a graph is just functions. A node returns **only the keys it changes**. Fields without a reducer are replaced, and `messages` with `add_messages` gets appended. To use a model, the node body becomes `return {"messages": [llm.invoke(state["messages"])]}`.

## Part 3: Tools as a loop, plus an extra node

Two prebuilt pieces give you the tool loop: `ToolNode` runs whatever tools the model asked for, and `tools_condition` routes to `"tools"` if there are tool calls and to `END` otherwise.

```python
from langgraph.prebuilt import ToolNode, tools_condition

tools = [menu_price]
llm_t = llm.bind_tools(tools)

class Pad(TypedDict):
    messages: Annotated[list, add_messages]
    malay: str                                  # plain field: last write wins

def counter(state: Pad) -> dict:
    return {"messages": [llm_t.invoke(state["messages"])]}

def translate(state: Pad) -> dict:
    text = state["messages"][-1].content
    return {"malay": llm.invoke(f"Translate to Bahasa Melayu, reply with only the translation:\n{text}").content}

g = StateGraph(Pad)
g.add_node("counter", counter)
g.add_node("tools", ToolNode(tools))
g.add_node("translate", translate)
g.add_edge(START, "counter")
g.add_conditional_edges("counter", tools_condition, {"tools": "tools", END: "translate"})
g.add_edge("tools", "counter")          # back to the counter: the loop
g.add_edge("translate", END)
app = g.compile()
```

`app.get_graph().draw_mermaid_png()` draws it, which is great for checking that my arrows are what I think they are.

## Part 4: Memory and checkpoints

The `messages` reducer only works *within one run*. Call `invoke` twice and the second call starts from an empty pad. To remember between calls you compile with a **checkpointer** and pass a `thread_id`. It's like giving each table its own order pad.

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

app = g.compile(checkpointer=MemorySaver())
table5 = {"configurable": {"thread_id": "table-5"}}
app.invoke({"messages": [{"role": "user", "content": "I'm Mei Ling, I always take kopi kosong"}]}, table5)
print(app.invoke({"messages": [{"role": "user", "content": "My usual, please?"}]}, table5)["messages"][-1].content)

with SqliteSaver.from_conn_string("pads.db") as saver:   # survives restarts
    durable = g.compile(checkpointer=saver)
```

Because a checkpoint is saved at every step, I can look back and even "time travel":

```python
snap = app.get_state(table5)
history = list(app.get_state_history(table5))   # newest first
old = history[len(history) // 2]
cfg = {"configurable": {"thread_id": "table-5",
                        "checkpoint_id": old.config["configurable"]["checkpoint_id"]}}
app.invoke(None, cfg)   # resume from that earlier moment
```

## What confused me

- **"The state has messages, so why does it forget?"** The reducer combines updates *inside a run*. Memory across runs is the checkpointer's job, keyed by `thread_id`. A different `thread_id` means a blank pad.
- **`MemorySaver` disappears on restart.** It's fine in a notebook, but for anything real I need `SqliteSaver` (separate package `langgraph-checkpoint-sqlite`), and it has to be used inside its `with` block.
- **The conditional edge mapping.** `tools_condition` returns the string `"tools"` or `END`. If I want "no tools" to go to my translator instead of finishing, I must pass the mapping dict. Otherwise it goes straight to END and `malay` is never set.
