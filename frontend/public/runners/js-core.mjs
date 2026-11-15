// Runs one JavaScript program and returns what it printed with console.log.
// Used by js-worker.mjs in the browser and by the Node tests (same code).
//
// run(code, input) -> { stdout, stderr, error, exitCode, truncated }
//   input    JavaScript from one test, run right after the learner's code in the same scope, so
//            it can call the learner's functions:  console.log(hitungTotal(15000, 2))
//   stdout   one line per console.log. Text is printed as it is; numbers, true/false, null and
//            undefined as written; arrays and objects as compact JSON: [1,2,3]  {"nama":"Kopi"}
// Only synchronous code is supported: nothing that finishes later (setTimeout, promises) is waited for.

export const MAX_OUTPUT = 64 * 1024;

export function show(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'function') return '[Function]';
  if (value === undefined || value === null || typeof value !== 'object') return String(value);
  try {
    const text = JSON.stringify(value);
    return text === undefined ? String(value) : text;
  } catch {
    return String(value); // an object that points back at itself
  }
}

export function run(code, input = '') {
  let stdout = '';
  let stderr = '';
  let truncated = false;
  let error = '';
  const writer = (toErr) => (...args) => {
    const line = `${args.map(show).join(' ')}\n`;
    if (toErr) stderr += line;
    else if (stdout.length < MAX_OUTPUT) stdout += line;
    else truncated = true;
  };
  const log = writer(false);
  const fakeConsole = { log, info: log, debug: log, warn: writer(true), error: writer(true) };
  try {
    // eslint-disable-next-line no-new-func
    new Function('console', `"use strict";\n${String(code)}\n;${String(input)}`)(fakeConsole);
  } catch (e) {
    error = e instanceof Error ? `${e.name}: ${e.message}` : `Error: ${show(e)}`;
  }
  if (stdout.length > MAX_OUTPUT) {
    stdout = stdout.slice(0, MAX_OUTPUT);
    truncated = true;
  }
  return { stdout, stderr, error, exitCode: error ? 1 : 0, truncated };
}
