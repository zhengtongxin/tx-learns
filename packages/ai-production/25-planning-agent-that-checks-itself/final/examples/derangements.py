# added: the kind of check the agent should write and run in the sandbox.
# 4 crane operators swap shifts so that nobody keeps their own: count the ways.
# Run it on your laptop to confirm the right answer (9) before you trust the agent.
from itertools import permutations

people = range(4)
count = sum(1 for p in permutations(people) if all(p[i] != i for i in people))
print(count)  # 9
