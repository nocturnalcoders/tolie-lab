// Quality gate for course content. For every code exercise it runs the author's `solution`
// and the `starter` code in real Pyodide (Python), real SQLite (SQL) or JavaScript, using the
// same runner the learner's browser uses. Translations (exercises.en.yml) are checked the same way:
//   - the solution must pass every test
//   - the starter must NOT pass every test (otherwise the exercise is free points)
// Usage: node scripts/check-content.mjs ../content [course-slug]   (one course, or all of them)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadPyodide } from 'pyodide';
import YAML from 'yaml';
import initSqlJs from 'sql.js';
import { run } from '../public/runners/python-core.mjs';
import { run as runSql } from '../public/runners/sql-core.mjs';
import { run as runJs } from '../public/runners/js-core.mjs';
import { compareOutput } from '../src/grading.js';

const root = resolve(process.argv[2] || '../content');
const dirs = (p) => readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()).sort();

async function passes(engine, code, tests, ex) {
  const failed = [];
  for (const t of tests) {
    const r = engine.sql ? runSql(engine.sql, code, t.input ?? '', ex.setup ?? '', ex.check ?? '') : engine.js ? runJs(code, t.input ?? '') : await run(engine.py, code, t.input ?? '');
    const c = compareOutput(t.output, r.stdout);
    if (r.error || !c.ok) failed.push({ input: t.input, error: r.error.split('\n').pop(), got: r.stdout.slice(0, 80), want: t.output });
  }
  return failed;
}

const py = await loadPyodide();
const SQL = await initSqlJs();
let problems = 0;
let code = 0;
let choice = 0;
let remote = 0;
const only = process.argv[3];
for (const course of dirs(root).filter((c) => !only || c === only)) {
  let courseLanguage = 'python';
  try {
    courseLanguage = YAML.parse(readFileSync(join(root, course, 'course.yml'), 'utf8')).language || 'python';
  } catch {
    /* the backend check reports a missing or broken course.yml */
  }
  // exercises.yml and its translations (exercises.en.yml) of every lesson
  const files = dirs(join(root, course)).flatMap((lesson) =>
    readdirSync(join(root, course, lesson)).filter((n) => /^exercises(\.[a-z]{2})?\.yml$/.test(n)).sort().map((name) => [lesson, name]));
  for (const [lesson, name] of files) {
    const file = join(root, course, lesson, name);
    let list;
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue; // a lesson without exercises is fine
    }
    try {
      list = YAML.parse(raw) || [];
    } catch (err) {
      console.log(`FAIL ${course}/${lesson}: ${name} is not valid YAML (${err.message.split('\n')[0]})`);
      problems += 1;
      continue;
    }
    for (const ex of list) {
      const where = `${course}/${lesson}/${name === 'exercises.yml' ? '' : `${name}/`}${ex.slug}`;
      if (ex.type === 'choice') {
        choice += 1;
        const ok = Array.isArray(ex.correct) && ex.correct.every((i) => Number.isInteger(i) && i >= 0 && i < ex.options.length);
        if (!ok) { console.log(`FAIL ${where}: "correct" points outside the options`); problems += 1; }
        continue;
      }
      const language = ex.language || courseLanguage;
      if (language === 'java' || language === 'kotlin') {
        remote += 1; // not runnable here: `python backend/judge.py check content` checks these
        continue;
      }
      code += 1;
      const engine = language === 'sql' ? { sql: SQL } : language === 'javascript' ? { js: true } : { py };
      const solFail = await passes(engine, ex.solution || '', ex.tests || [], ex);
      if (solFail.length) {
        problems += 1;
        console.log(`FAIL ${where}: the solution fails ${solFail.length}/${ex.tests.length} tests`);
        for (const f of solFail.slice(0, 2)) console.log('     ', JSON.stringify(f));
      }
      const startFail = await passes(engine, ex.starter || '', ex.tests || [], ex);
      if (startFail.length === 0) {
        problems += 1;
        console.log(`FAIL ${where}: the starter code already passes every test`);
      }
    }
  }
}
console.log(`${code} code and ${choice} multiple-choice exercises checked, ${problems} problem(s)${remote ? ` (${remote} Java/Kotlin exercises are checked by backend/judge.py)` : ''}`);
process.exit(problems ? 1 : 0);
