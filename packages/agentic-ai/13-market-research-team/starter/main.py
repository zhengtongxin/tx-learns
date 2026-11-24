# main.py: the start button.
from datetime import date

from dotenv import load_dotenv

from crew import PasarPicker

load_dotenv(override=True)


def run():
    # every {blank} in the two YAML files needs a key here: state and today
    # TODO: write this function
    # Hint: inputs = {"state": ..., "today": str(date.today())}, then PasarPicker().crew().kickoff(inputs=inputs)
    raise NotImplementedError("TODO")


if __name__ == "__main__":
    run()
