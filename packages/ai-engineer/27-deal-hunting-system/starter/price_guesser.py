"""The tuned price model as a serverless GPU function (starter). Only needed when DEMO_MODE=0.
Deploy with:  modal deploy price_guesser.py
"""
import os
import re

import modal

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = modal.App("price-guesser")
image = (modal.Image.debian_slim()
         .pip_install("torch", "transformers", "peft", "bitsandbytes", "accelerate")
         .env({"BASE_MODEL": os.getenv("BASE_MODEL", "Qwen/Qwen2.5-3B"),
               "ADAPTER_ID": os.getenv("ADAPTER_ID", "your-hub-name/price-run-01"),
               "HF_HOME": "/cache"}))
secrets = [modal.Secret.from_name("hub-token")]
GPU = "T4"
cache = modal.Volume.from_name("price-guesser-cache", create_if_missing=True)

_loaded = {}


def load():
    # TODO: once per container: load BASE_MODEL in 4 bits, attach the adapter ADAPTER_ID (peft), keep model and
    # tokenizer in _loaded, and return (model, tokenizer)
    raise NotImplementedError


def guess_price(prompt):
    # TODO: generate up to 8 new tokens greedily from the prompt and read the leading digits as a float
    # (0.0 if there are none). Bonus: when numbers are ONE token, average the top-5 digit tokens by probability.
    raise NotImplementedError


@app.function(image=image, secrets=secrets, gpu=GPU, timeout=1800,
              volumes={"/cache": cache}, scaledown_window=300)
def price(description: str) -> float:
    # TODO: build the prompt "<description>\nPrice is $" and return guess_price(prompt)
    raise NotImplementedError
