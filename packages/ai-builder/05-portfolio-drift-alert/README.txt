Portfolio drift alert: package
==============================
What this is: a daily n8n workflow that checks how far each holding has drifted
from its target share and builds an alert when one is more than 5 points off.
It is a learning exercise, not financial advice. It never trades.

Folders
  starter/   the same files with the two functions left empty. Fill them in.
  final/     a finished version to compare with after you have tried.

What you need
  - Node.js 18 or newer, only for the offline check (no install step).
  - An n8n account (the free Cloud trial is fine) to run the workflow.
  - Optional for the alert: a Telegram bot token from @BotFather, or a Gmail
    account, and a model API key if you add the AI wording step.

Offline check (no keys, no network)
  cd final
  node test_rebalance.js
  It prints one "ok:" line. Run it in starter/ first: it fails until you finish.

Run it in n8n
  1. In n8n choose Create workflow, then the three dots, then Import from file,
     and pick final/workflow.json.
  2. Click Execute workflow. The Message node shows one alert for WORLD-ETF.
  3. Replace the Holdings node with a Google Sheets or HTTP Request node.
  4. Add a Telegram or Gmail node after Message, and the AI wording step from
     the lesson if you want one.
  If the import complains about a node, rebuild that node by hand from the
  lesson: node settings change between n8n versions.

The prices in portfolio.json are made up. The lesson page and this package
differ in one way: the page keeps the functions in one Code node, the package
also keeps them in rebalance.js so they can be tested without n8n.
