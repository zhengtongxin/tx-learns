"""Desk assistant (starter). Fill in each TODO, then run: python assistant.py"""
import base64
import json
import sqlite3
from io import BytesIO

import gradio as gr
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

load_dotenv()
client = OpenAI()
MODEL = "gpt-5-mini"

system_message = """You are the desk assistant for Uncle Raj's weekend coach trips.
Be short, polite and accurate. Use the tools for prices.
If you are not sure, say you do not know."""

db = sqlite3.connect("trips.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS prices (place TEXT PRIMARY KEY, price REAL)")
db.execute("INSERT OR IGNORE INTO prices VALUES ('sentosa', 48), ('mandai', 62), ('changi', 55)")
db.commit()

looked_up = []  # places the tools touched during this question


def get_price(place):
    # TODO: remember the place in looked_up, SELECT its price (lower-case the name),
    # return "<place>: S$<price>" or "<place>: no such trip"
    raise NotImplementedError


def set_price(place, price):
    # TODO: INSERT OR REPLACE the row, commit, return "<place> is now S$<price>"
    raise NotImplementedError


def make_tool(name, text, props):
    # TODO: return the tool description dict: {"type": "function", "function": {name, description, parameters}}
    # parameters is an object schema with the given properties, all required
    raise NotImplementedError


tools = []  # TODO: two tools made with make_tool: get_price (place) and set_price (place, price)
dispatch = {}  # TODO: map each tool name to its function


def run_chat(history):
    # TODO: messages = system message + history. Call the model with tools=tools.
    # While finish_reason == "tool_calls": append the assistant message, run every call through
    # dispatch (json.loads the arguments), append one {"role": "tool", "tool_call_id": ...} message
    # per call, then call the model again. Return the final text.
    raise NotImplementedError


def draw(place):
    # TODO: client.images.generate(model="gpt-image-1", ...) -> decode b64_json -> PIL Image
    raise NotImplementedError


def speak(text):
    # TODO: client.audio.speech.create(model="gpt-4o-mini-tts", voice="alloy", input=text)
    # write audio.content to reply.mp3 and return the file name
    raise NotImplementedError


def answer_everything(history):
    # TODO: clear looked_up, run_chat, draw ONLY if a tool looked up a place, always speak.
    # Return (text, picture_or_None, audio_path)
    raise NotImplementedError


with gr.Blocks() as screen:
    with gr.Row():
        chatbot = gr.Chatbot(type="messages", height=400)
        picture = gr.Image(height=400)
    audio = gr.Audio(autoplay=True)
    box = gr.Textbox(label="Ask about a coach trip")

    def add_user(text, history):
        # TODO: return "" (clear the box) and history plus the user's message
        raise NotImplementedError

    def answer(history):
        # TODO: strip each history item to role and content, call answer_everything,
        # return history plus the assistant message, the picture, the audio path
        raise NotImplementedError

    box.submit(add_user, [box, chatbot], [box, chatbot]).then(answer, chatbot, [chatbot, picture, audio])

if __name__ == "__main__":
    screen.launch()
