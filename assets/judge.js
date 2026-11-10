/* Judge: runs a submission against one test case and reports stdout, error and time.
   Python runs in Pyodide (real CPython compiled to WebAssembly) inside a Web Worker, so the
   page never freezes and an infinite loop can be killed by terminating the worker. JavaScript
   runs in its own worker with a minimal readLine/print harness. */

window.Judge = (function () {
  const PYODIDE_VERSION = 'v0.26.4';
  const CDN = 'https://cdn.jsdelivr.net/pyodide/' + PYODIDE_VERSION + '/full/';

  const PY_RUNNER = `
import io, json, sys, time, traceback, contextlib

_buf = io.StringIO()
_error = None
_start = time.perf_counter()
_saved_stdin = sys.stdin
sys.stdin = io.StringIO(__cl_input)
try:
    with contextlib.redirect_stdout(_buf):
        exec(compile(__cl_code, '<submission>', 'exec'), {'__name__': '__main__'})
except SystemExit:
    pass
except BaseException:
    _error = traceback.format_exc(limit=2)
finally:
    sys.stdin = _saved_stdin

json.dumps({
    'ok': True,
    'stdout': _buf.getvalue(),
    'error': _error or '',
    'ms': round((time.perf_counter() - _start) * 1000, 1),
})
`;

  const JS_HARNESS = `
let __cursor = 0;
const __out = [];
const __lines = __input.split('\\n');
const readLine = () => (__cursor < __lines.length ? __lines[__cursor++] : '');
const readline = readLine;
const print = (...args) => __out.push(args.map(String).join(' '));
try {
  new Function('readLine', 'readline', 'print', '"use strict";\\n' + __code)(readLine, readline, print);
  return { ok: true, stdout: __out.join('\\n'), error: '', ms: 0 };
} catch (err) {
  return { ok: true, stdout: __out.join('\\n'), error: String(err && err.name ? err.name + ': ' + err.message : err), ms: 0 };
}
`;

  const listeners = new Set();
  function status(text, tone) {
    listeners.forEach((fn) => fn(text, tone));
  }

  /* Resolve the worker next to judge.js itself, so a harness on another path still works. */
  const WORKER_URL = (function () {
    const tag = document.querySelector('script[src*="judge.js"]');
    try {
      return new URL('python-worker.js', tag ? tag.src : document.baseURI).href;
    } catch (_) {
      return 'assets/python-worker.js';
    }
  })();

  let pyWorker = null;
  let pyBooted = false;
  let pyBootPromise = null;
  let pyBootResolve = null;
  let pyBootFailed = null;
  let pySeq = 0;
  const pyPending = new Map();

  function spawnPython() {
    const worker = new Worker(WORKER_URL);
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'booted') {
        pyBooted = true;
        status('ready', 'ok');
        if (pyBootResolve) pyBootResolve(true);
        return;
      }
      if (data.type === 'boot-failed') {
        pyBootFailed = data.error || 'The Python runtime could not start.';
        status('runtime unavailable', 'bad');
        if (pyBootResolve) pyBootResolve(false);
        return;
      }
      const entry = pyPending.get(data.id);
      if (!entry) return;
      pyPending.delete(data.id);
      clearTimeout(entry.timer);
      entry.resolve(data);
    };
    worker.onerror = (event) => {
      const text = (event && event.message) || 'The Python runtime could not start.';
      pyBootFailed = text;
      if (pyBootResolve) pyBootResolve(false);
      pyPending.forEach((entry) => {
        clearTimeout(entry.timer);
        entry.resolve({ ok: false, error: text, stdout: '', ms: 0, boot_error: true });
      });
      pyPending.clear();
      status('runtime unavailable', 'bad');
    };
    return worker;
  }

  /* Booting Pyodide takes seconds, so a run waits for the boot instead of racing it. */
  function ensurePython() {
    if (!pyWorker) {
      pyWorker = spawnPython();
      pyBooted = false;
      pyBootFailed = null;
      status('starting python', 'warn');
      pyBootPromise = new Promise((resolve) => { pyBootResolve = resolve; });
      pyWorker.postMessage({ type: 'boot', cdn: CDN });
    }
    return pyBootPromise || Promise.resolve(pyBooted);
  }

  async function runPython(code, input, budget) {
    const ready = await ensurePython();
    if (!ready || !pyWorker) {
      return { ok: false, stdout: '', ms: 0, error: pyBootFailed || 'The Python runtime could not start.', boot_error: true };
    }
    const worker = pyWorker;
    const id = ++pySeq;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pyPending.delete(id);
        try { worker.terminate(); } catch (_) {}
        pyWorker = null;
        pyBooted = false;
        pyBootPromise = null;
        pyBootResolve = null;
        status('runtime restarting', 'warn');
        resolve({ ok: false, error: 'Time limit exceeded: your program ran longer than ' + (budget / 1000) + ' s.', stdout: '', ms: budget, timeout: true });
      }, budget);
      pyPending.set(id, { resolve, timer });
      worker.postMessage({ id, code, input });
    });
  }

  function runJavaScript(code, input, budget) {
    return new Promise((resolve) => {
      const blob = new Blob([`
        self.onmessage = (event) => {
          const { code, input } = event.data;
          const started = performance.now();
          const factory = new Function('__code', '__input', ${JSON.stringify(JS_HARNESS)});
          let result;
          try { result = factory(code, input); }
          catch (err) { result = { ok: true, stdout: '', error: String(err && err.message || err), ms: 0 }; }
          result.ms = Math.round((performance.now() - started) * 10) / 10;
          self.postMessage(result);
        };
      `], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      const timer = setTimeout(() => {
        try { worker.terminate(); } catch (_) {}
        URL.revokeObjectURL(url);
        resolve({ ok: false, error: 'Time limit exceeded: your program ran longer than ' + (budget / 1000) + ' s.', stdout: '', ms: budget, timeout: true });
      }, budget);
      worker.onmessage = (event) => {
        clearTimeout(timer);
        try { worker.terminate(); } catch (_) {}
        URL.revokeObjectURL(url);
        resolve(event.data);
      };
      worker.onerror = (event) => {
        clearTimeout(timer);
        try { worker.terminate(); } catch (_) {}
        URL.revokeObjectURL(url);
        resolve({ ok: false, stdout: '', error: event.message || 'The program could not be started.', ms: 0 });
      };
      worker.postMessage({ code, input });
    });
  }

  function warmUp() {
    ensurePython();
  }

  /* Compare the way a judge does: line by line, ignoring trailing spaces on a line and
     trailing blank lines, but nothing else. */
  function normalise(text) {
    return String(text == null ? '' : text)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/, ''))
      .join('\n')
      .replace(/\n+$/, '');
  }

  function sameOutput(got, expected) {
    return normalise(got) === normalise(expected);
  }

  async function run({ language, code, input, budgetMs }) {
    const budget = budgetMs || 4000;
    /* A test case whose input is the empty string still has one empty line, the same way the
       problem statement shows it. Without this, input() would hit EOF instead of reading "". */
    const stdin = input === '' || input == null ? '\n' : input;
    const raw = language === 'javascript'
      ? await runJavaScript(code, stdin, budget)
      : await runPython(code, stdin, budget);
    return {
      stdout: raw.stdout || '',
      error: raw.error || '',
      ms: raw.ms || 0,
      timeout: !!raw.timeout,
      bootError: !!raw.boot_error,
    };
  }

  return { run, normalise, sameOutput, warmUp, onStatus: (fn) => listeners.add(fn), isPythonReady: () => pyBooted };
})();
