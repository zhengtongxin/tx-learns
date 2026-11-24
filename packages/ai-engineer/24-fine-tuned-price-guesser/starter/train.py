"""Step 2 (starter): train a QLoRA adapter. Needs an NVIDIA GPU.

Run:  python train.py --subset 2000   (try this first)
      python train.py
"""
import argparse

import torch
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import SFTConfig, SFTTrainer

from common import BASE_MODEL, HUB_NAME, PUSH_TO_HUB, RUN_NAME

ap = argparse.ArgumentParser()
ap.add_argument("--subset", type=int, default=0, help="train on only this many examples (0 = all)")
args_cli = ap.parse_args()

# TODO: BitsAndBytesConfig: 4-bit, quant type "nf4", bfloat16 compute, double quant
pack = None

tok = AutoTokenizer.from_pretrained(BASE_MODEL)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token

# TODO: load BASE_MODEL with quantization_config=pack and device_map="auto"; print its memory footprint in GB
model = None

# TODO: LoraConfig: r=16, lora_alpha=32, attention projections (q_proj k_proj v_proj o_proj), dropout 0.05, task CAUSAL_LM
lora = None

# TODO: SFTConfig: output_dir=RUN_NAME, 1 epoch, batch 4 with 8 accumulation steps, learning rate 1e-4,
# cosine schedule, warmup_ratio 0.03, optim "paged_adamw_8bit", evaluate and save every 50 steps,
# push_to_hub=PUSH_TO_HUB, report_to="none", completion_only_loss=True
args = None

sets = load_dataset("json", data_files={"train": "data/train.jsonl", "validation": "data/validation.jsonl"})
train_set = sets["train"].select(range(min(args_cli.subset, len(sets["train"])))) if args_cli.subset else sets["train"]

# TODO: SFTTrainer(model=..., args=..., peft_config=..., train_dataset=..., eval_dataset=..., processing_class=tok)
# then trainer.train(), then save the adapter to f"{RUN_NAME}/adapter"
raise NotImplementedError
