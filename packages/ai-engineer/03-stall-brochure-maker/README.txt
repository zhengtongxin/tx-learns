STALL BROCHURE MAKER
====================

What you build
--------------
Ah Boy sells second-hand gadgets online. You give this tool a web address and
it hands back one short brochure. It makes two chained model calls:
  1. the model looks at every link on the landing page and picks the useful
     ones (about, careers) and skips the rest (privacy, terms);
  2. the model writes a short markdown brochure from those pages.
Plain code does the fetching and the cutting. The model only makes the
fuzzy choices. An optional --stream flag prints words as they arrive.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env and add your key
  final/
    brochure.py          complete working version
    test_offline.py      a check that needs no key and no network
  starter/
    brochure.py          same layout, with TODO stubs for you to fill in
    test_offline.py      the same check (passes once page_text is done)

Requirements
------------
  - Python 3.10 or newer
  - Packages: see requirements.txt (openai, requests, beautifulsoup4, python-dotenv)
  - An OpenAI API key (an account with a little credit)
  - Internet access to reach the model and the site you point it at

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit .env and replace YOUR_KEY_HERE)

Run
---
  cd final
  python brochure.py https://example.com
  python brochure.py https://example.com --stream

To work on the starter instead: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no key needed):
  cd final
  python test_offline.py
  -> ok: page_text keeps words and drops scripts and styles

With a key, a real site gives a short markdown brochure: a heading, a few
bullets or paragraphs about the business, and a careers line if the site has
one. The exact words change on every run. example.com is nearly empty, so its
brochure will be very thin. Try a small shop site with an About page.

One failure case: "403 Client Error" or an almost empty brochure.
  Some sites block scrapers, and pages that draw themselves with JavaScript
  come back nearly empty. This is a limit of the simple fetch helper, not of
  the model. Fix: try another site, or save the page text by hand and feed it in.
Another: "KeyError: 'links'". The model's JSON used a different shape. Run it
  again, or tighten the example in link_system.

Cost note (approximate)
-----------------------
Each brochure makes two model calls with at most about 5000 characters of
page text, so it typically costs a fraction of a cent to a few cents. Prices
change, so check your provider's page.

Clean up
--------
  deactivate                          (leave the virtual environment)
  rm -rf .venv .env                   (remove the environment and your key file)
Nothing else is created. Rotate or delete the API key in your provider's
dashboard if you no longer need it.

What changed since the previous lesson
--------------------------------------
This is the first project, so there is no earlier package. New here compared
with the single call in lesson 1: a page fetcher, a second call that returns
JSON (parsed with json.loads), a length cut, and streaming.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_offline.py in final/ prints an ok line ('page_text keeps words and drops scripts and styles') and needs no key.
- python brochure.py on a small shop site with an About page prints a markdown brochure with a heading and a short body.
- If the site has a careers page, the brochure ends with a careers line.
- Changing one word in the brochure prompt (warm to funny) visibly changes the tone.
- With --stream the words appear as they arrive, not all at once.

Compare your work with final/ afterwards, starting with brochure.py, test_offline.py and the page_text function.

验收标准（中文）
- 在 final/ 里运行 python test_offline.py，打印 ok 行（“page_text keeps words and drops scripts and styles”），不需要密钥。
- 对一个有“关于我们”页面的小店网站运行 python brochure.py，打印带标题和简短正文的 markdown 宣传册。
- 如果网站有招聘页，宣传册末尾有一句招聘说明。
- 把宣传册提示词里的一个词（warm 改成 funny），语气会明显改变。
- 加上 --stream，文字逐步出现，而不是一次全部出现。
