"""Step 2: train a QLoRA adapter on the price examples. Needs an NVIDIA GPU (a free notebook GPU is enough).

Run:  python train.py --subset 2000      a few minutes: try this first
      python train.py                    the full training set
The adapter is saved to ./<RUN_NAME>/adapter. With PUSH_TO_HUB=1 it is also pushed to the model hub.
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

# ---- the 4-bit base (from the LoRA and quantisation lesson) ----
pack = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,   # squeeze the packing notes too
)
tok = AutoTokenizer.from_pretrained(BASE_MODEL)
if tok.pad_token is None:  # added: some base models have no pad token and the trainer needs one
    tok.pad_token = tok.eos_token
model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, quantization_config=pack, device_map="auto")
print(model.get_memory_footprint() / 1e9, "GB")

# ---- the LoRA config (from the same lesson) ----
lora = LoraConfig(
    r=16,                    # thickness of the add-on
    lora_alpha=32,           # volume knob, here twice r
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],  # attention layers
    lora_dropout=0.05,       # switch off a little while training
    task_type="CAUSAL_LM",
)

# ---- the run settings (from the training run lesson) ----
args = SFTConfig(
    output_dir=RUN_NAME,
    num_train_epochs=1,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,      # acts like a batch of 32
    learning_rate=1e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    optim="paged_adamw_8bit",
    eval_strategy="steps", eval_steps=50,       # added: smaller than the lesson's 200 because the data is smaller
    save_steps=50,
    logging_steps=10,                           # added: so the loss curve has points to read
    push_to_hub=PUSH_TO_HUB,                    # added: off by default; on with PUSH_TO_HUB=1 and a hub login
    hub_model_id=f"{HUB_NAME}/{RUN_NAME}" if PUSH_TO_HUB and HUB_NAME else None,
    report_to="none",                           # added: use "wandb" if you have a dashboard account
    run_name=RUN_NAME,
    completion_only_loss=True,                  # added: the loss is about the price, not the description
)

# ---- data and trainer ----
sets = load_dataset("json", data_files={"train": "data/train.jsonl", "validation": "data/validation.jsonl"})
train_set = sets["train"].select(range(min(args_cli.subset, len(sets["train"])))) if args_cli.subset else sets["train"]
trainer = SFTTrainer(model=model, args=args, peft_config=lora,
                     train_dataset=train_set, eval_dataset=sets["validation"],
                     processing_class=tok)  # added: recent TRL versions take the tokenizer under this name
trainer.train()
trainer.model.save_pretrained(f"{RUN_NAME}/adapter")  # added: always save locally
if PUSH_TO_HUB and HUB_NAME:
    trainer.model.push_to_hub(f"{HUB_NAME}/{RUN_NAME}")   # then note the revision id
print("saved adapter to", f"{RUN_NAME}/adapter")
