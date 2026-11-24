"""Code translator: ask models for fast C++ from Python, compile it, run it, check the output, time it.

Usage:  python translate.py hard_program.py            (models come from MODELS in .env)
        python translate.py hard_program.py --models gpt-5-mini,gpt-5
"""
import argparse
import os
import subprocess
import time

from dotenv import load_dotenv  # added: read OPENAI_API_KEY and MODELS from .env
from openai import OpenAI

load_dotenv()  # added
client = OpenAI()

# ---- Step 1: the compile command comes first ----
COMPILE = ["g++", "-O3", "-march=native", "-flto", "main.cpp", "-o", "main"]
RUN = ["./main"]  # added note: on Windows use ["main.exe"] and "-o", "main.exe" above

# ---- Step 2: the prompt, and cleaning the reply ----
SYSTEM = """Convert the given Python into fast C++.
Reply with code only. It must print exactly the same output.
Add comments only where they really help."""


def make_user_prompt(python_code):
    return ("Translate this to C++ that prints the same output. "
            "Python integers never overflow but C++ ones do, so use 64-bit or wider types.\n\n" + python_code)


def strip_fences(reply):
    lines = [ln for ln in reply.splitlines() if not ln.strip().startswith("```")]
    return "\n".join(lines)


# ---- Step 3: ask, compile, run, time ----
def timed(cmd):
    start = time.time()
    done = subprocess.run(cmd, capture_output=True, text=True)
    return done.stdout.strip(), time.time() - start


def translate_and_run(model, python_code):
    reply = client.chat.completions.create(model=model, messages=[
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": make_user_prompt(python_code)}])
    open("main.cpp", "w").write(strip_fences(reply.choices[0].message.content))
    built = subprocess.run(COMPILE, capture_output=True, text=True)
    if built.returncode != 0:
        print(built.stderr[:500])  # added: show why it did not compile
        return None, None          # did not even compile
    return timed(RUN)


def run_python(path):
    return timed(["python", path])  # added note: use "python3" if "python" is not found


# ---- Step 4: verify the output, then rank the models ----
def main(path, models):  # added: the lesson's loop wrapped in a function
    py_out, py_time = run_python(path)
    print(f"python: {py_time:.1f}s")
    code = open(path).read()
    for model in models:
        out, took = translate_and_run(model, code)
        if out is None:
            print(model, "failed to compile")
        elif out != py_out:
            print(model, "WRONG OUTPUT", out)
        else:
            print(model, f"ok, {py_time / took:.0f}x faster")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("program", help="the Python file to translate, e.g. hard_program.py")
    ap.add_argument("--models", default=os.getenv("MODELS", "gpt-5-mini"))
    args = ap.parse_args()
    main(args.program, [m.strip() for m in args.models.split(",") if m.strip()])
