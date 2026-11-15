// Runs in a Web Worker. Loads SQLite (sql.js) from this site (no CDN) and runs one script per message.
// Messages in:  { id, type: 'run', code, input, setup }
// Messages out: { type: 'ready' } | { type: 'fatal', message } | { id, type: 'result', stdout, stderr, error, exitCode, truncated }
import initSqlJs from '/sqljs/sql-wasm.mjs';
import { run } from './sql-core.mjs';

let SQL = null;

const loading = initSqlJs({ locateFile: (file) => `/sqljs/${file}` })
  .then((mod) => {
    SQL = mod;
    self.postMessage({ type: 'ready' });
  })
  .catch((err) => {
    self.postMessage({ type: 'fatal', message: String((err && err.message) || err) });
  });

self.onmessage = async (event) => {
  const msg = event.data || {};
  if (msg.type !== 'run') return;
  await loading;
  if (!SQL) return;
  const result = run(SQL, msg.code, msg.input, msg.setup);
  self.postMessage({ id: msg.id, type: 'result', ...result });
};
