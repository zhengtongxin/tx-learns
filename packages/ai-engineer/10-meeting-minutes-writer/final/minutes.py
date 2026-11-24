"""Meeting minutes writer: ears (speech to text) then brain (chat model writes the minutes).

Usage:
  python minutes.py --audio residents_meeting.mp3     # ears, then brain
  python minutes.py --text sample_transcript.txt      # skip the ears, use a text transcript
Add --long to chunk a long transcript (summarise each part, then the summaries).
Needs a GPU for the 4-bit chat model (a free cloud notebook GPU is enough).
"""
import argparse
import os

import torch
from dotenv import load_dotenv  # added: read model names and HF_TOKEN from .env
from transformers import (AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig,
                          TextStreamer, pipeline)

load_dotenv()  # added
SPEECH_MODEL = os.getenv("SPEECH_MODEL", "openai/whisper-small")
CHAT_MODEL = os.getenv("CHAT_MODEL", "Qwen/Qwen2.5-3B-Instruct")  # added: a concrete default; any open chat model works

MINUTES_PROMPT = """Write meeting minutes in markdown with these parts:
a short summary, discussion points, decisions, and action items with an owner for each."""
NAMES = "Names that may appear: Mdm Tan, Uncle Raj, Priya, Wei Jie, Auntie Lim."

tok = None    # added: filled by load_brain(), so importing this file does not load a model
brain = None


# ---- Step 1: ears ----
def transcribe(audio_path):
    ears = pipeline("automatic-speech-recognition", model=SPEECH_MODEL, device="cuda")
    # added: chunk_length_s lets the speech model handle recordings longer than 30 seconds
    return ears(audio_path, chunk_length_s=30)["text"]


# ---- Step 2: brain ----
def load_brain():  # added: the lesson loads this at the top level; a function keeps imports cheap
    global tok, brain
    tok = AutoTokenizer.from_pretrained(CHAT_MODEL)
    small = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
    brain = AutoModelForCausalLM.from_pretrained(CHAT_MODEL, device_map="auto", quantization_config=small)


def encode(system, text):
    msgs = [{"role": "system", "content": system}, {"role": "user", "content": text}]
    return tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt").to("cuda")


# ---- Step 3: stream the minutes ----
def write_minutes(inputs):
    streamer = TextStreamer(tok, skip_prompt=True)
    return brain.generate(inputs, streamer=streamer, max_new_tokens=2000)


# ---- Step 4: long meetings and misspelled names ----
def ask(system, text):
    ids = encode(system, text)
    out = brain.generate(ids, max_new_tokens=700)
    return tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)


def split_text(transcript, size=6000):  # added: pulled out of minutes_for_long so it can be tested alone
    return [transcript[i:i + size] for i in range(0, len(transcript), size)]


def minutes_for_long(transcript, size=6000):
    parts = split_text(transcript, size)
    notes = [ask("Summarise this part of a meeting. " + NAMES, p) for p in parts]
    return ask(MINUTES_PROMPT + " " + NAMES, "Part summaries:\n" + "\n".join(notes))


# added: a small command line so the file runs on its own
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--audio", help="path to a recording (mp3, wav, ...)")
    src.add_argument("--text", help="path to a text transcript")
    ap.add_argument("--long", action="store_true", help="chunk a long transcript first")
    args = ap.parse_args()

    if args.audio:
        transcript = transcribe(args.audio)
        print("Transcript start:", transcript[:300], "\n")
    else:
        transcript = open(args.text, encoding="utf-8").read()

    load_brain()
    if args.long:
        print(minutes_for_long(transcript))
    else:
        write_minutes(encode(MINUTES_PROMPT + " " + NAMES, "Transcript:\n" + transcript))
