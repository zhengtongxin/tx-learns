"""Meeting minutes writer (starter). Fill in each TODO.

Usage:
  python minutes.py --audio residents_meeting.mp3
  python minutes.py --text sample_transcript.txt [--long]
"""
import argparse
import os

import torch
from dotenv import load_dotenv
from transformers import (AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig,
                          TextStreamer, pipeline)

load_dotenv()
SPEECH_MODEL = os.getenv("SPEECH_MODEL", "openai/whisper-small")
CHAT_MODEL = os.getenv("CHAT_MODEL", "Qwen/Qwen2.5-3B-Instruct")

MINUTES_PROMPT = """Write meeting minutes in markdown with these parts:
a short summary, discussion points, decisions, and action items with an owner for each."""
NAMES = "Names that may appear: Mdm Tan, Uncle Raj, Priya, Wei Jie, Auntie Lim."

tok = None
brain = None


def transcribe(audio_path):
    # TODO: pipeline("automatic-speech-recognition", model=SPEECH_MODEL, device="cuda")
    # call it on the file (try chunk_length_s=30) and return the ["text"] field
    raise NotImplementedError


def load_brain():
    # TODO: set the globals tok and brain. Tokenizer from CHAT_MODEL; model with
    # device_map="auto" and a BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
    raise NotImplementedError


def encode(system, text):
    # TODO: build [system, user] messages and return tok.apply_chat_template(...,
    # add_generation_prompt=True, return_tensors="pt").to("cuda")
    raise NotImplementedError


def write_minutes(inputs):
    # TODO: TextStreamer(tok, skip_prompt=True), then brain.generate(inputs, streamer=..., max_new_tokens=2000)
    raise NotImplementedError


def ask(system, text):
    # TODO: encode, generate up to 700 new tokens, decode only the NEW ids (skip the prompt part)
    raise NotImplementedError


def split_text(transcript, size=6000):
    # TODO: return the transcript cut into pieces of at most `size` characters
    raise NotImplementedError


def minutes_for_long(transcript, size=6000):
    # TODO: summarise each piece with ask(), then ask once more for the minutes from the summaries.
    # Put NAMES in both prompts.
    raise NotImplementedError


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
