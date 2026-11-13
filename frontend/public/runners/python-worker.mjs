// Runs in a Web Worker. Loads Pyodide from this site (no CDN) and runs one program per message.
// Messages in:  { id, type: 'run', code, input }
// Messages out: { type: 'ready' } | { type: 'fatal', message } | { id, type: 'result', stdout, stderr, error, exitCode, truncated }
import { loadPyodide } from '/pyodide/pyodide.mjs';
import { run } from './python-core.mjs';

let pyodide = null;

const loading = loadPyodide({ indexURL: '/pyodide/' })
  .then((py) => {
    pyodide = py;
    self.postMessage({ type: 'ready' });
  })
  .catch((err) => {
    self.postMessage({ type: 'fatal', message: String((err && err.message) || err) });
  });

self.onmessage = async (event) => {
  const msg = event.data || {};
  if (msg.type !== 'run') return;
  await loading;
  if (!pyodide) return;
  const result = await run(pyodide, msg.code, msg.input);
  self.postMessage({ id: msg.id, type: 'result', ...result });
};
