"""app.py: the chat screen and the loop that calls the model."""
import gradio as gr
from dotenv import load_dotenv
from openai import OpenAI

from context import build_system_prompt
from tools import tools, handle_tool_calls

load_dotenv(override=True)
client = OpenAI()  # reads OPENAI_API_KEY
MODEL = "gpt-5.4-mini"  # the model name the lesson uses; change it if your account uses another
system_prompt = build_system_prompt()


def chat(message, history):
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    gr.ChatInterface(chat, type="messages").launch()
