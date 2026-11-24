# handover.py: what the copilot may say about the pilot, and a leftover check for the teardown (Step 6).
import datetime
import json
import subprocess

from criteria import check


def handover_facts():
    """What the copilot may say about the pilot."""
    # TODO: the pilot notes text and the criteria results from measured.json
    raise NotImplementedError("TODO: handover_facts")


def aws(*args):
    out = subprocess.run(["aws", *args, "--output", "json"], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def leftovers():
    # TODO: ask the cloud for resources tagged project=kaya-pilot
    raise NotImplementedError("TODO: leftovers")


def spent_last_week():
    # TODO: add up the last 7 days of cost
    raise NotImplementedError("TODO: spent_last_week")


if __name__ == "__main__":
    # Run this AFTER a person has torn the infrastructure down (for example terraform destroy).
    left = leftovers()
    print(len(left), "tagged resources still exist")
    for arn in left:
        print("  ", arn)
    print("spent in the last 7 days: $", spent_last_week())
