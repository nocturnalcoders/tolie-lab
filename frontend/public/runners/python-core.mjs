// Runs one Python program in a Pyodide instance and returns what it printed.
// Used by python-worker.mjs in the browser and by the Node tests (same code, real Pyodide).
//
// run(pyodide, code, input) -> { stdout, stderr, error, exitCode, truncated }
//   stdout / stderr   text the program wrote
//   error             a short traceback when the program crashed, or '' when it did not
//   exitCode          0 normally, or the number given to exit()/sys.exit()
//   truncated         true when the output was cut at MAX_OUTPUT characters

export const MAX_OUTPUT = 64 * 1024;

const decoder = new TextDecoder('utf-8');

function makeSink() {
  const chunks = [];
  let size = 0;
  let truncated = false;
  return {
    write(buf) {
      if (size < MAX_OUTPUT * 4) {
        chunks.push(buf.slice());
        size += buf.length;
      } else {
        truncated = true;
      }
      return buf.length;
    },
    text() {
      const all = new Uint8Array(size);
      let at = 0;
      for (const c of chunks) {
        all.set(c, at);
        at += c.length;
      }
      let s = decoder.decode(all);
      if (s.length > MAX_OUTPUT) {
        s = s.slice(0, MAX_OUTPUT);
        truncated = true;
      }
      return s;
    },
    get truncated() {
      return truncated;
    },
  };
}

// Pyodide wraps every error in a long traceback that starts inside its own files.
// Keep only the part about the learner's code and call that file main.py.
export function cleanTraceback(message) {
  const lines = String(message || '').replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const kept = start === -1 ? lines.slice(-3) : lines.slice(start);
  const body = kept.join('\n').replace(/File "<exec>"/g, 'File "main.py"').trimEnd();
  return start === -1 ? body : `Traceback (most recent call last):\n${body}`;
}

export async function run(pyodide, code, input = '') {
  const out = makeSink();
  const err = makeSink();
  const lines = String(input).replace(/\r\n/g, '\n').split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let next = 0;

  pyodide.setStdout({ write: (b) => out.write(b) });
  pyodide.setStderr({ write: (b) => err.write(b) });
  pyodide.setStdin({ stdin: () => (next < lines.length ? lines[next++] : undefined) });

  const globals = pyodide.globals.get('dict')();
  let error = '';
  let exitCode = 0;
  try {
    pyodide.runPython(String(code), { globals });
  } catch (e) {
    if (e && e.type === 'SystemExit') {
      const m = /SystemExit:\s*(.*)\s*$/.exec(String(e.message));
      const raw = m ? m[1].trim() : '';
      exitCode = raw === '' || raw === 'None' ? 0 : Number.isNaN(Number(raw)) ? 1 : Number(raw);
    } else {
      error = cleanTraceback(e && e.message);
    }
  } finally {
    globals.destroy();
    // Text printed without a final newline stays buffered inside Python until it is flushed.
    // Flush now, or it would show up in the next run.
    try {
      pyodide.runPython('import sys\nsys.stdout.flush()\nsys.stderr.flush()');
    } catch {
      /* nothing to flush */
    }
  }
  return { stdout: out.text(), stderr: err.text(), error, exitCode, truncated: out.truncated || err.truncated };
}
