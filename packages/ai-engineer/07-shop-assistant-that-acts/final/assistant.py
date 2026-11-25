"""Desk assistant for Uncle Raj's weekend coach trips.
Chat model + SQLite tools + a picture + a voice, on one Gradio screen.

Usage:  python assistant.py        (then open the link it prints)
"""
import base64
import json
import sqlite3
from io import BytesIO

import gradio as gr
from dotenv import load_dotenv  # added: load OPENAI_API_KEY from .env
from openai import OpenAI
from PIL import Image

load_dotenv()  # added
client = OpenAI()
MODEL = "gpt-5-mini"

# ---- Step 1: the voice of the desk and the data ----
system_message = """You are the desk assistant for Uncle Raj's weekend coach trips.
Be short, polite and accurate. Use the tools for prices.
If you are not sure, say you do not know."""

# added: check_same_thread=False because Gradio runs callbacks on worker threads
db = sqlite3.connect("trips.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS prices (place TEXT PRIMARY KEY, price REAL)")
db.execute("INSERT OR IGNORE INTO prices VALUES ('sentosa', 48), ('mandai', 62), ('changi', 55)")
db.commit()

looked_up = []  # places the tools touched during this question


def get_price(place):
    looked_up.append(place)
    row = db.execute("SELECT price FROM prices WHERE place = ?", (place.lower(),)).fetchone()
    return f"{place}: S${row[0]}" if row else f"{place}: no such trip"


def set_price(place, price):
    db.execute("INSERT OR REPLACE INTO prices VALUES (?, ?)", (place.lower(), price))
    db.commit()
    return f"{place} is now S${price}"


# ---- Step 2: the tools and the chat loop ----
def make_tool(name, text, props):
    return {"type": "function", "function": {"name": name, "description": text,
            "parameters": {"type": "object", "properties": props, "required": list(props)}}}


tools = [make_tool("get_price", "Get the coach trip price for a place.", {"place": {"type": "string"}}),
         make_tool("set_price", "Change a trip price. Staff only.", {"place": {"type": "string"}, "price": {"type": "number"}})]
dispatch = {"get_price": get_price, "set_price": set_price}


def run_chat(history):
    messages = [{"role": "system", "content": system_message}] + history
    reply = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
    while reply.choices[0].finish_reason == "tool_calls":
        asked = reply.choices[0].message
        messages.append(asked)
        for call in asked.tool_calls:
            print("tool call:", call.function.name, call.function.arguments)
            result = dispatch[call.function.name](**json.loads(call.function.arguments))
            messages.append({"role": "tool", "tool_call_id": call.id, "content": result})
        reply = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
    return reply.choices[0].message.content


# ---- Step 3: a picture and a voice, only when needed ----
def draw(place):
    result = client.images.generate(model="gpt-image-1", size="1024x1024",
        prompt=f"A bright pop-art poster of {place}, a weekend coach trip destination")
    return Image.open(BytesIO(base64.b64decode(result.data[0].b64_json)))


def speak(text):
    audio = client.audio.speech.create(model="gpt-4o-mini-tts", voice="alloy", input=text)
    with open("reply.mp3", "wb") as f:
        f.write(audio.content)
    return "reply.mp3"


def answer_everything(history):
    looked_up.clear()
    text = run_chat(history)
    picture = draw(looked_up[-1]) if looked_up else None
    return text, picture, speak(text)


# ---- Step 4: the screen, with two callbacks ----
with gr.Blocks() as screen:
    with gr.Row():
        chatbot = gr.Chatbot(type="messages", height=400)
        picture = gr.Image(height=400)
    audio = gr.Audio(autoplay=True)
    box = gr.Textbox(label="Ask about a coach trip")

    def add_user(text, history):
        return "", history + [{"role": "user", "content": text}]

    def answer(history):
        clean = [{"role": h["role"], "content": h["content"]} for h in history]
        text, pic, voice = answer_everything(clean)
        return history + [{"role": "assistant", "content": text}], pic, voice

    box.submit(add_user, [box, chatbot], [box, chatbot]).then(answer, chatbot, [chatbot, picture, audio])

if __name__ == "__main__":  # added: so the file can be imported by tests without starting the screen
    screen.launch()
