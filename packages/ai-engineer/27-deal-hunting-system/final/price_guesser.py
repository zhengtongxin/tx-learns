"""The tuned price model as a serverless GPU function (Modal). Only needed when DEMO_MODE=0.

One-time setup (see the README):
  pip install modal && modal setup
  modal secret create hub-token HF_TOKEN=<your model hub token>
Deploy:   modal deploy price_guesser.py
Call it:  modal.Function.from_name("price-guesser", "price").remote("Used phone, 128 GB, cracked corner")
It needs the adapter you trained in the fine-tuning project (ADAPTER_ID, on the model hub).
"""
import os
import re

import modal

try:  # added: read settings from .env on your laptop; the container does not have (or need) this package
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = modal.App("price-guesser")
image = (modal.Image.debian_slim()
         .pip_install("torch", "transformers", "peft", "bitsandbytes", "accelerate")
         .env({"BASE_MODEL": os.getenv("BASE_MODEL", "Qwen/Qwen2.5-3B"),                  # added: passed into the container
               "ADAPTER_ID": os.getenv("ADAPTER_ID", "your-hub-name/price-run-01"),
               "HF_HOME": "/cache"}))                                                      # added: model files cached here
secrets = [modal.Secret.from_name("hub-token")]   # the name of a secret stored on the platform
GPU = "T4"
cache = modal.Volume.from_name("price-guesser-cache", create_if_missing=True)   # added: no re-download on every cold start

_loaded = {}  # added: keep the model in memory between calls while the container is warm


def load():  # added: "load base in 4 bits, attach the adapter" from the lesson
    if not _loaded:
        import torch
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        pack = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)
        tok = AutoTokenizer.from_pretrained(os.environ["BASE_MODEL"])
        base = AutoModelForCausalLM.from_pretrained(os.environ["BASE_MODEL"], quantization_config=pack, device_map="auto")
        _loaded["model"] = PeftModel.from_pretrained(base, os.environ["ADAPTER_ID"]).eval()
        _loaded["tok"] = tok
    return _loaded["model"], _loaded["tok"]


def guess_price(prompt):  # the guessing function from the fine-tuning project, defined in this file so it runs in the container
    import torch
    model, tok = load()
    ids = tok(prompt, return_tensors="pt").to(model.device)
    if len(tok.encode("145", add_special_tokens=False)) != 1:
        # numbers are split into single digits for this tokenizer: generate and read the digits
        with torch.no_grad():
            out = model.generate(**ids, max_new_tokens=8, do_sample=False)
        found = re.match(r"\s*(\d+)", tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True))
        return float(found.group(1)) if found else 0.0
    with torch.no_grad():
        logits = model(**ids).logits[0, -1]
    probs = torch.softmax(logits, dim=-1)
    top = torch.topk(probs, 5)
    total, weight = 0.0, 0.0
    for p, i in zip(top.values, top.indices):
        word = tok.decode(i).strip()
        if word.isdigit():
            total += float(word) * float(p)
            weight += float(p)
    return total / weight if weight else 0.0


@app.function(image=image, secrets=secrets, gpu=GPU, timeout=1800,
              volumes={"/cache": cache}, scaledown_window=300)   # scaledown_window: how long it waits before sleeping
def price(description: str) -> float:
    prompt = f"{description}\nPrice is $"
    return guess_price(prompt)
