"""Offline check (no key, no download): the files load, the test set parses, keyword ranking works."""
import os
os.environ.setdefault("OPENAI_API_KEY", "test-not-a-real-key")  # never used: no model is called here
import helper

docs = helper.load_docs()
assert len(docs) == 8, len(docs)
assert {d.metadata["kind"] for d in docs} == {"staff", "services", "notices"}
tests = helper.load_tests()
assert len(tests) == 6 and {t["category"] for t in tests} == {"direct", "relationship", "holistic"}
# every test keyword really appears somewhere in the files, so a miss later is the search's fault
text = " ".join(d.page_content.lower() for d in docs)
for t in tests:
    for w in t["keywords"]:
        assert w.lower() in text, w
assert helper.first_rank("fee", docs) is not None and helper.first_rank("zzz", docs) is None
print("ok:", len(docs), "files,", len(tests), "tests, keywords all present")
