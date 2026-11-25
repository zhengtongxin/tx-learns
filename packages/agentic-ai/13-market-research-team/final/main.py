# main.py: the start button.
from datetime import date

from dotenv import load_dotenv

from crew import PasarPicker

load_dotenv(override=True)


def run():
    # every {blank} in the two YAML files needs a key here: state and today
    inputs = {"state": "Singapore", "today": str(date.today())}
    result = PasarPicker().crew().kickoff(inputs=inputs)
    print(result.raw)


if __name__ == "__main__":
    run()
