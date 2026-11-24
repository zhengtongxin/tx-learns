"""Offline check (no key, no network): fence stripping and the Python timing helper."""
import os
os.environ.setdefault("OPENAI_API_KEY", "test-not-a-real-key")  # the client only needs something to start
import translate

reply = "```cpp\n#include <iostream>\nint main(){std::cout<<1;}\n```"
cleaned = translate.strip_fences(reply)
assert "```" not in cleaned and "#include" in cleaned
out, secs = translate.run_python("hard_program.py")
assert out.startswith("best run:") and "hash:" in out
print(f"ok: fences stripped; python reference printed {out.splitlines()[0]!r} in {secs:.1f}s")
