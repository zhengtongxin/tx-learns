"""Code translator (starter). Fill in each TODO.

Usage:  python translate.py hard_program.py [--models gpt-5-mini,gpt-5]
"""
import argparse
import os
import subprocess
import time

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

COMPILE = ["g++", "-O3", "-march=native", "-flto", "main.cpp", "-o", "main"]
RUN = ["./main"]

SYSTEM = """Convert the given Python into fast C++.
Reply with code only. It must print exactly the same output.
Add comments only where they really help."""


def make_user_prompt(python_code):
    # TODO: the instruction to translate, the warning about integer overflow
    # (use 64-bit or wider types), then the Python code
    raise NotImplementedError


def strip_fences(reply):
    # TODO: drop every line that starts with three backticks, keep the rest
    raise NotImplementedError


def timed(cmd):
    # TODO: run cmd with subprocess.run(capture_output=True, text=True);
    # return (stdout stripped, seconds taken)
    raise NotImplementedError


def translate_and_run(model, python_code):
    # TODO: ask the model (SYSTEM + make_user_prompt), save the cleaned reply as main.cpp,
    # compile with COMPILE (return (None, None) if the return code is not 0), then return timed(RUN)
    raise NotImplementedError


def run_python(path):
    # TODO: return timed(["python", path])
    raise NotImplementedError


def main(path, models):
    # TODO: time the Python once. For each model: translate_and_run, then print one of
    # "failed to compile", "WRONG OUTPUT <out>", or "ok, <n>x faster" (python time / C++ time)
    raise NotImplementedError


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("program", help="the Python file to translate, e.g. hard_program.py")
    ap.add_argument("--models", default=os.getenv("MODELS", "gpt-5-mini"))
    args = ap.parse_args()
    main(args.program, [m.strip() for m in args.models.split(",") if m.strip()])
