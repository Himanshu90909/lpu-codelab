/* Python runtime for the judge: CPython (Pyodide) inside a worker.
   One worker is booted lazily and reused for every test case; the page kills and respawns it
   when a submission overruns its time budget. */

let runtime = null;
let cdnUrl = null;

self.onmessage = async (event) => {
  const data = event.data || {};

  if (data.type === 'boot') {
    if (runtime) {
      self.postMessage({ type: 'booted' });
      return;
    }
    cdnUrl = data.cdn;
    try {
      importScripts(cdnUrl + 'pyodide.js');
      runtime = await loadPyodide({ indexURL: cdnUrl });
      try { runtime.setRecursionLimit(600); } catch (_) {}
      self.postMessage({ type: 'booted' });
    } catch (err) {
      self.postMessage({ type: 'boot-failed', error: String((err && err.message) || err) });
    }
    return;
  }

  if (typeof data.id !== 'number') return;

  if (!runtime) {
    self.postMessage({ id: data.id, ok: false, stdout: '', ms: 0, error: 'The Python runtime is not running.', boot_error: true });
    return;
  }

  const runner = `
import io, json, sys, time, traceback, contextlib

_buf = io.StringIO()
_error = None
_saved_stdin = sys.stdin
_start = time.perf_counter()
sys.stdin = io.StringIO(__cl_input)
try:
    with contextlib.redirect_stdout(_buf):
        exec(compile(__cl_code, '<submission>', 'exec'), {'__name__': '__main__'})
except SystemExit:
    pass
except BaseException:
    _error = ''.join(traceback.format_exc(limit=2))
finally:
    sys.stdin = _saved_stdin

json.dumps({
    'ok': True,
    'stdout': _buf.getvalue(),
    'error': _error or '',
    'ms': round((time.perf_counter() - _start) * 1000, 1),
})
`;

  try {
    runtime.globals.set('__cl_code', String(data.code || ''));
    runtime.globals.set('__cl_input', String(data.input == null ? '' : data.input));
    const raw = await runtime.runPythonAsync(runner);
    const parsed = JSON.parse(raw);
    self.postMessage({
      id: data.id,
      ok: !!parsed.ok,
      stdout: parsed.stdout || '',
      error: parsed.error || '',
      ms: parsed.ms || 0,
    });
  } catch (err) {
    self.postMessage({
      id: data.id,
      ok: false,
      stdout: '',
      error: String((err && err.message) || err),
      ms: 0,
    });
  }
};
