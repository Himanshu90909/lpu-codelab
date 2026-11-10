/* CodeLab · Lovely Professional University
   A judged practice environment: labs on the left, the problem in the middle, the editor and
   judge on the right. Every result is kept in localStorage so progress, submissions and the
   concept graph survive a reload. */

(function () {
  'use strict';

  const COURSES = window.CODELAB_COURSES || [];
  const LABS = window.CODELAB_LABS || [];
  const PROBLEMS = window.CODELAB_PROBLEMS || [];
  const STORE_KEY = 'codelab.lpu.v1';
  const RUN_BUDGET_MS = 5000;
  const BOOT_BUDGET_MS = 45000;

  const $ = (selector) => document.querySelector(selector);
  const el = (tag, props, children) => {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (key === 'text') node.textContent = value;
        else if (key === 'html') node.innerHTML = value;
        else if (key === 'class') node.className = value;
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
        else if (value !== null && value !== undefined) node.setAttribute(key, value);
      }
    }
    (children || []).forEach((child) => node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
    return node;
  };

  const problemById = new Map(PROBLEMS.map((p) => [p.id, p]));
  const labById = new Map(LABS.map((l) => [l.id, l]));
  const courseByCode = new Map(COURSES.map((c) => [c.code, c]));

  function languageOf(problem) {
    const lab = labById.get(problem.lab);
    const course = lab ? lab.course : '';
    return course === 'CSE325' ? 'javascript' : 'python';
  }

  function languageLabel(problem) {
    return languageOf(problem) === 'javascript' ? 'JavaScript · browser' : 'Python 3.12';
  }

  /* ---------------- state ---------------- */

  const blankState = () => ({
    course: COURSES.length ? COURSES[0].code : '',
    problemId: null,
    tab: 'statement',
    code: {},
    solved: {},
    attempts: {},
    submissions: [],
    streak: { count: 0, lastDay: null },
    bestMs: {},
  });

  let state = blankState();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      state = Object.assign(blankState(), saved);
      state.streak = Object.assign({ count: 0, lastDay: null }, saved.streak || {});
    } catch (err) {
      state = blankState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      /* storage may be full or blocked; the session still works */
    }
  }

  const today = () => new Date().toISOString().slice(0, 10);

  function touchStreak() {
    const day = today();
    if (state.streak.lastDay === day) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak.count = state.streak.lastDay === yesterday ? state.streak.count + 1 : 1;
    state.streak.lastDay = day;
  }

  const problemsOfCourse = (code) => PROBLEMS.filter((p) => {
    const lab = labById.get(p.lab);
    return lab && lab.course === code;
  });

  const currentProblem = () => problemById.get(state.problemId) || problemsOfCourse(state.course)[0];

  const marksOf = (problem) => (state.solved[problem.id] ? problem.marks : 0);

  const totalMarks = () => problemsOfCourse(state.course).reduce((sum, p) => sum + marksOf(p), 0);
  const courseMarks = () => problemsOfCourse(state.course).reduce((sum, p) => sum + p.marks, 0);

  function mastery() {
    const map = new Map();
    problemsOfCourse(state.course).forEach((problem) => {
      problem.tags.forEach((tag) => {
        const entry = map.get(tag) || { solved: 0, total: 0 };
        entry.total += 1;
        if (state.solved[problem.id]) entry.solved += 1;
        map.set(tag, entry);
      });
    });
    return map;
  }

  function weakestTag() {
    let worst = null;
    mastery().forEach((value, tag) => {
      if (value.solved >= value.total) return;
      const ratio = value.solved / value.total;
      if (!worst || ratio < worst.ratio) worst = { tag, ratio, solved: value.solved, total: value.total };
    });
    return worst;
  }

  function recommendation() {
    const unsolved = problemsOfCourse(state.course).filter((p) => !state.solved[p.id]);
    if (!unsolved.length) return null;
    const weak = weakestTag();
    if (weak) {
      const exact = unsolved.find((p) => p.tags.includes(weak.tag));
      if (exact) return { problem: exact, reason: 'your weakest concept is ' + weak.tag + ' (' + weak.solved + '/' + weak.total + ')' };
    }
    const attempted = unsolved.find((p) => state.attempts[p.id]);
    if (attempted) return { problem: attempted, reason: 'you already started this one' };
    return { problem: unsolved[0], reason: 'next in the lab sequence' };
  }

  /* ---------------- tiny markdown ---------------- */

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function inline(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|\s)(https?:\/\/\S+)/g, '$1<a href="$2" rel="noreferrer noopener" target="_blank">$2</a>');
  }

  function renderMarkdown(source) {
    const blocks = String(source).split(/```/);
    let html = '';
    blocks.forEach((block, index) => {
      if (index % 2 === 1) {
        html += '<pre><code>' + escapeHtml(block.replace(/^\w*\n/, '')) + '</code></pre>';
        return;
      }
      const paragraphs = block.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
      paragraphs.forEach((para) => {
        const lines = para.split('\n');
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          html += '<ul>' + lines.map((line) => '<li>' + inline(line.replace(/^[-*]\s+/, '')) + '</li>').join('') + '</ul>';
        } else if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          html += '<ol>' + lines.map((line) => '<li>' + inline(line.replace(/^\d+\.\s+/, '')) + '</li>').join('') + '</ol>';
        } else {
          html += '<p>' + lines.map(inline).join('<br />') + '</p>';
        }
      });
    });
    return html;
  }

  /* ---------------- rendering: chrome ---------------- */

  function renderCoursePicker() {
    const select = $('#course');
    select.innerHTML = '';
    COURSES.forEach((course) => {
      const option = el('option', { value: course.code, text: course.code + ' · ' + course.title });
      if (course.code === state.course) option.selected = true;
      select.appendChild(option);
    });
    select.onchange = () => {
      state.course = select.value;
      const first = problemsOfCourse(state.course)[0];
      state.problemId = first ? first.id : null;
      state.tab = 'statement';
      save();
      renderAll();
    };
  }

  function renderStats() {
    const solved = problemsOfCourse(state.course).filter((p) => state.solved[p.id]).length;
    const total = problemsOfCourse(state.course).length;
    $('#stat-solved').textContent = solved + '/' + total;
    $('#stat-marks').innerHTML = totalMarks() + '<em>/' + courseMarks() + '</em>';
    $('#stat-streak').textContent = String(state.streak.count || 0);
  }

  function renderRail() {
    const course = courseByCode.get(state.course);
    $('#rail-course').textContent = course ? course.title : 'Course';
    const labs = LABS.filter((lab) => lab.course === state.course);
    const solved = problemsOfCourse(state.course).filter((p) => state.solved[p.id]).length;
    $('#rail-meta').textContent = course.code + ' · ' + solved + ' of ' + problemsOfCourse(state.course).length + ' solved';

    const host = $('#labs');
    host.innerHTML = '';
    labs.forEach((lab) => {
      const problems = PROBLEMS.filter((p) => p.lab === lab.id);
      const done = problems.filter((p) => state.solved[p.id]).length;
      const marks = problems.reduce((sum, p) => sum + (state.solved[p.id] ? p.marks : 0), 0);
      const total = problems.reduce((sum, p) => sum + p.marks, 0);

      const section = el('section', { class: 'lab' });
      section.appendChild(el('button', { class: 'lab-head', type: 'button' }, [
        el('span', { class: 'lab-name', text: lab.title }),
        el('span', { class: 'lab-score', text: done + '/' + problems.length + ' · ' + marks + '/' + total }),
        el('span', { class: 'lab-note', text: lab.note }),
      ]));

      const list = el('ul', { class: 'prob-list' });
      problems.forEach((problem) => {
        const status = state.solved[problem.id] ? 'solved' : (state.attempts[problem.id] ? 'attempted' : '');
        const item = el('button', {
          class: 'prob-item',
          type: 'button',
          'aria-current': problem.id === state.problemId ? 'true' : 'false',
          onclick: () => selectProblem(problem.id),
        }, [
          el('span', { class: 'prob-dot ' + status }),
          el('span', { text: problem.title }),
          el('span', { class: 'prob-marks', text: problem.marks }),
        ]);
        list.appendChild(el('li', null, [item]));
      });
      section.appendChild(list);
      host.appendChild(section);
    });
  }

  function renderMastery() {
    const host = $('#mastery');
    host.innerHTML = '';
    const map = mastery();
    const rows = [...map.entries()].sort((a, b) => (a[1].solved / a[1].total) - (b[1].solved / b[1].total));
    rows.forEach(([tag, value]) => {
      const pct = Math.round((value.solved / value.total) * 100);
      host.appendChild(el('div', { class: 'mastery-row' }, [
        el('span', { class: 'mastery-tag', title: tag, text: tag }),
        el('span', { class: 'mastery-bar' }, [
          el('span', { class: 'mastery-fill' + (value.solved === value.total ? ' full' : ''), style: 'width:' + pct + '%' }),
        ]),
        el('span', { class: 'mastery-count', text: value.solved + '/' + value.total }),
      ]));
    });
  }

  /* ---------------- rendering: problem ---------------- */

  function selectProblem(id) {
    state.problemId = id;
    state.tab = 'statement';
    save();
    renderAll();
  }

  function renderProblem() {
    const problem = currentProblem();
    if (!problem) return;
    const lab = labById.get(problem.lab);
    $('#prob-lab').textContent = lab ? lab.title : 'Lab';
    $('#prob-marks').textContent = problem.marks + ' marks';
    $('#prob-title').textContent = problem.title;

    const badges = $('#prob-badges');
    badges.innerHTML = '';
    badges.appendChild(el('span', { class: 'badge ' + problem.difficulty.toLowerCase(), text: problem.difficulty }));
    badges.appendChild(el('span', { class: 'badge', text: languageLabel(problem) }));
    problem.tags.forEach((tag) => badges.appendChild(el('span', { class: 'badge tag', text: tag })));
    if (state.solved[problem.id]) badges.appendChild(el('span', { class: 'badge easy', text: 'solved' }));

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.setAttribute('aria-selected', tab.dataset.tab === state.tab ? 'true' : 'false');
      tab.onclick = () => { state.tab = tab.dataset.tab; save(); renderProblem(); };
    });

    $('#lang-pill').textContent = languageOf(problem) === 'javascript' ? 'JavaScript' : 'Python 3';
    renderPanel(problem);
  }

  function renderPanel(problem) {
    const panel = $('#panel');
    panel.innerHTML = '';
    if (state.tab === 'statement') {
      panel.appendChild(el('div', { class: 'prose', html: renderMarkdown(problem.statement) }));

      const spec = el('div', { class: 'spec' }, [
        el('div', { class: 'spec-row' }, [
          el('div', { class: 'spec-key', text: 'Input' }),
          el('div', { class: 'spec-val', text: problem.inputSpec }),
        ]),
        el('div', { class: 'spec-row' }, [
          el('div', { class: 'spec-key', text: 'Output' }),
          el('div', { class: 'spec-val', text: problem.outputSpec }),
        ]),
      ]);
      panel.appendChild(spec);

      const samples = el('div', { class: 'samples' }, [el('h3', { text: 'Sample' })]);
      problem.samples.forEach((sample) => {
        samples.appendChild(el('div', { class: 'sample-grid' }, [
          el('div', { class: 'sample-box' }, [el('h4', { text: 'Input' }), el('pre', { text: sample.input })]),
          el('div', { class: 'sample-box' }, [el('h4', { text: 'Expected output' }), el('pre', { text: sample.output })]),
        ]));
      });
      samples.appendChild(el('p', { class: 'empty', text: 'The judge compares output character by character, ignoring trailing spaces and blank lines at the end.' }));
      panel.appendChild(samples);
      return;
    }

    if (state.tab === 'hints') {
      panel.appendChild(el('p', { class: 'empty', text: 'Hints open one at a time, the way a tutor would give them. Using a hint does not change your marks.' }));
      problem.hints.forEach((hint, index) => {
        const body = el('div', { class: 'hint-body', hidden: '', html: renderMarkdown(hint) });
        const openBtn = el('button', { class: 'hint-btn', type: 'button', text: 'Show' });
        openBtn.onclick = () => {
          const isHidden = body.hasAttribute('hidden');
          if (isHidden) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
          openBtn.textContent = isHidden ? 'Hide' : 'Show';
        };
        panel.appendChild(el('div', { class: 'hint' }, [
          el('div', { class: 'hint-head' }, [
            el('span', { class: 'hint-title', text: 'Hint ' + (index + 1) }),
            openBtn,
          ]),
          body,
        ]));
      });
      return;
    }

    const rows = state.submissions.filter((sub) => sub.problemId === problem.id).slice().reverse();
    if (!rows.length) {
      panel.appendChild(el('p', { class: 'empty', text: 'No submissions yet. Submit to record one here.' }));
      return;
    }
    rows.forEach((sub) => {
      panel.appendChild(el('div', { class: 'sub-row' }, [
        el('span', { class: 'sub-when', text: new Date(sub.at).toLocaleString('en-IN', { hour12: false }) }),
        el('span', null, [
          el('span', { class: 'sub-verdict ' + (sub.verdict === 'Accepted' ? 'pass' : 'fail'), text: sub.verdict }),
          el('span', { class: 'result-note', text: ' · ' + sub.passed + '/' + sub.total + ' tests · ' + sub.ms + ' ms' }),
        ]),
        el('span', { class: 'prob-marks', text: sub.verdict === 'Accepted' ? '+' + sub.marks : '0' }),
      ]));
    });
  }

  /* ---------------- editor ---------------- */

  function starterFor(problem) {
    if (state.code[problem.id] != null) return state.code[problem.id];
    state.code[problem.id] = problem.starter;
    return problem.starter;
  }

  function syncGutter() {
    const editor = $('#editor');
    const lines = editor.value.split('\n').length;
    const gutter = $('#gutter');
    if (gutter.dataset.lines !== String(lines)) {
      gutter.dataset.lines = String(lines);
      gutter.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br />');
    }
    gutter.scrollTop = editor.scrollTop;
  }

  function renderEditor() {
    const problem = currentProblem();
    if (!problem) return;
    const editor = $('#editor');
    editor.value = starterFor(problem);
    syncGutter();
    $('#editor-hint').textContent = languageOf(problem) === 'javascript'
      ? 'readLine() and print() are available'
      : 'input() and print() behave as in the lab';
  }

  function indent(editor, unit) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);

    if (start !== end) {
      const block = value.slice(lineStart, lineEnd).split('\n').map((line) => unit + line).join('\n');
      editor.setRangeText(block, lineStart, lineEnd, 'select');
    } else {
      editor.setRangeText(unit, start, end, 'end');
    }
    state.code[currentProblem().id] = editor.value;
    syncGutter();
  }

  function attachEditor() {
    const editor = $('#editor');
    editor.addEventListener('input', () => {
      state.code[currentProblem().id] = editor.value;
      syncGutter();
      window.clearTimeout(editor._saveTimer);
      editor._saveTimer = window.setTimeout(save, 400);
    });
    editor.addEventListener('scroll', () => { $('#gutter').scrollTop = editor.scrollTop; });
    editor.addEventListener('keydown', (event) => {
      const problem = currentProblem();
      const unit = '    ';
      if (event.key === 'Tab') {
        event.preventDefault();
        indent(editor, unit);
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        const start = editor.selectionStart;
        const value = editor.value;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const line = value.slice(lineStart, start);
        const leading = (line.match(/^[ \t]*/) || [''])[0];
        const opensBlock = /[:{[(]\s*$/.test(line);
        const extra = opensBlock ? unit : '';
        if (leading || extra) {
          event.preventDefault();
          const insert = '\n' + leading + extra;
          editor.setRangeText(insert, start, editor.selectionEnd, 'end');
          state.code[problem.id] = editor.value;
          syncGutter();
        }
      }
    });
  }

  /* ---------------- judging ---------------- */

  let busy = false;

  function setBusy(next, status) {
    busy = next;
    $('#btn-run').disabled = next;
    $('#btn-submit').disabled = next;
    $('#judge-status').textContent = status || (next ? 'running' : 'idle');
  }

  function diffLines(expected, got) {
    const a = Judge.normalise(expected).split('\n');
    const b = Judge.normalise(got).split('\n');
    if (a.length * b.length > 40000) {
      return [{ type: 'del', text: '(expected, first lines) ' + a.slice(0, 3).join(' ⏎ ') },
        { type: 'add', text: '(yours, first lines) ' + b.slice(0, 3).join(' ⏎ ') }];
    }
    const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i -= 1) {
      for (let j = b.length - 1; j >= 0; j -= 1) {
        table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        if (out.length < 40) out.push({ type: 'same', text: '  ' + a[i] });
        i += 1; j += 1;
      } else if (table[i + 1][j] >= table[i][j + 1]) {
        if (out.length < 40) out.push({ type: 'del', text: '- ' + a[i] });
        i += 1;
      } else {
        if (out.length < 40) out.push({ type: 'add', text: '+ ' + b[j] });
        j += 1;
      }
    }
    while (i < a.length) { if (out.length < 40) out.push({ type: 'del', text: '- ' + a[i] }); i += 1; }
    while (j < b.length) { if (out.length < 40) out.push({ type: 'add', text: '+ ' + b[j] }); j += 1; }
    return out;
  }

  function renderResults(problem, run) {
    const host = $('#results');
    host.innerHTML = '';

    if (run.error) {
      host.appendChild(el('div', { class: 'verdict warn', text: run.error }));
      return;
    }

    const { cases, mode, verdict, passed, total, ms } = run;
    host.appendChild(el('div', { class: 'verdict ' + (verdict === 'Accepted' ? 'pass' : 'fail') }, [
      el('span', { text: verdict }),
      el('span', { class: 'console-status', text: passed + ' / ' + total + ' tests · ' + ms + ' ms' }),
      mode === 'samples' ? el('span', { class: 'console-status', text: 'sample tests only' }) : null,
    ]));

    cases.forEach((result, index) => {
      const mark = result.status === 'pass' ? '✓' : (result.status === 'skip' ? '·' : '✗');
      const row = el('button', { class: 'result-row', type: 'button' }, [
        el('span', { class: 'result-mark ' + result.status, text: mark }),
        el('span', null, [
          el('span', { text: result.hidden ? 'Hidden case ' + (index + 1) : 'Case ' + (index + 1) }),
          result.status !== 'pass' && result.tag ? el('span', { class: 'result-note', text: ' · ' + result.tag }) : null,
        ]),
        el('span', { class: 'result-ms', text: result.status === 'skip' ? 'not run' : result.ms + ' ms' }),
      ]);

      const detail = el('div', { class: 'detail', hidden: '' });
      const body = el('div', { class: 'detail-body' });

      if (result.status === 'pass') {
        body.appendChild(el('div', { class: 'kv' }, [
          el('b', { text: 'Output' }),
          el('pre', { text: (result.stdout || '(no output)').slice(0, 800) }),
        ]));
      } else {
        if (result.error) {
          body.appendChild(el('div', { class: 'kv' }, [el('b', { text: 'Error' }), el('pre', { text: result.error.trim().slice(0, 900) })]));
        }
        if (!result.hidden) {
          body.appendChild(el('div', { class: 'kv' }, [el('b', { text: 'Input' }), el('pre', { text: result.input || '(empty)' })]));
          body.appendChild(el('div', { class: 'kv' }, [el('b', { text: 'Expected' }), el('pre', { text: result.expected })]));
          body.appendChild(el('div', { class: 'kv' }, [el('b', { text: 'Yours' }), el('pre', { text: result.stdout || '(no output)' })]));
        } else if (result.stdout) {
          const firstLine = result.stdout.split('\n').find((line) => line.trim()) || '(blank line)';
          body.appendChild(el('div', { class: 'kv' }, [el('b', { text: 'Yours' }), el('pre', { text: 'first line: ' + firstLine.slice(0, 160) })]));
          body.appendChild(el('p', { class: 'empty', text: 'The rest of this case is hidden, as it would be in a lab test.' }));
        }
        if (!result.error) {
          const diff = el('div', { class: 'kv' }, [el('b', { text: 'Diff' })]);
          const box = el('div');
          diffLines(result.expected, result.stdout).forEach((line) => {
            box.appendChild(el('div', { class: 'diff-line ' + line.type, text: line.text }));
          });
          diff.appendChild(box);
          body.appendChild(diff);
        }
        if (result.note) {
          body.appendChild(el('div', { class: 'coach', html: '<b>What this case catches:</b> ' + inline(result.note) }));
        }
      }

      detail.appendChild(el('div', { class: 'detail-head' }, [
        el('span', { text: result.hidden ? 'Hidden test case' : 'Sample test case' }),
        el('span', { class: 'console-status', text: result.status === 'pass' ? 'passed' : result.status }),
      ]));
      detail.appendChild(body);

      row.onclick = () => {
        if (detail.hasAttribute('hidden')) detail.removeAttribute('hidden');
        else detail.setAttribute('hidden', '');
      };
      host.appendChild(row);
      host.appendChild(detail);
    });

    if (verdict === 'Accepted') {
      const next = recommendation();
      if (next) {
        host.appendChild(el('div', { class: 'coach', html: '<b>Next up:</b> ' + escapeHtml(next.problem.title) + ' — ' + escapeHtml(next.reason) + '.' }));
        const goBtn = el('button', { class: 'btn', type: 'button', text: 'Open ' + next.problem.title, style: 'margin-top:8px' });
        goBtn.onclick = () => selectProblem(next.problem.id);
        host.appendChild(goBtn);
      } else {
        host.appendChild(el('div', { class: 'coach', html: '<b>Lab complete:</b> every problem in ' + escapeHtml(state.course) + ' is solved. Try another course from the top bar.' }));
      }
    }
  }

  async function judge(mode) {
    if (busy) return;
    const problem = currentProblem();
    if (!problem) return;
    const code = $('#editor').value;
    state.code[problem.id] = code;
    save();

    const language = languageOf(problem);
    const cases = mode === 'samples' ? problem.tests.slice(0, 1) : problem.tests;
    const booting = !Judge.isPythonReady() && language === 'python';
    setBusy(true, booting ? 'starting python' : 'running ' + cases.length + ' case' + (cases.length > 1 ? 's' : ''));

    const results = [];
    let totalMs = 0;
    let passed = 0;

    for (let index = 0; index < cases.length; index += 1) {
      const test = cases[index];
      const budget = (booting && index === 0) ? BOOT_BUDGET_MS : RUN_BUDGET_MS;
      if (booting && index === 0) $('#judge-status').textContent = 'starting python runtime (first run only)';
      // eslint-disable-next-line no-await-in-loop
      const outcome = await Judge.run({ language, code, input: test.input, budgetMs: budget });
      totalMs += outcome.ms;

      if (outcome.bootError) {
        setBusy(false, 'error');
        renderResults(problem, { error: 'The Python runtime could not start: ' + (outcome.error || 'network blocked?') + '. JavaScript problems still run.', cases: [], mode, verdict: 'Runtime error', passed: 0, total: cases.length, ms: 0 });
        return;
      }

      const ok = !outcome.error && Judge.sameOutput(outcome.stdout, test.expected);
      if (ok) passed += 1;
      results.push({
        status: ok ? 'pass' : 'fail',
        hidden: mode === 'submit' && index > 0,
        input: test.input,
        expected: test.expected,
        stdout: outcome.stdout,
        error: outcome.error,
        ms: Math.round(outcome.ms),
        tag: test.tag,
        note: test.note,
      });
    }

    setBusy(false, mode === 'submit' ? 'submitted' : 'ran');
    const accepted = passed === results.length;
    const ms = Math.round(totalMs);

    if (mode === 'submit') {
      const verdict = accepted ? 'Accepted' : (results.some((r) => r.error) ? 'Runtime error' : 'Wrong answer');
      state.attempts[problem.id] = (state.attempts[problem.id] || 0) + 1;
      state.submissions.push({
        problemId: problem.id,
        at: Date.now(),
        verdict,
        passed,
        total: results.length,
        ms,
        marks: accepted ? problem.marks : 0,
        language,
      });
      if (state.submissions.length > 200) state.submissions = state.submissions.slice(-200);
      if (accepted && !state.solved[problem.id]) {
        state.solved[problem.id] = { at: Date.now(), ms };
        touchStreak();
        toast('Accepted · ' + problem.marks + ' marks added to ' + state.course);
      } else if (accepted) {
        state.solved[problem.id] = { at: state.solved[problem.id].at, ms };
        toast('Accepted again · still ' + problem.marks + ' marks');
      } else {
        toast(verdict + ' · ' + passed + ' of ' + results.length + ' tests passed');
      }
      const best = state.bestMs[problem.id];
      if (accepted && (!best || ms < best)) state.bestMs[problem.id] = ms;
      save();
      renderStats();
      renderRail();
      renderMastery();
      renderProblem();
    }

    const verdict = accepted ? 'Accepted' : (results.some((r) => r.error) ? 'Runtime error' : 'Wrong answer');
    renderResults(problem, { cases: results, mode, verdict, passed, total: results.length, ms });
  }

  /* ---------------- dialogs ---------------- */

  const peers = [
    { name: 'Ananya Rao', roll: '12304567', marks: 118 },
    { name: 'Vikram Shetty', roll: '12310982', marks: 96 },
    { name: 'Meera Nair', roll: '12305210', marks: 84 },
    { name: 'Arjun Das', roll: '12307634', marks: 71 },
    { name: 'Ritu Bansal', roll: '12302119', marks: 58 },
    { name: 'Suresh Menon', roll: '12311880', marks: 42 },
  ];

  function renderProgress() {
    const body = $('#progress-body');
    body.innerHTML = '';
    const course = courseByCode.get(state.course);
    const solved = problemsOfCourse(state.course).filter((p) => state.solved[p.id]);
    const submissions = state.submissions.filter((sub) => problemById.get(sub.problemId) && labById.get(problemById.get(sub.problemId).lab).course === state.course);

    body.appendChild(el('div', { class: 'verdict pass' }, [
      el('span', { text: (course ? course.code : '') + ' · ' + solved.length + ' of ' + problemsOfCourse(state.course).length + ' solved' }),
      el('span', { class: 'console-status', text: totalMarks() + ' / ' + courseMarks() + ' marks' }),
    ]));

    body.appendChild(el('h3', { text: 'Concept mastery' }));
    const table = el('table', { class: 'rank' }, [
      el('tr', null, [el('th', { text: 'Concept' }), el('th', { text: 'Solved' }), el('th', { text: 'Problems' })]),
    ]);
    [...mastery().entries()]
      .sort((a, b) => (a[1].solved / a[1].total) - (b[1].solved / b[1].total))
      .forEach(([tag, value]) => {
        table.appendChild(el('tr', null, [
          el('td', { text: tag }),
          el('td', { text: value.solved + ' / ' + value.total }),
          el('td', { class: 'console-status', text: Math.round((value.solved / value.total) * 100) + '%' }),
        ]));
      });
    body.appendChild(table);

    body.appendChild(el('h3', { text: 'Class standing (demo cohort)', style: 'margin-top:18px' }));
    const me = { name: 'You', roll: 'this browser', marks: totalMarks(), me: true };
    const rankTable = el('table', { class: 'rank' }, [
      el('tr', null, [el('th', { text: '#' }), el('th', { text: 'Student' }), el('th', { text: 'Marks' })]),
    ]);
    [...peers, me].sort((a, b) => b.marks - a.marks).forEach((row, index) => {
      rankTable.appendChild(el('tr', { class: row.me ? 'me' : '' }, [
        el('td', { text: String(index + 1) }),
        el('td', null, [el('span', { text: row.name }), el('span', { class: 'result-note', text: ' · ' + row.roll })]),
        el('td', { text: String(row.marks) }),
      ]));
    });
    body.appendChild(rankTable);

    body.appendChild(el('h3', { text: 'Recent submissions', style: 'margin-top:18px' }));
    if (!submissions.length) {
      body.appendChild(el('p', { class: 'empty', text: 'Nothing submitted in this course yet.' }));
    } else {
      const recent = el('table', { class: 'rank' }, [
        el('tr', null, [el('th', { text: 'When' }), el('th', { text: 'Problem' }), el('th', { text: 'Verdict' })]),
      ]);
      submissions.slice(-8).reverse().forEach((sub) => {
        recent.appendChild(el('tr', null, [
          el('td', { class: 'console-status', text: new Date(sub.at).toLocaleString('en-IN', { hour12: false }) }),
          el('td', { text: problemById.get(sub.problemId).title }),
          el('td', { text: sub.verdict + ' · ' + sub.passed + '/' + sub.total }),
        ]));
      });
      body.appendChild(recent);
    }

    const actions = el('div', { style: 'display:flex;gap:8px;margin-top:18px;flex-wrap:wrap' });
    const exportBtn = el('button', { class: 'btn primary', type: 'button', text: 'Download lab record (.md)' });
    exportBtn.onclick = exportLabRecord;
    const resetBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Reset my progress' });
    resetBtn.onclick = () => {
      if (!window.confirm('Clear solved problems, submissions and streak in this browser?')) return;
      state = blankState();
      state.problemId = problemsOfCourse(state.course)[0].id;
      state.streak = { count: 0, lastDay: null };
      save();
      renderAll();
      $('#progress-dlg').close();
      toast('Progress cleared');
    };
    actions.appendChild(exportBtn);
    actions.appendChild(resetBtn);
    body.appendChild(actions);
  }

  function exportLabRecord() {
    const course = courseByCode.get(state.course);
    const lines = [
      '# CodeLab lab record',
      '',
      '- Student: Himanshu Suthar',
      '- Course: ' + course.code + ' · ' + course.title,
      '- Institution: Lovely Professional University',
      '- Generated: ' + new Date().toLocaleString('en-IN', { hour12: false }),
      '- Marks: ' + totalMarks() + ' / ' + courseMarks(),
      '',
      '| Problem | Lab | Difficulty | Marks | Status | Best run |',
      '| --- | --- | --- | --- | --- | --- |',
    ];
    problemsOfCourse(state.course).forEach((problem) => {
      const lab = labById.get(problem.lab);
      const solved = state.solved[problem.id];
      lines.push('| ' + problem.title + ' | ' + (lab ? lab.title : '') + ' | ' + problem.difficulty + ' | '
        + (solved ? problem.marks : 0) + '/' + problem.marks + ' | ' + (solved ? 'Solved' : (state.attempts[problem.id] ? 'Attempted' : 'Not started'))
        + ' | ' + (state.bestMs[problem.id] ? state.bestMs[problem.id] + ' ms' : '—') + ' |');
    });
    lines.push('', '## Submissions', '');
    const subs = state.submissions.filter((sub) => labById.get(problemById.get(sub.problemId).lab).course === state.course);
    if (!subs.length) lines.push('_No submissions recorded._');
    subs.forEach((sub) => {
      lines.push('- ' + new Date(sub.at).toLocaleString('en-IN', { hour12: false }) + ' · ' + problemById.get(sub.problemId).title
        + ' · ' + sub.verdict + ' · ' + sub.passed + '/' + sub.total + ' tests · ' + sub.ms + ' ms');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: 'codelab-' + course.code + '-lab-record.md' });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Lab record downloaded');
  }

  /* ---------------- command palette ---------------- */

  function paletteCommands() {
    const commands = [
      { label: 'Run sample tests', hint: 'Ctrl+Enter', run: () => judge('samples') },
      { label: 'Submit against all tests', hint: 'Ctrl+Shift+Enter', run: () => judge('submit') },
      { label: 'Restore starter code', hint: 'reset', run: resetCode },
      { label: 'Open progress and standing', hint: 'progress', run: () => { $('#progress-dlg').showModal(); renderProgress(); } },
      { label: 'Download lab record', hint: 'export', run: exportLabRecord },
    ];
    COURSES.forEach((course) => {
      commands.push({
        label: 'Switch to ' + course.code + ' · ' + course.title,
        hint: 'course',
        run: () => { state.course = course.code; state.problemId = problemsOfCourse(course.code)[0].id; save(); renderAll(); },
      });
    });
    problemsOfCourse(state.course).forEach((problem) => {
      commands.push({
        label: 'Open ' + problem.title,
        hint: labById.get(problem.lab).title.split('·')[0].trim(),
        run: () => selectProblem(problem.id),
      });
    });
    return commands;
  }

  let paletteIndex = 0;
  let paletteMatches = [];

  function renderPalette(query) {
    const list = $('#palette-list');
    const q = (query || '').trim().toLowerCase();
    paletteMatches = paletteCommands().filter((cmd) => !q || cmd.label.toLowerCase().includes(q)).slice(0, 40);
    paletteIndex = Math.min(paletteIndex, Math.max(paletteMatches.length - 1, 0));
    list.innerHTML = '';
    paletteMatches.forEach((cmd, index) => {
      const item = el('li', {
        class: 'cmd-item' + (index === paletteIndex ? ' active' : ''),
        role: 'option',
        onclick: () => { $('#palette-dlg').close(); cmd.run(); },
      }, [el('span', { text: cmd.label }), el('small', { text: cmd.hint || '' })]);
      list.appendChild(item);
    });
    if (!paletteMatches.length) list.appendChild(el('li', { class: 'cmd-item', text: 'Nothing matches.' }));
  }

  function attachPalette() {
    const dlg = $('#palette-dlg');
    const input = $('#palette-input');
    $('#open-palette').onclick = () => {
      input.value = '';
      paletteIndex = 0;
      renderPalette('');
      dlg.showModal();
      input.focus();
    };
    input.oninput = () => { paletteIndex = 0; renderPalette(input.value); };
    input.onkeydown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        paletteIndex = Math.min(paletteIndex + 1, paletteMatches.length - 1);
        renderPalette(input.value);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        paletteIndex = Math.max(paletteIndex - 1, 0);
        renderPalette(input.value);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const cmd = paletteMatches[paletteIndex];
        if (cmd) { dlg.close(); cmd.run(); }
      } else if (event.key === 'Escape') {
        dlg.close();
      }
    };
  }

  /* ---------------- misc ---------------- */

  let toastTimer = null;
  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove('show'), 3200);
  }

  function resetCode() {
    const problem = currentProblem();
    state.code[problem.id] = problem.starter;
    save();
    renderEditor();
    toast('Starter code restored');
  }

  function renderAll() {
    if (!currentProblem()) return;
    renderCoursePicker();
    renderStats();
    renderRail();
    renderMastery();
    renderProblem();
    renderEditor();
    $('#results').innerHTML = '<p class="empty" id="results-empty">Run the samples to see each test case, or submit to run the hidden tests as well.</p>';
    $('#judge-status').textContent = 'idle';
  }

  function attachChrome() {
    $('#btn-run').onclick = () => judge('samples');
    $('#btn-submit').onclick = () => judge('submit');
    $('#btn-reset').onclick = resetCode;
    $('#open-progress').onclick = () => { renderProgress(); $('#progress-dlg').showModal(); };
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.onclick = () => btn.closest('dialog').close();
    });
    document.addEventListener('keydown', (event) => {
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        $('#open-palette').click();
        return;
      }
      if (event.key === 'Escape') {
        document.querySelectorAll('dialog[open]').forEach((dlg) => dlg.close());
      }
      if (!meta && event.key === '?' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        $('#open-palette').click();
        return;
      }
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        if (meta && event.key === 'Enter') {
          event.preventDefault();
          judge(event.shiftKey ? 'submit' : 'samples');
        }
        return;
      }
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        judge(event.shiftKey ? 'submit' : 'samples');
      }
    });
  }

  function boot() {
    load();
    if (!state.problemId) {
      const first = problemsOfCourse(state.course)[0] || PROBLEMS[0];
      state.problemId = first ? first.id : null;
    }
    if (!problemsOfCourse(state.course).length) {
      state.course = COURSES[0].code;
      state.problemId = problemsOfCourse(state.course)[0].id;
    }
    attachChrome();
    attachEditor();
    attachPalette();
    renderAll();
    Judge.onStatus((text, tone) => {
      const node = $('#stat-runtime');
      node.textContent = text;
      node.style.color = tone === 'ok' ? 'var(--orange)' : (tone === 'bad' ? '#ff9d94' : '#f6c89a');
    });
    if (languageOf(currentProblem()) === 'python') Judge.warmUp();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
