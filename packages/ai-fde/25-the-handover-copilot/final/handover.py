# handover.py: what the copilot may say about the pilot, and a leftover check for the teardown (Step 6).
import datetime
import json
import subprocess

from criteria import check


def handover_facts():
    """What the copilot may say about the pilot."""
    # added: the notes file is .txt here (the lesson says .md) so it downloads from the site
    return {"notes": open("pilot_notes.txt").read(), "criteria": check(json.load(open("measured.json")))}


def aws(*args):
    out = subprocess.run(["aws", *args, "--output", "json"], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def leftovers():
    return aws("resourcegroupstaggingapi", "get-resources", "--tag-filters", "Key=project,Values=kaya-pilot",
               "--query", "ResourceTagMappingList[].ResourceARN")


def spent_last_week():
    today = datetime.date.today()
    amounts = aws("ce", "get-cost-and-usage", "--time-period", "Start=%s,End=%s" % (today - datetime.timedelta(days=7), today),
                  "--granularity", "DAILY", "--metrics", "UnblendedCost", "--query", "ResultsByTime[].Total.UnblendedCost.Amount")
    return round(sum(float(a) for a in amounts), 2)


if __name__ == "__main__":
    # Run this AFTER a person has torn the infrastructure down (for example terraform destroy).
    left = leftovers()
    print(len(left), "tagged resources still exist")
    for arn in left:
        print("  ", arn)
    print("spent in the last 7 days: $", spent_last_week())
