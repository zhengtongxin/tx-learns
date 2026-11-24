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
    messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": message}]
    done = False
    while not done:
        response = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
        if response.choices[0].finish_reason == "tool_calls":
            messages.append(response.choices[0].message)
            messages.extend(handle_tool_calls(response.choices[0].message.tool_calls))
        else:
            done = True
    return response.choices[0].message.content


if __name__ == "__main__":
    gr.ChatInterface(chat, type="messages").launch()
