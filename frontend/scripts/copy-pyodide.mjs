// Copies the Pyodide (Python) and sql.js (SQLite) files from node_modules into public/ so the app
// serves them itself. No CDN is involved: the learner's browser only talks to this site.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', 'pyodide');
const to = join(root, 'public', 'pyodide');
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

if (!existsSync(from)) {
  console.error('pyodide is not installed. Run npm ci first.');
  process.exit(1);
}
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
for (const f of files) cpSync(join(from, f), join(to, f));
console.log(`Copied ${files.length} Pyodide files to public/pyodide`);

// sql.js ships as a plain script. The worker is a module, so the script gets an export line, and
// the `module` and `exports` names it probes are declared (a module is strict: undeclared names throw).
const sqlFrom = join(root, 'node_modules', 'sql.js', 'dist');
const sqlTo = join(root, 'public', 'sqljs');
if (!existsSync(sqlFrom)) {
  console.error('sql.js is not installed. Run npm ci first.');
  process.exit(1);
}
rmSync(sqlTo, { recursive: true, force: true });
mkdirSync(sqlTo, { recursive: true });
cpSync(join(sqlFrom, 'sql-wasm.wasm'), join(sqlTo, 'sql-wasm.wasm'));
writeFileSync(join(sqlTo, 'sql-wasm.mjs'), `var module, exports;\n${readFileSync(join(sqlFrom, 'sql-wasm.js'), 'utf8')}\nexport default initSqlJs;\n`);
console.log('Copied 2 sql.js files to public/sqljs');
