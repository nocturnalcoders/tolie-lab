import { describe, expect, it, vi } from 'vitest';
import { createPythonRunner } from '../runner/pythonRunner.js';

// A stand-in for the Web Worker. `script` decides what each program "prints".
function fakeWorkerFactory(script, { loadMs = 0, fail = null } = {}) {
  const made = [];
  const create = () => {
    const w = {
      terminated: false,
      onmessage: null,
      onerror: null,
      postMessage(msg) {
        if (w.terminated) return;
        const out = script(msg);
        if (out === 'hang') return;
        setTimeout(() => !w.terminated && w.onmessage && w.onmessage({ data: { id: msg.id, type: 'result', stdout: '', stderr: '', error: '', exitCode: 0, truncated: false, ...out } }), 0);
      },
      terminate() {
        w.terminated = true;
      },
    };
    made.push(w);
    setTimeout(() => {
      if (w.terminated) return;
      if (fail) w.onmessage && w.onmessage({ data: { type: 'fatal', message: fail } });
      else w.onmessage && w.onmessage({ data: { type: 'ready' } });
    }, loadMs);
    return w;
  };
  return { create, made };
}

describe('python runner client', () => {
  it('runs a program and returns its output', async () => {
    const f = fakeWorkerFactory((m) => ({ stdout: `got ${m.input}` }));
    const r = createPythonRunner({ createWorker: f.create });
    expect((await r.runOnce('print()', 'abc')).stdout).toBe('got abc');
  });

  it('starts one worker and reuses it', async () => {
    const f = fakeWorkerFactory(() => ({}));
    const r = createPythonRunner({ createWorker: f.create });
    await r.runOnce('a');
    await r.runOnce('b');
    expect(f.made).toHaveLength(1);
  });

  it('checks tests and reports the first differing line', async () => {
    const f = fakeWorkerFactory((m) => ({ stdout: m.input === '2' ? '4\n' : '9\n' }));
    const r = createPythonRunner({ createWorker: f.create });
    const res = await r.runTests('x', [{ input: '2', output: '4' }, { input: '3', output: '6\nsecond' }]);
    expect(res.passed).toBe(1);
    expect(res.total).toBe(2);
    expect(res.results[0].ok).toBe(true);
    expect(res.results[1].diff).toEqual({ line: 1, expectedLine: '6', actualLine: '9' });
  });

  it('ignores trailing spaces and blank lines when comparing', async () => {
    const f = fakeWorkerFactory(() => ({ stdout: 'Rp1000  \nselesai\n\n' }));
    const r = createPythonRunner({ createWorker: f.create });
    expect((await r.runTests('x', [{ input: '', output: 'Rp1000\nselesai' }])).passed).toBe(1);
  });

  it('counts a crashing program as a failed test and keeps the message', async () => {
    const f = fakeWorkerFactory(() => ({ error: 'Traceback...\nNameError: x' }));
    const r = createPythonRunner({ createWorker: f.create });
    const res = await r.runTests('x', [{ input: '', output: '1' }]);
    expect(res.passed).toBe(0);
    expect(res.results[0].error).toContain('NameError');
  });

  it('kills the worker on a timeout and starts a fresh one next time', async () => {
    let first = true;
    const f = fakeWorkerFactory(() => {
      if (first) {
        first = false;
        return 'hang';
      }
      return { stdout: 'ok' };
    });
    const r = createPythonRunner({ createWorker: f.create, runTimeoutMs: 30 });
    const slow = await r.runOnce('while True: pass');
    expect(slow.timedOut).toBe(true);
    expect(slow.error).toContain('Waktu habis');
    expect(f.made[0].terminated).toBe(true);
    expect((await r.runOnce('print("ok")')).stdout).toBe('ok');
    expect(f.made).toHaveLength(2);
  });

  it('stops running further tests after a timeout', async () => {
    const f = fakeWorkerFactory(() => 'hang');
    const r = createPythonRunner({ createWorker: f.create, runTimeoutMs: 20 });
    const res = await r.runTests('x', [{ input: '', output: '1' }, { input: '', output: '2' }, { input: '', output: '3' }]);
    expect(res.results.map((x) => !!x.timedOut)).toEqual([true, false, false]);
    expect(res.results[1].skipped).toBe(true);
    expect(f.made).toHaveLength(1);
  });

  it('reports a Python that failed to load, and retries on the next run', async () => {
    const f = fakeWorkerFactory(() => ({}), { fail: 'network error' });
    const r = createPythonRunner({ createWorker: f.create });
    const res = await r.runOnce('x');
    expect(res.failed).toBe(true);
    expect(res.error).toContain('network error');
    await r.runOnce('x');
    expect(f.made).toHaveLength(2);
  });

  it('gives up when Python takes too long to load', async () => {
    const f = fakeWorkerFactory(() => ({}), { loadMs: 500 });
    const r = createPythonRunner({ createWorker: f.create, loadTimeoutMs: 20 });
    const res = await r.runOnce('x');
    expect(res.failed).toBe(true);
    expect(res.error).toContain('terlalu lama');
  });

  it('reports status changes', async () => {
    const f = fakeWorkerFactory(() => ({}));
    const seen = [];
    const r = createPythonRunner({ createWorker: f.create, onStatus: (s) => seen.push(s) });
    await r.runOnce('x');
    expect(seen).toEqual(['loading', 'ready', 'running', 'ready']);
  });

  it('reset stops the worker', async () => {
    const f = fakeWorkerFactory(() => ({}));
    const r = createPythonRunner({ createWorker: f.create });
    await r.runOnce('x');
    r.reset();
    expect(f.made[0].terminated).toBe(true);
  });
});
