// Runs one SQL script in a fresh in-memory SQLite database and returns the result tables as text.
// Used by sql-worker.mjs in the browser and by the Node tests (same code, real SQLite).
//
// run(SQL, code, input, setup, check) -> { stdout, stderr, error, exitCode, truncated }
//   SQL      the module that initSqlJs() resolves to
//   setup    SQL from the exercise: the tables and rows every test starts with
//   input    SQL from one test: extra rows, so an answer cannot be a hard-coded table
//   check    SQL from the exercise, for exercises that change data (INSERT, UPDATE, CREATE TABLE):
//            it runs after the learner's script, and then only its result tables are the output
//   stdout   every result table, sqlite3 style: a header line, then one line per row, values split by |

export const MAX_OUTPUT = 64 * 1024;

function cell(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) return '<blob>';
  return String(value);
}

export function formatResults(results) {
  return results
    .map((r) => [r.columns.join('|'), ...r.values.map((row) => row.map(cell).join('|'))].join('\n'))
    .join('\n\n');
}

export function run(SQL, code, input = '', setup = '', check = '') {
  const db = new SQL.Database();
  let stdout = '';
  let error = '';
  let truncated = false;
  try {
    try {
      if (String(setup).trim()) db.exec(String(setup));
      if (String(input).trim()) db.exec(String(input));
    } catch (e) {
      // Not the learner's fault: the exercise itself is broken.
      return { stdout: '', stderr: '', error: `Setup error: ${(e && e.message) || e}`, exitCode: 1, truncated: false };
    }
    let results = [];
    try {
      results = db.exec(String(code));
    } catch (e) {
      error = `Error: ${(e && e.message) || e}`;
    }
    if (!error && String(check).trim()) {
      try {
        results = db.exec(String(check));
      } catch (e) {
        // The check reads what the learner was asked to create, so say what it could not find.
        error = `Error: ${(e && e.message) || e}`;
      }
    }
    if (!error) {
      stdout = formatResults(results);
      if (stdout) stdout += '\n';
    }
  } finally {
    db.close();
  }
  if (stdout.length > MAX_OUTPUT) {
    stdout = stdout.slice(0, MAX_OUTPUT);
    truncated = true;
  }
  return { stdout, stderr: '', error, exitCode: error ? 1 : 0, truncated };
}
