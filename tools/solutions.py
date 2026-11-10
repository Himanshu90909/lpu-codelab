"""Reference solutions, used only to prove that every test case is satisfiable and that the
expected output is exactly what a correct program prints."""


def registration(data):
    name, programme = data.split("\n")[:2]
    return f"{name} ({programme}) is ready for the Term End Examination."


def even_tally(data):
    lines = data.split("\n")
    values = list(map(int, lines[1].split()))[: int(lines[0])]
    evens = [v for v in values if v % 2 == 0]
    return f"{sum(evens)}\n{len(evens)}"


def second_largest(data):
    lines = data.split("\n")
    scores = list(map(int, lines[1].split()))[: int(lines[0])]
    distinct = sorted(set(scores), reverse=True)
    return str(distinct[1]) if len(distinct) > 1 else "NA"


def word_frequency(data):
    counts = {}
    for w in data.split():
        w = w.lower()
        counts[w] = counts.get(w, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return "\n".join(f"{w}:{c}" for w, c in ordered)


def transpose(data):
    lines = data.split("\n")
    r, c = map(int, lines[0].split())
    grid = [list(map(int, lines[1 + i].split())) for i in range(r)]
    return "\n".join(" ".join(str(grid[i][j]) for i in range(r)) for j in range(c))


def palindrome(data):
    s = "".join(ch.lower() for ch in data.strip() if ch.isalnum())
    return "YES" if s == s[::-1] else "NO"


def balanced(data):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in data.strip():
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return "NO"
    return "YES" if not stack else "NO"


def pair_target(data):
    lines = data.split("\n")
    n = int(lines[0])
    amounts = list(map(int, lines[1].split()))[:n]
    target = int(lines[2])
    for i in range(n):
        for j in range(n - 1, i, -1):
            if amounts[i] + amounts[j] == target:
                return f"{i} {j}"
    return "NA"


def rotate(data):
    lines = data.split("\n")
    n, k = map(int, lines[0].split())
    roster = lines[1].split()[:n]
    k %= n
    rotated = roster[-k:] + roster[:-k] if k else roster
    return " ".join(rotated)


def next_greater(data):
    lines = data.split("\n")
    values = list(map(int, lines[1].split()))[: int(lines[0])]
    out, stack = [-1] * len(values), []
    for i, v in enumerate(values):
        while stack and values[stack[-1]] < v:
            out[stack.pop()] = v
        stack.append(i)
    return " ".join(map(str, out))


def queue_two_stacks(data):
    ops = data.split("\n")[1:]
    ins, out_stack, printed = [], [], []
    for op in ops:
        if not op.strip():
            continue
        if op.startswith("push"):
            ins.append(op.split()[1])
        elif op == "size":
            printed.append(str(len(ins) + len(out_stack)))
        else:
            if not out_stack:
                while ins:
                    out_stack.append(ins.pop())
            if not out_stack:
                printed.append("EMPTY")
                continue
            printed.append(out_stack[-1] if op == "front" else out_stack.pop())
    return "\n".join(printed)


def merge_lists(data):
    lines = data.split("\n")
    n = int(lines[0])
    a = list(map(int, lines[1].split()))[:n] if n else []
    m = int(lines[2])
    b = list(map(int, lines[3].split()))[:m] if m else []
    merged, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            merged.append(a[i]); i += 1
        else:
            merged.append(b[j]); j += 1
    merged += a[i:] + b[j:]
    return " ".join(map(str, merged))


def bst_traversals(data):
    lines = data.split("\n")
    keys = list(map(int, lines[1].split()))[: int(lines[0])]
    left, right, root = {}, {}, None

    def insert(node, key):
        if node is None:
            return key
        if key < node:
            left[node] = insert(left.get(node), key)
        else:
            right[node] = insert(right.get(node), key)
        return node

    for k in keys:
        root = insert(root, k)

    def inorder(node, acc):
        if node is None:
            return acc
        inorder(left.get(node), acc); acc.append(node); inorder(right.get(node), acc)
        return acc

    def preorder(node, acc):
        if node is None:
            return acc
        acc.append(node); preorder(left.get(node), acc); preorder(right.get(node), acc)
        return acc

    def height(node):
        if node is None:
            return -1
        return 1 + max(height(left.get(node)), height(right.get(node)))

    return "\n".join([
        " ".join(map(str, inorder(root, []))),
        " ".join(map(str, preorder(root, []))),
        str(height(root)),
    ])


SOLUTIONS = {
    "py-registration": registration,
    "py-even-tally": even_tally,
    "py-second-largest": second_largest,
    "py-word-frequency": word_frequency,
    "py-transpose": transpose,
    "py-palindrome": palindrome,
    "py-balanced": balanced,
    "ds-pair-target": pair_target,
    "ds-rotate": rotate,
    "ds-next-greater": next_greater,
    "ds-queue-two-stacks": queue_two_stacks,
    "ds-merge-lists": merge_lists,
    "ds-bst-traversals": bst_traversals,
}
