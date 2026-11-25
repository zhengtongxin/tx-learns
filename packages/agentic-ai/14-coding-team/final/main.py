# main.py: one kickoff, a working app.
import shutil

from dotenv import load_dotenv

from crew import TabTeam
from tools.box import BOX

load_dotenv(override=True)

REQS = """
A tab system for regular customers at a drinks stall.
Open a tab, top up cash, record orders (item, qty) using get_price(item),
with fixed test prices: teh_tarik 2.00, kopi_o 1.60, roti_canai 1.50 (S$).
Block orders that would make the balance negative.
Report balance, items ordered, and a full history.
"""


def clear_sandbox():
    # added: the lesson's "what I got wrong": an old file made the tester test yesterday's code
    for item in BOX.iterdir():
        shutil.rmtree(item) if item.is_dir() else item.unlink()


def run():
    clear_sandbox()
    TabTeam().crew().kickoff(inputs={
        "requirements": REQS,
        "module_name": "tabs",
    })


if __name__ == "__main__":
    run()
