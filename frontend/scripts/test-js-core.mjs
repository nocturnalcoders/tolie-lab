// Runs the JavaScript runner core: console.log output, test code after the program, errors, output cap.
// Usage: node scripts/test-js-core.mjs
import { run } from '../public/runners/js-core.mjs';
let fails = 0;
const t = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra)); if (!ok) fails++; };

let r = run('const harga = 15000;\nconsole.log("Kopi", harga);\nconsole.log(`Total: Rp${harga * 2}`);');
t('console.log prints text and numbers, split by a space', r.stdout === 'Kopi 15000\nTotal: Rp30000\n' && !r.error, JSON.stringify(r));
r = run('console.log([1, 2, 3]); console.log({ nama: "Kopi", harga: 15000 }); console.log(["a", "b"]);');
t('arrays and objects print as compact JSON', r.stdout === '[1,2,3]\n{"nama":"Kopi","harga":15000}\n["a","b"]\n', JSON.stringify(r.stdout));
r = run('console.log(true, null, undefined, 0.1 + 0.2);');
t('other values print as written', r.stdout === 'true null undefined 0.30000000000000004\n', JSON.stringify(r.stdout));
r = run('function total(harga, jumlah) { return harga * jumlah; }', 'console.log(total(15000, 2));');
t("a test's code can call the learner's functions", r.stdout === '30000\n' && !r.error, JSON.stringify(r));
r = run('const total = (a, b) => a + b', 'console.log(total(1, 2))');
t('a program without a final semicolon still runs before the test', r.stdout === '3\n' && !r.error, JSON.stringify(r));
r = run('console.log("satu");\nconsole.log(belumAda);');
t('a runtime error keeps the output so far', r.stdout === 'satu\n' && r.error.startsWith('ReferenceError: belumAda') && r.exitCode === 1, JSON.stringify(r));
r = run('function (');
t('a syntax error is reported', r.error.startsWith('SyntaxError'), r.error);
r = run('throw "habis";');
t('a thrown text is reported', r.error === 'Error: habis', r.error);
r = run('bocor = 1;');
t('assigning to an undeclared name is an error (strict mode)', r.error.startsWith('ReferenceError'), r.error);
r = run('const rahasia = 42;');
r = run('console.log(typeof rahasia);');
t('variables do not leak between runs', r.stdout === 'undefined\n', JSON.stringify(r));
r = run('console.error("ups"); console.log("ok");');
t('console.error is kept apart', r.stderr === 'ups\n' && r.stdout === 'ok\n', JSON.stringify(r));
r = run('for (let i = 0; i < 200000; i++) console.log("x".repeat(50));');
t('output is capped', r.truncated && r.stdout.length <= 64 * 1024, `${r.stdout.length}`);
r = run('const a = {}; a.a = a; console.log(a);');
t('a circular object does not crash the runner', !r.error && r.stdout === '[object Object]\n', JSON.stringify(r));

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
