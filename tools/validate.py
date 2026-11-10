"""Check every test case against a reference solution and print the exact expected output."""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
from solutions import SOLUTIONS  # noqa: E402

data = json.loads((HERE / "problems.json").read_text())
failures = 0
for problem in data["problems"]:
    solution = SOLUTIONS.get(problem["id"])
    if solution is None:
        continue
    for index, test in enumerate(problem["tests"], 1):
        try:
            got = solution(test["input"])
        except Exception as exc:  # a reference solution must not raise
            print(f"  RAISED {problem['id']} test {index}: {exc!r}")
            failures += 1
            continue
        if got.strip() != test["expected"].strip():
            failures += 1
            print(f"  MISMATCH {problem['id']} test {index}")
            print(f"    input    {test['input']!r}")
            print(f"    expected {test['expected']!r}")
            print(f"    got      {got!r}")
print("python problems checked:", len(SOLUTIONS), "| failures:", failures)
sys.exit(1 if failures else 0)
