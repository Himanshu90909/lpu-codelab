/* CodeLab problem bank — Lovely Professional University.
   Every problem is judged by comparing the program's stdout with the expected output for
   each test case. `note` explains the specific mistake that test catches, which is what the
   coach uses to name a misconception instead of just saying "wrong answer". */

window.CODELAB_COURSES = [
  { code: 'INT108', title: 'Python Programming', term: 'Semester 1', owner: 'Department of Computer Science' },
  { code: 'CSE205', title: 'Data Structures', term: 'Semester 3', owner: 'School of Computer Science and Engineering' },
  { code: 'CSE325', title: 'Web Technologies', term: 'Semester 5', owner: 'School of Computer Science and Engineering' },
];

window.CODELAB_LABS = [
  { id: 'py-1', course: 'INT108', title: 'Lab 1 · Getting input right', note: 'Reading a line, splitting it, printing exactly what was asked.' },
  { id: 'py-2', course: 'INT108', title: 'Lab 2 · Loops and collections', note: 'Accumulators, lists, dictionaries and the edge cases that break them.' },
  { id: 'py-3', course: 'INT108', title: 'Lab 3 · Strings and recursion-free stacks', note: 'Two pointers over text, and why a list is a stack.' },
  { id: 'ds-1', course: 'CSE205', title: 'Lab 1 · Two pointers on arrays', note: 'Sorted input plus a target is a two-pointer problem, not a nested loop.' },
  { id: 'ds-2', course: 'CSE205', title: 'Lab 2 · Stacks and queues', note: 'Monotonic stacks, and a queue built out of two stacks.' },
  { id: 'ds-3', course: 'CSE205', title: 'Lab 3 · Merging and tree traversals', note: 'Merge invariants and the three traversals that follow from a BST.' },
  { id: 'web-1', course: 'CSE325', title: 'Lab 1 · String handling in JavaScript', note: 'Splitting, mapping and joining without losing characters.' },
];

