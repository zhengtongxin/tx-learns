"""Offline check (no key, no network): page_text strips scripts and styles."""
import os
os.environ.setdefault("OPENAI_API_KEY", "test-not-a-real-key")  # the client only needs something to start
import brochure

brochure.fetch = lambda url: "<html><style>x{}</style><script>bad()</script><h1>Ah Boy Gadgets</h1><p>Second-hand phones.</p></html>"
text = brochure.page_text("http://local.test")
assert "Ah Boy Gadgets" in text and "bad()" not in text and "x{}" not in text
print("ok: page_text keeps words and drops scripts and styles")
