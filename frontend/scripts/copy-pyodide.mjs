// Copies the Pyodide files from node_modules into public/pyodide so the app serves them itself.
// No CDN is involved: the learner's browser only talks to this site.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
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
