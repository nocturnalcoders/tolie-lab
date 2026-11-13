// Talks to the Python worker. One worker is kept warm; if a program runs too long the worker is
// killed (the only way to stop an endless loop) and a fresh one starts on the next run.
import { compareOutput } from '../grading.js';
import { format } from '../i18n.js';

const WORKER_URL = '/runners/python-worker.mjs';

export function createPythonRunner({
  createWorker = () => new Worker(WORKER_URL, { type: 'module' }),
  runTimeoutMs = 6000,
  loadTimeoutMs = 90000,
  onStatus = () => {},
  t = (text, vars) => format(text, vars), // translates messages; the default keeps the Indonesian text
} = {}) {
  let worker = null;
  let ready = null; // promise that settles when the worker has loaded Python
  let nextId = 1;
  const pending = new Map();

  function failAll(reason) {
    for (const [, p] of pending) p.resolve({ stdout: '', stderr: '', error: reason, exitCode: 1, truncated: false, failed: true });
    pending.clear();
  }

  function kill() {
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
    worker = null;
    ready = null;
  }

  function spawn() {
    onStatus('loading');
    const w = createWorker();
    worker = w;
    let settle;
    ready = new Promise((resolve, reject) => {
      settle = { resolve, reject };
    });
    ready.catch(() => {}); // the caller handles it; avoid an "unhandled" warning
    const timer = setTimeout(() => {
      settle.reject(new Error(t('Python terlalu lama dimuat. Cek koneksimu lalu coba lagi.')));
      if (worker === w) kill();
    }, loadTimeoutMs);
    w.onmessage = (event) => {
      const m = event.data || {};
      if (m.type === 'ready') {
        clearTimeout(timer);
        onStatus('ready');
        settle.resolve();
      } else if (m.type === 'fatal') {
        clearTimeout(timer);
        settle.reject(new Error(t('Python gagal dimuat: {message}', { message: m.message })));
        if (worker === w) kill();
      } else if (m.type === 'result' && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        clearTimeout(p.timer);
        onStatus('ready');
        p.resolve({ stdout: m.stdout, stderr: m.stderr, error: m.error, exitCode: m.exitCode, truncated: m.truncated });
      }
    };
    w.onerror = (event) => {
      clearTimeout(timer);
      const reason = event && event.message ? t('Python berhenti tiba-tiba: {message}', { message: event.message }) : t('Python berhenti tiba-tiba');
      settle.reject(new Error(reason));
      if (worker === w) kill();
      failAll(reason);
    };
  }

  // -> { stdout, stderr, error, exitCode, truncated, timedOut?, failed? }
  async function runOnce(code, input = '', timeoutMs = runTimeoutMs) {
    if (!worker) spawn();
    try {
      await ready;
    } catch (err) {
      return { stdout: '', stderr: '', error: err.message, exitCode: 1, truncated: false, failed: true };
    }
    const w = worker;
    if (!w) return { stdout: '', stderr: '', error: t('Python berhenti. Coba lagi.'), exitCode: 1, truncated: false, failed: true };
    onStatus('running');
    return new Promise((resolve) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        if (worker === w) kill();
        onStatus('idle');
        resolve({
          stdout: '',
          stderr: '',
          error: t('Waktu habis: programmu berjalan lebih dari {seconds} detik. Periksa apakah ada perulangan yang tidak pernah berhenti.', { seconds: Math.round(timeoutMs / 1000) }),
          exitCode: 1,
          truncated: false,
          timedOut: true,
        });
      }, timeoutMs);
      pending.set(id, { resolve, timer });
      w.postMessage({ id, type: 'run', code, input });
    });
  }

  // Runs every test. Stops after a timeout or a loading failure, because the rest cannot run either.
  async function runTests(code, tests, onProgress = () => {}) {
    const results = [];
    let stopped = false;
    for (let i = 0; i < tests.length; i += 1) {
      const t = tests[i];
      if (stopped) {
        results.push({ index: i, ok: false, skipped: true, input: t.input, expected: t.output });
        continue;
      }
      const r = await runOnce(code, t.input);
      const cmp = r.error || r.failed ? { ok: false } : compareOutput(t.output, r.stdout);
      results.push({
        index: i,
        ok: !r.error && !r.failed && cmp.ok,
        input: t.input,
        expected: t.output,
        actual: r.stdout,
        error: r.error,
        timedOut: !!r.timedOut,
        diff: cmp.ok ? null : { line: cmp.line, expectedLine: cmp.expectedLine, actualLine: cmp.actualLine },
      });
      onProgress(results.slice());
      if (r.timedOut || r.failed) stopped = true;
    }
    return { results, passed: results.filter((x) => x.ok).length, total: tests.length };
  }

  function reset() {
    kill();
    failAll(t('Dibatalkan.'));
    onStatus('idle');
  }

  return { runOnce, runTests, reset };
}
