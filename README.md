# CodeLab · Lovely Professional University

A judged coding-practice platform for LPU courses: labs, statements, an editor, a judge that
returns a verdict per test case, concept mastery and a lab record you can hand in.

Everything runs in the browser. There is no build step, no server and no account: open
`index.html` and the Python runtime boots itself from a WebAssembly build of CPython.

```
index.html               shell: top bar, labs rail, problem column, editor + judge
assets/problems.js        the problem bank (courses, labs, statements, tests, hints)
assets/app.js             state, rendering, submissions, mastery, palette, export
assets/judge.js           judge front-end: run one case, enforce a time limit, compare output
assets/python-worker.js   CPython (Pyodide) inside a worker
assets/styles.css         LPU identity: ink #231F20, orange #F58220, deep orange #B85C0B for text
tools/                    development harnesses (not deployed)
```

## What a student sees

- **Labs, not a flat list.** Each course is a sequence of labs with their own score, so a
  practical block reads the way a lab manual does.
- **Per-test verdicts.** Every case reports pass or fail, its own runtime, and the tag of the
  misconception it catches. Clicking a case shows the input, the expected output, your output
  and a line diff.
- **Hidden cases on submit.** Run judges the sample case only, so iteration is instant; submit
  judges every case, and hidden cases reveal the tag and the first differing line but not the
  whole input.
- **Concept mastery.** Tags accumulate across problems and drive the "next up" suggestion: after
  an accepted submission the platform recommends the unsolved problem that covers your weakest
  concept.
- **Lab record export.** One click produces a Markdown record (per-problem status, best runtime,
  submission log) for the lab file.
- **Keyboard first.** `Ctrl/⌘+Enter` runs the samples, `Ctrl/⌘+Shift+Enter` submits, `Ctrl/⌘+K`
  opens the command palette, `Tab` indents, `Enter` keeps the indent.

Progress, submissions, streaks and the concept graph live in `localStorage`, per browser.

## Courses and labs

| Course | Labs | Problems |
| --- | --- | --- |
| INT108 Python Programming | input handling, loops and collections, strings and stacks | 7 |
| CSE205 Data Structures | two pointers, stacks and queues, merging and traversals | 6 |
| CSE325 Web Technologies | string handling in JavaScript | 2 |

15 problems, 61 test cases, 38 marks across each course's own scale.

## How judging works

Python runs as real CPython 3.12 compiled to WebAssembly (Pyodide) in a Web Worker. The worker
keeps one interpreter alive, runs each submission with `exec` in a fresh globals dictionary,
feeds the test input through `sys.stdin` and captures stdout. JavaScript runs in its own worker
with a two-function harness (`readLine()`, `print()`).

A Web Worker gives the judge something a `eval()` cannot: a real time limit. When a program
overruns its 5 s budget (45 s for the very first run, which also pays for the runtime download)
the page terminates the worker and reports *Time limit exceeded* instead of freezing.

Output comparison matches a judge, not a string test: trailing spaces on a line and trailing
blank lines are ignored, everything else is significant.

## Verify it yourself

```bash
python3 tools/validate.py        # every Python test case against a reference solution
node tools/validate_js.mjs       # the JavaScript problems, same way
python3 -m http.server 8081      # then open http://localhost:8081
```

`tools/judge-check.html` is the end-to-end harness: it drives the real judge with reference
solutions for all 61 cases, checks that a wrong program is rejected, and checks that an infinite
loop is stopped by the time limit. Its page title reads `PASS n/n` when everything holds.

## Honest limits

- The judge runs on the student's machine, so it is a **practice** environment. Course-end
  examinations still need a server-side sandbox and a proctored client; a graded exam must not
  trust the browser.
- Progress is per browser. A real deployment would put submissions behind the university's
  login and keep the bank server-side, so hidden tests never reach the client.
- Languages are Python and JavaScript today. C, C++ and Java would need the same worker pattern
  with a compiler in WebAssembly.
