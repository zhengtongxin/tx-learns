MEETING MINUTES WRITER
======================

What you build
--------------
Mdm Tan chairs the monthly residents' meeting at the void deck. You record it
on a phone. Two open models then turn the recording into minutes:
  - ears: a speech-recognition model turns the audio into a transcript;
  - brain: a small open chat model (loaded in 4-bit so it fits on a small GPU)
    writes minutes with a summary, discussion points, decisions and action
    items with owners.
For long meetings it splits the transcript into chunks, summarises each chunk,
then summarises the summaries. A list of real names in the prompt helps the
model fix misspelled names. No paid API is involved.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env (model names, optional hub token)
  final/
    minutes.py           complete working version
    sample_transcript.txt invented transcript so you can skip the audio step
    test_split.py        offline check of the chunking helper
  starter/
    minutes.py           same layout, with TODO stubs
    sample_transcript.txt
    test_split.py        passes once split_text is done

Requirements
------------
  - Python 3.10 or newer
  - A CUDA GPU. A free cloud notebook GPU (about 15 GB memory) is enough for a
    3B to 8B chat model in 4-bit. bitsandbytes needs an NVIDIA GPU; it will
    not run on a CPU-only laptop. If you have none, use a cloud notebook and
    upload these files.
  - ffmpeg installed (the speech model needs it to read mp3 files)
  - Packages: see requirements.txt (torch, transformers, accelerate, bitsandbytes)
  - Disk space for downloads: a few GB on the first run
  - A model hub token only if the chat model you choose is gated

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit it; the defaults work without a token)

Run
---
  cd final
  python minutes.py --text sample_transcript.txt        (no audio needed)
  python minutes.py --audio residents_meeting.mp3       (your own recording)
  python minutes.py --text sample_transcript.txt --long (chunked path)

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no GPU, no download):
  cd final
  python test_split.py
  -> ok: split_text made 5 chunks and lost nothing

With a GPU, the sample transcript prints minutes that stream onto the screen
in markdown. Expect roughly: a one-line summary; discussion points about the
lift, the noticeboard and the open house; a decision to take down notices
older than a month; action items for Wei Jie (tables) and Auntie Lim (tent);
and the basketball court as an open question. Wording changes each run.

One failure case: the transcript is empty or the speech step errors.
  Usually the audio file is in an odd format or sampling rate, or ffmpeg is
  missing. Convert it (for example to a 16 kHz wav) and install ffmpeg.
Another: "CUDA out of memory". The chat model is too big. Pick a smaller
  CHAT_MODEL in .env, or restart the runtime and run only one model at a time.
Another: the minutes only cover the start of a long meeting. Use --long.

Cost note (approximate)
-----------------------
No per-call bill. The cost is GPU time: free on a free notebook tier, or a
few cents to a dollar per hour on a rented GPU. First runs also download a few
gigabytes. Prices vary, so check your provider.

Clean up
--------
  Stop the notebook or runtime so the GPU is released.
  deactivate
  rm -rf .venv .env
  Downloaded models sit in the model hub cache (usually ~/.cache/huggingface);
  delete that folder to free the space.

What changed since the previous lesson
--------------------------------------
Earlier lessons showed pipelines (lesson on pipelines) and loading a chat
model with its tokenizer, chat template and 4-bit settings. This project
chains two of them: a speech pipeline feeds the chat model. New: the minutes
prompt, a streamer for the output, the chunk-then-summarise helper and the
names list. Added to make it run on its own: model names read from .env, a
load function instead of loading at import time, and a small command line.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_split.py in final/ prints an ok line with no GPU and no download.
- python minutes.py --text sample_transcript.txt streams minutes with a summary, decisions and action items with owners.
- Names listed in the prompt come out spelled correctly in the minutes.
- With --long, a long transcript is split into chunks, each chunk is summarised, then the summaries are summarised.
- Every action item names an owner from the transcript.

Compare your work with final/ afterwards, starting with: minutes.py, test_split.py, the chunking function.

验收标准（中文）
- 在 final/ 里运行 python test_split.py，打印 ok 行，不需要 GPU，也不用下载。
- python minutes.py --text sample_transcript.txt 流式输出纪要：摘要、决定，以及带负责人的待办事项。
- 提示词里列出的人名，在纪要中拼写正确。
- 加上 --long，长文字稿被切成多段，每段先摘要，再对这些摘要做摘要。
- 每个待办事项都写明文字稿里出现过的负责人。