window.CODELAB_PROBLEMS = [
  {
    id: 'py-registration',
    lab: 'py-1',
    title: 'Registration slip',
    difficulty: 'Easy',
    tags: ['input', 'f-strings'],
    marks: 5,
    statement: `The examination desk prints a slip for every registered student.

Read **two lines**: the student's full name, then the programme code. Print one line:

\`NAME (CODE) is ready for the Term End Examination.\`

Keep the name exactly as it arrived, including any middle name.`,
    inputSpec: 'Line 1: full name. Line 2: programme code.',
    outputSpec: 'One line, in the format shown above.',
    samples: [{ input: 'Ananya Rao\nB.Tech CSE', output: 'Ananya Rao (B.Tech CSE) is ready for the Term End Examination.' }],
    starter: `name = input()
programme = input()
# print the slip
`,
    tests: [
      { input: 'Ananya Rao\nB.Tech CSE', expected: 'Ananya Rao (B.Tech CSE) is ready for the Term End Examination.', tag: 'format', note: 'The exact sentence matters: the checker compares characters, not meaning.' },
      { input: 'Vikram Shetty\nBBA', expected: 'Vikram Shetty (BBA) is ready for the Term End Examination.', tag: 'format', note: 'Programme codes are printed as given, never expanded or title-cased.' },
      { input: 'Meera Nair Krishnan\nB.Tech DSAI', expected: 'Meera Nair Krishnan (B.Tech DSAI) is ready for the Term End Examination.', tag: 'input', note: 'A middle name must survive: read the whole line, do not split and keep [0].' },
    ],
    hints: [
      'Both values arrive on separate lines, so two `input()` calls are enough.',
      'Print the name and the code inside one f-string so the punctuation stays in your control.',
      'The full stop at the end of the sentence is part of the expected output.',
    ],
  },
  {
    id: 'py-even-tally',
    lab: 'py-2',
    title: 'Even attendance tally',
    difficulty: 'Easy',
    tags: ['loops', 'accumulator'],
    marks: 5,
    statement: `A tutor counts how many students sat the practical and how much of it they attended.

Read \`n\`, then \`n\` integers. Print two lines:

1. the sum of the even values
2. how many values were even

Negative values count too: \`-4\` is even.`,
    inputSpec: 'Line 1: n. Line 2: n integers separated by spaces.',
    outputSpec: 'Line 1: sum of even values. Line 2: count of even values.',
    samples: [{ input: '5\n1 2 3 4 5', output: '6\n2' }],
    starter: `n = int(input())
values = list(map(int, input().split()))
total = 0
count = 0
# add to total and count only for even values
print(total)
print(count)
`,
    tests: [
      { input: '5\n1 2 3 4 5', expected: '6\n2', tag: 'loops', note: 'A single pass with an accumulator is enough; no sorting needed.' },
      { input: '3\n1 3 5', expected: '0\n0', tag: 'edge-empty', note: 'No even value is a valid answer: the count must be 0, not blank.' },
      { input: '4\n-2 -4 7 8', expected: '2\n3', tag: 'negative', note: '`-2 % 2` is 0 in Python, so negative even numbers belong in the tally.' },
      { input: '1\n0', expected: '0\n1', tag: 'edge-empty', note: 'Zero is even. A truthiness check (`if v`) silently drops it.' },
    ],
    hints: [
      '`value % 2 == 0` is the test for even, and it holds for negatives and zero in Python.',
      'Keep two accumulators: one for the sum, one for the count.',
      'Print both lines at the end so an empty case still prints `0`.',
    ],
  },
  {
    id: 'py-second-largest',
    lab: 'py-2',
    title: 'Second highest score',
    difficulty: 'Medium',
    tags: ['lists', 'sorting', 'edge-cases'],
    marks: 10,
    statement: `A class wants the second highest **distinct** score for the internal report.

Read \`n\`, then \`n\` integers. Print the second highest distinct value, or \`NA\` when there are fewer than two distinct values.

Repeated scores are one score: in \`7 7 7 4\` the second highest is \`4\`.`,
    inputSpec: 'Line 1: n. Line 2: n integers (may contain repeats).',
    outputSpec: 'The second highest distinct value, or NA.',
    samples: [{ input: '5\n10 4 9 9 2', output: '9' }],
    starter: `n = int(input())
scores = list(map(int, input().split()))
# second highest distinct value, or "NA"
`,
    tests: [
      { input: '5\n10 4 9 9 2', expected: '9', tag: 'duplicates', note: 'A repeated top score is the same score, so the answer is 9 and not 9 from another index.' },
      { input: '3\n7 7 7', expected: 'NA', tag: 'duplicates', note: 'One distinct value means there is no second highest, so print NA.' },
      { input: '2\n5 1', expected: '1', tag: 'sorting', note: '`sorted()[1]` is wrong here only because repeats are not removed first.' },
      { input: '1\n4', expected: 'NA', tag: 'edge-empty', note: 'A single score has no second place.' },
      { input: '4\n-5 -1 -9 -1', expected: '-5', tag: 'negative', note: 'Starting your maximum at 0 breaks as soon as every score is negative.' },
    ],
    hints: [
      '`sorted(set(scores))` gives the distinct values in order.',
      'Check the length before indexing: a one-element list has no index 1.',
      'Guard the whole answer with `if len(distinct) < 2: print("NA")`.',
    ],
  },
  {
    id: 'py-word-frequency',
    lab: 'py-2',
    title: 'Word frequency in a notice',
    difficulty: 'Medium',
    tags: ['dict', 'sorting'],
    marks: 10,
    statement: `The notice board has too many repeated words. Count them.

Read one line of space-separated words. Ignore case: \`LPU\` and \`lpu\` are the same word. Print each distinct word in lowercase as \`word:count\`, ordered by **count descending**, and for equal counts alphabetically.

Every word gets its own line.`,
    inputSpec: 'One line of words separated by single spaces.',
    outputSpec: 'One line per distinct word, word:count.',
    samples: [{ input: 'the cat the dog the', output: 'the:3\ncat:1\ndog:1' }],
    starter: `words = input().split()
# lowercase, count, sort by (-count, word), then print word:count
`,
    tests: [
      { input: 'the cat the dog the', expected: 'the:3\ncat:1\ndog:1', tag: 'sorting', note: 'Sorting by count alone leaves ties in insertion order; both keys are needed.' },
      { input: 'a b b c c c', expected: 'c:3\nb:2\na:1', tag: 'dict', note: 'A dictionary keeps counts fine; the order of printing is what you must control.' },
      { input: 'LPU lpu Lovely', expected: 'lpu:2\nlovely:1', tag: 'case', note: 'Lowercase before counting, otherwise LPU and lpu become two words.' },
      { input: 'solo', expected: 'solo:1', tag: 'edge-empty', note: 'One word still needs the `:count` suffix.' },
    ],
    hints: [
      'Lowercase every word first: `word.lower()`.',
      'Sort with a tuple key: `sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))`.',
      'The tie-break is alphabetical, so `a:1` comes before `dog:1`.',
    ],
  },
  {
    id: 'py-transpose',
    lab: 'py-2',
    title: 'Transpose a seating grid',
    difficulty: 'Medium',
    tags: ['nested-lists', 'loops'],
    marks: 10,
    statement: `An examination hall is described as a grid: \`r\` rows of \`c\` seats. Print the grid transposed, one row per line, values separated by single spaces.`,
    inputSpec: 'Line 1: r c. Next r lines: c integers each.',
    outputSpec: 'c lines, each with r integers.',
    samples: [{ input: '2 3\n1 2 3\n4 5 6', output: '1 4\n2 5\n3 6' }],
    starter: `r, c = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(r)]
# print r x c grid transposed
`,
    tests: [
      { input: '2 3\n1 2 3\n4 5 6', expected: '1 4\n2 5\n3 6', tag: 'nested-lists', note: 'The new row count is c, not r: swap the loops.' },
      { input: '3 2\n1 2\n3 4\n5 6', expected: '1 3 5\n2 4 6', tag: 'nested-lists', note: 'A square grid can hide a bug that only appears when r and c differ.' },
      { input: '1 1\n5', expected: '5', tag: 'edge-empty', note: 'A 1x1 grid transposes to itself.' },
    ],
    hints: [
      'Loop over columns on the outside: `for j in range(c)`.',
      'Inside, collect `grid[i][j]` for every row.',
      '`print(*row)` prints a list with single spaces and no brackets.',
    ],
  },
  {
    id: 'py-palindrome',
    lab: 'py-3',
    title: 'Palindrome under protest',
    difficulty: 'Easy',
    tags: ['strings'],
    marks: 5,
    statement: `A phrase is a palindrome if it reads the same forwards and backwards once punctuation, spaces and case are ignored.

Read one line. Print \`YES\` or \`NO\`.

\`A man, a plan, a canal: Panama\` is a palindrome.`,
    inputSpec: 'One line of text.',
    outputSpec: 'YES or NO.',
    samples: [{ input: 'Madam', output: 'YES' }],
    starter: `text = input()
# uppercase YES / NO
`,
    tests: [
      { input: 'Madam', expected: 'YES', tag: 'case', note: 'Compare in one case only; M and m must match.' },
      { input: 'A man, a plan, a canal: Panama', expected: 'YES', tag: 'filter', note: 'Punctuation and spaces must be removed before comparing.' },
      { input: 'LPU 2026', expected: 'NO', tag: 'filter', note: 'Digits are part of the text and do count.' },
      { input: "No 'x' in Nixon", expected: 'YES', tag: 'filter', note: 'Apostrophes are punctuation and must be dropped.' },
      { input: '...', expected: 'YES', tag: 'edge-empty', note: 'Nothing left to compare is a palindrome: that is a deliberate edge case.' },
    ],
    hints: [
      '`ch.isalnum()` keeps letters and digits and drops everything else.',
      'Build one lowercase string, then compare it with its reverse: `s == s[::-1]`.',
      'The empty-after-cleaning case should print YES.',
    ],
  },
  {
    id: 'py-balanced',
    lab: 'py-3',
    title: 'Balanced brackets',
    difficulty: 'Medium',
    tags: ['stacks', 'strings'],
    marks: 10,
    statement: `Read one line containing only brackets: \`( \`, \`) \`, \`[ \`, \`] \`, \`{ \`, \`}\`. Print \`YES\` if every bracket is closed in the right order, otherwise \`NO\`.`,
    inputSpec: 'One line of bracket characters.',
    outputSpec: 'YES or NO.',
    samples: [{ input: '([]{})', output: 'YES' }],
    starter: `line = input()
# a list is a stack: append to push, pop to pop
`,
    tests: [
      { input: '([]{})', expected: 'YES', tag: 'stacks', note: 'Matching types, not just counts, is the rule.' },
      { input: '([)]', expected: 'NO', tag: 'stacks', note: 'Wrong order of closing: the top of the stack decides, not the next bracket.' },
      { input: '(((', expected: 'NO', tag: 'edge-empty', note: 'A leftover stack at the end means unclosed brackets.' },
      { input: '', expected: 'YES', tag: 'edge-empty', note: 'An empty line has nothing unclosed.' },
      { input: '}{', expected: 'NO', tag: 'stacks', note: 'A closing bracket with an empty stack fails immediately.' },
    ],
    hints: [
      'Push every opening bracket.',
      'On a closing bracket, pop and check the pair matches; if the stack is empty, answer NO.',
      'At the end the answer is YES only when the stack is empty.',
    ],
  },
  {
    id: 'ds-pair-target',
    lab: 'ds-1',
    title: 'Fee pair reconciliation',
    difficulty: 'Medium',
    tags: ['two-pointers', 'arrays'],
    marks: 10,
    statement: `A sorted list of amounts must be reconciled against a target receipt.

Read \`n\`, then \`n\` integers in **non-decreasing order**, then the target. Print the two 0-based indices whose values add up to the target, the smaller index first, separated by a space.

When several pairs work, print the one with the **smallest first index**, and for that index the **largest** second index. If no pair works, print \`NA\`.`,
    inputSpec: 'Line 1: n. Line 2: n sorted integers. Line 3: target.',
    outputSpec: 'Two indices separated by a space, or NA.',
    samples: [{ input: '5\n1 2 3 4 6\n6', output: '1 3' }],
    starter: `n = int(input())
amounts = list(map(int, input().split()))
target = int(input())
# two pointers from both ends
`,
    tests: [
      { input: '5\n1 2 3 4 6\n6', expected: '1 3', tag: 'two-pointers', note: '2 + 4 is the pair; indices start at 0, so it prints 1 3.' },
      { input: '5\n1 2 3 4 6\n10', expected: '3 4', tag: 'two-pointers', note: 'Walk inward: when the sum is too small move the left pointer, too large move the right.' },
      { input: '5\n1 2 3 4 6\n100', expected: 'NA', tag: 'edge-empty', note: 'No pair means NA, not an empty line.' },
      { input: '4\n2 2 2 2\n4', expected: '0 3', tag: 'duplicates', note: 'Equal values are allowed as a pair as long as the indices differ; a scan from both ends meets 0 and 3 first.' },
      { input: '2\n1 1\n2', expected: '0 1', tag: 'edge-empty', note: 'The smallest legal input still needs a printed answer.' },
    ],
    hints: [
      'With sorted input a nested loop is unnecessary: `i` from the left, `j` from the right.',
      'If `amounts[i] + amounts[j]` is too small, `i += 1`; if too large, `j -= 1`; stop when `i >= j`.',
      'Because you walk outward-in, the first pair you meet already has the smallest first index.',
    ],
  },
  {
    id: 'ds-rotate',
    lab: 'ds-1',
    title: 'Shift the invigilation roster',
    difficulty: 'Medium',
    tags: ['arrays', 'modular-arithmetic'],
    marks: 10,
    statement: `A roster of \`n\` invigilators must rotate right by \`k\` positions.

Read \`n\` and \`k\`, then \`n\` names. Print the rotated roster on one line, space separated.

\`k\` may be larger than \`n\`; rotating by \`n\` returns the original order.`,
    inputSpec: 'Line 1: n k. Line 2: n names.',
    outputSpec: 'The rotated roster on one line.',
    samples: [{ input: '5 2\nA B C D E', output: 'D E A B C' }],
    starter: `n, k = map(int, input().split())
roster = input().split()
# rotate right by k
`,
    tests: [
      { input: '5 2\nA B C D E', expected: 'D E A B C', tag: 'modular-arithmetic', note: 'Right rotation moves the last k to the front.' },
      { input: '4 0\nA B C D', expected: 'A B C D', tag: 'edge-empty', note: 'k = 0 is a legal no-op, and slicing must not produce an extra copy.' },
      { input: '4 6\nA B C D', expected: 'C D A B', tag: 'modular-arithmetic', note: 'k greater than n must wrap: 6 mod 4 is 2.' },
      { input: '3 5\nX Y Z', expected: 'Y Z X', tag: 'modular-arithmetic', note: '5 mod 3 is 2, so the answer is Y Z X, not an index error.' },
    ],
    hints: [
      'Reduce first: `k %= len(roster)`.',
      'Slicing is the cleanest rotation: `roster[-k:] + roster[:-k]`.',
      'When `k` is 0 the slices must still work: `roster[-0:]` is the whole list, so handle it or use `k % n` carefully.',
    ],
  },
  {
    id: 'ds-next-greater',
    lab: 'ds-2',
    title: 'Next higher slot',
    difficulty: 'Hard',
    tags: ['stacks', 'monotonic'],
    marks: 15,
    statement: `For each seat number in a row, find the first larger number to its right.

Read \`n\`, then \`n\` integers. Print \`n\` integers on one line: for each position, the next greater value, or \`-1\` when none exists to the right.

A single monotonic stack solves this in one pass.`,
    inputSpec: 'Line 1: n. Line 2: n integers.',
    outputSpec: 'n values separated by spaces.',
    samples: [{ input: '4\n4 5 2 25', output: '5 25 25 -1' }],
    starter: `n = int(input())
values = list(map(int, input().split()))
# monotonic stack, O(n)
`,
    tests: [
      { input: '4\n4 5 2 25', expected: '5 25 25 -1', tag: 'monotonic', note: 'The 25 answers two positions at once: pop everything smaller when you meet it.' },
      { input: '3\n3 2 1', expected: '-1 -1 -1', tag: 'edge-empty', note: 'A strictly decreasing list has no next greater value at all.' },
      { input: '5\n1 3 2 4 3', expected: '3 4 4 -1 -1', tag: 'monotonic', note: 'The stack must keep indices, not values, or you cannot place the answers.' },
      { input: '1\n7', expected: '-1', tag: 'edge-empty', note: 'The last element never has a next greater value.' },
    ],
    hints: [
      'Keep a stack of indices whose answer is still unknown.',
      'While the stack is not empty and `values[stack[-1]] < values[i]`, pop and record `values[i]`.',
      'Everything left on the stack at the end answers `-1`.',
    ],
  },
  {
    id: 'ds-queue-two-stacks',
    lab: 'ds-2',
    title: 'Queue from two stacks',
    difficulty: 'Hard',
    tags: ['stacks', 'queues', 'amortised'],
    marks: 15,
    statement: `Implement a FIFO queue using only two stacks, then run a script of operations.

Read \`q\`, then \`q\` lines. Operations:

- \`push x\` — add x to the back
- \`pop\` — remove the front and print it, or \`EMPTY\`
- \`front\` — print the front without removing it, or \`EMPTY\`
- \`size\` — print how many items are queued

Only \`pop\`, \`front\` and \`size\` produce output.`,
    inputSpec: 'Line 1: q. Next q lines: one operation each.',
    outputSpec: 'One line per popping operation.',
    samples: [{ input: '6\npush 1\npush 2\nfront\npop\nfront\nsize', output: '1\n1\n2\n1' }],
    starter: `q = int(input())
# in_stack for pushes, out_stack for pops
`,
    tests: [
      { input: '6\npush 1\npush 2\nfront\npop\nfront\nsize', expected: '1\n1\n2\n1', tag: 'queues', note: 'FIFO: the first push must come out first, which a single stack cannot do.' },
      { input: '3\nfront\npop\nsize', expected: 'EMPTY\nEMPTY\n0', tag: 'edge-empty', note: 'Empty operations print EMPTY and must not raise.' },
      { input: '5\npush 5\npush 6\npop\npop\npop', expected: '5\n6\nEMPTY', tag: 'queues', note: 'After the queue drains, pop reports EMPTY again.' },
      { input: '7\npush 1\npush 2\npush 3\npop\npush 4\npop\npop', expected: '1\n2\n3', tag: 'amortised', note: 'Items pushed after a pop must queue behind the ones already waiting.' },
    ],
    hints: [
      'Push always goes to `in_stack`.',
      'On pop or front, if `out_stack` is empty, move everything from `in_stack` into it (that reverses the order).',
      'Then pop or peek `out_stack`; both stacks empty means EMPTY.',
    ],
  },
  {
    id: 'ds-merge-lists',
    lab: 'ds-3',
    title: 'Merge two sorted sections',
    difficulty: 'Medium',
    tags: ['merge', 'arrays'],
    marks: 10,
    statement: `Read two sorted lists and print the merged sorted list.

Input: \`n\`, then \`n\` integers; then \`m\`, then \`m\` integers. Both lists are non-decreasing. Print one line with all \`n + m\` values in order, duplicates included.`,
    inputSpec: 'Line 1: n. Line 2: n integers. Line 3: m. Line 4: m integers. A list line is still present when its count is 0; it is then empty.',
    outputSpec: 'One line of n + m integers.',
    samples: [{ input: '3\n1 4 7\n4\n2 3 9 10', output: '1 2 3 4 7 9 10' }],
    starter: `n = int(input())
a = list(map(int, input().split()))[:n]
m = int(input())
b = list(map(int, input().split()))[:m]
# merge in one pass
`,
    tests: [
      { input: '3\n1 4 7\n4\n2 3 9 10', expected: '1 2 3 4 7 9 10', tag: 'merge', note: 'Take the smaller head each step; do not sort again, and do not drop duplicates.' },
      { input: '1\n1\n1\n1', expected: '1 1', tag: 'merge', note: 'Equal values must both appear.' },
      { input: '2\n5 6\n3\n0 5 6', expected: '0 5 5 6 6', tag: 'merge', note: 'Interleaved duplicates catch a merge that advances only one side on equality.' },
      { input: '0\n\n3\n1 2 3', expected: '1 2 3', tag: 'edge-empty', note: 'An empty first list must still consume its (empty) line, or m is read from the wrong place.' },
    ],
    hints: [
      'Two pointers, one per list, plus a result list.',
      'Append the smaller head and advance that pointer; on equality either side is fine but advance only one.',
      'Drain whatever is left of both lists at the end.',
    ],
  },
  {
    id: 'ds-bst-traversals',
    lab: 'ds-3',
    title: 'BST insert and traverse',
    difficulty: 'Hard',
    tags: ['trees', 'recursion', 'traversal'],
    marks: 15,
    statement: `Insert \`n\` distinct keys into an empty binary search tree in the order given (smaller keys go left, larger go right), then print:

1. the inorder traversal
2. the preorder traversal
3. the height of the tree, where a single-node tree has height 0

Values on each traversal line are space separated.`,
    inputSpec: 'Line 1: n. Line 2: n distinct integers.',
    outputSpec: 'Three lines: inorder, preorder, height.',
    samples: [{ input: '5\n50 30 70 20 40', output: '20 30 40 50 70\n50 30 20 40 70\n2' }],
    starter: `n = int(input())
keys = list(map(int, input().split()))
# build the tree, then traverse
`,
    tests: [
      { input: '5\n50 30 70 20 40', expected: '20 30 40 50 70\n50 30 20 40 70\n2', tag: 'traversal', note: 'Inorder is sorted only because the tree is a BST; preorder starts at the root.' },
      { input: '1\n42', expected: '42\n42\n0', tag: 'edge-empty', note: 'A single node has height 0, not 1.' },
      { input: '4\n1 2 3 4', expected: '1 2 3 4\n1 2 3 4\n3', tag: 'trees', note: 'Sorted input degenerates into a chain, which is the worst-case height.' },
      { input: '5\n40 20 60 10 30', expected: '10 20 30 40 60\n40 20 10 30 60\n2', tag: 'trees', note: 'Insertion order decides the shape, so a balanced-looking input is not sorted input.' },
    ],
    hints: [
      'A node is a small dict or class with `key`, `left`, `right`.',
      'Insert by walking down: key < node.key goes left, otherwise right.',
      'Height is `1 + max(height(left), height(right))` with `-1` for a missing child, so a leaf is 0.',
    ],
  },
  {
    id: 'web-title-case',
    lab: 'web-1',
    title: 'Name plate formatter',
    difficulty: 'Easy',
    tags: ['strings', 'javascript'],
    marks: 5,
    statement: `The placement office prints name plates. Read one line containing a name and print it in title case: the first letter of each word uppercase, the rest lowercase.

Words are separated by single spaces.

JavaScript note: this problem is judged in the browser. Read input with \`readLine()\` and print with \`print()\`.`,
    inputSpec: 'One line containing the name.',
    outputSpec: 'The name in title case.',
    samples: [{ input: 'himanshu suthar', output: 'Himanshu Suthar' }],
    starter: `const line = readLine();
// print the title-cased name
`,
    tests: [
      { input: 'himanshu suthar', expected: 'Himanshu Suthar', tag: 'javascript', note: 'Split on spaces, then map each word.' },
      { input: 'LOVELY professional UNIVERSITY', expected: 'Lovely Professional University', tag: 'javascript', note: 'Uppercase input must be lowered before capitalising, not left alone.' },
      { input: 'a', expected: 'A', tag: 'edge-empty', note: 'One-letter words still need the uppercase first character.' },
    ],
    hints: [
      '`line.split(" ")` gives the words.',
      'For each word: `w[0].toUpperCase() + w.slice(1).toLowerCase()`.',
      'Join them back with a single space.',
    ],
  },
  {
    id: 'web-anagrams',
    lab: 'web-1',
    title: 'Group the anagrams',
    difficulty: 'Medium',
    tags: ['maps', 'sorting', 'javascript'],
    marks: 10,
    statement: `Read \`n\`, then \`n\` lowercase words. Group the words that are anagrams of each other and print one group per line: the group's words sorted alphabetically and joined by a space.

Print the groups in the order of their smallest word. Every word appears exactly once.`,
    inputSpec: 'Line 1: n. Line 2: n words separated by spaces.',
    outputSpec: 'One line per anagram group.',
    samples: [{ input: '6\neat tea tan ate nat bat', output: 'ate eat tea\nbat\nnat tan' }],
    starter: `const n = parseInt(readLine(), 10);
const words = readLine().split(" ");
// group by sorted letters, then sort everything for printing
`,
    tests: [
      { input: '6\neat tea tan ate nat bat', expected: 'ate eat tea\nbat\nnat tan', tag: 'maps', note: 'The key of a group is the word with its letters sorted.' },
      { input: '3\nabc cab bca', expected: 'abc bca cab', tag: 'sorting', note: 'Words inside a group are printed alphabetically, not in input order.' },
      { input: '2\nx x', expected: 'x x', tag: 'edge-empty', note: 'A repeated identical word belongs to the same group twice.' },
      { input: '1\nsolo', expected: 'solo', tag: 'edge-empty', note: 'A single word is a group of one.' },
    ],
    hints: [
      '`word.split("").sort().join("")` is the anagram key.',
      'Use a `Map` from key to the list of words.',
      'Sort each group, then sort the groups by their first word before printing.',
    ],
  },
];
