# recipe_cli.py: added. The lesson shows the two recipe functions but no way to call them.
#   python recipe_cli.py suggest 2        ask the improver for a better recipe after round 2
#   python recipe_cli.py list             show the pending suggestions
#   python recipe_cli.py approve 0 Aisha  a person approves suggestion 0 (refused if it drops "wait for a person")
import sys

from improver import suggest_recipe_edit, approve_recipe_edit, edits

command = sys.argv[1] if len(sys.argv) > 1 else "list"
if command == "suggest":
    suggest_recipe_edit(int(sys.argv[2]))
    print("saved as pending in recipe_edits.json")
elif command == "approve":
    approve_recipe_edit(int(sys.argv[2]), sys.argv[3])
    print("recipe.txt updated")
else:
    for i, edit in enumerate(edits()):
        print(i, edit["status"], "|", edit["why"])
