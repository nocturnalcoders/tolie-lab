// Runs in a Web Worker and runs one JavaScript program per message. Nothing to download: the
// browser already speaks JavaScript. An endless loop is stopped by the page, which kills the worker.
// Messages in:  { id, type: 'run', code, input }
// Messages out: { type: 'ready' } | { id, type: 'result', stdout, stderr, error, exitCode, truncated }
import { run } from './js-core.mjs';

self.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type !== 'run') return;
  self.postMessage({ id: msg.id, type: 'result', ...run(msg.code, msg.input) });
};
self.postMessage({ type: 'ready' });
