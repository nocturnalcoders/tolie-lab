// Runs the Python runner core against real Pyodide: stdin, stdout, errors, exit codes, output cap.
// Usage: node scripts/test-python-core.mjs
import { loadPyodide } from 'pyodide';
import { run, cleanTraceback } from '../public/runners/python-core.mjs';
const py = await loadPyodide();
let fails = 0;
const t = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra)); if (!ok) fails++; };

let r = await run(py, 'n = int(input())\nname = input()\nprint(n * 2, name)\nprint("tanpa newline", end="")', '5\nkopi\n');
t('stdin, stdout, partial last line', r.stdout === '10 kopi\ntanpa newline' && !r.error, JSON.stringify(r));
r = await run(py, 'print("Rp", 12500)\nprint("é ☕")');
t('utf-8 output', r.stdout === 'Rp 12500\né ☕\n', JSON.stringify(r.stdout));
r = await run(py, 'x = 1/0');
t('runtime error is short and names main.py', r.error.startsWith('Traceback') && r.error.includes('File "main.py", line 1') && r.error.includes('ZeroDivisionError') && !r.error.includes('_pyodide'), r.error);
r = await run(py, 'def f(:\n  pass');
t('syntax error is short', r.error.includes('SyntaxError') && !r.error.includes('_pyodide') && r.error.includes('main.py'), r.error);
r = await run(py, 'import sys\nprint("bye")\nsys.exit(0)');
t('exit(0) is not an error', r.error === '' && r.exitCode === 0 && r.stdout === 'bye\n', JSON.stringify(r));
r = await run(py, 'import sys\nsys.exit(3)');
t('exit(3) reports the code', r.error === '' && r.exitCode === 3, JSON.stringify(r));
r = await run(py, 'input()');
t('input() with no data raises EOFError', r.error.includes('EOFError'), r.error);
r = await run(py, 'import sys\nprint("oops", file=sys.stderr)');
t('stderr is separate', r.stderr === 'oops\n' && r.stdout === '', JSON.stringify(r));
r = await run(py, 'for i in range(200000):\n    print("x" * 50)');
t('output is capped', r.truncated && r.stdout.length <= 64 * 1024, `${r.stdout.length}`);
r = await run(py, 'secret = 42');
r = await run(py, 'print(secret)');
t('variables do not leak between runs', r.error.includes('NameError'), r.error);
r = await run(py, 'print(input("Nama: "))', 'Budi\n');
t('input prompt is printed', r.stdout === 'Nama: Budi\n' || r.stdout === 'Nama: ', JSON.stringify(r.stdout));
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
