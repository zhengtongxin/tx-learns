# compare_runs.py: line up the two newest saved runs and say what got worse.
# added: the lesson ends with this as a comment; here it is a small script.
#   python compare_runs.py
import sys

from scoreboard import list_runs, compare

runs = list_runs()
if len(runs) < 2:
    sys.exit("need two saved runs first: start two evaluations (see README)")
worse = compare(runs[-2], runs[-1])
print("worse:", worse or "nothing")
