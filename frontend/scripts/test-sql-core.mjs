// Runs the SQL runner core against real SQLite (sql.js): setup, result tables, errors, isolation.
// Usage: node scripts/test-sql-core.mjs
import initSqlJs from 'sql.js';
import { run } from '../public/runners/sql-core.mjs';
const SQL = await initSqlJs();
let fails = 0;
const t = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra)); if (!ok) fails++; };

const setup = `CREATE TABLE menu (nama TEXT, harga INTEGER, catatan TEXT);
INSERT INTO menu VALUES ('Kopi Susu', 18000, NULL), ('Teh Manis', 8000, 'dingin');`;

let r = run(SQL, 'SELECT nama, harga FROM menu ORDER BY harga;', '', setup);
t('a query prints a header and one line per row', r.stdout === 'nama|harga\nTeh Manis|8000\nKopi Susu|18000\n' && !r.error, JSON.stringify(r));
r = run(SQL, 'SELECT catatan, harga / 4.0 AS seperempat FROM menu ORDER BY harga DESC;', '', setup);
t('NULL and decimals are printed plainly', r.stdout === 'catatan|seperempat\nNULL|4500\ndingin|2000\n', JSON.stringify(r.stdout));
r = run(SQL, 'SELECT count(*) AS n FROM menu;', "INSERT INTO menu VALUES ('Roti Bakar', 15000, NULL);", setup);
t("a test's input adds rows after the setup", r.stdout === 'n\n3\n', JSON.stringify(r.stdout));
r = run(SQL, 'SELECT count(*) AS n FROM menu;', '', setup);
t('every run starts from a fresh database', r.stdout === 'n\n2\n', JSON.stringify(r.stdout));
r = run(SQL, 'SELECT 1 AS a; SELECT 2 AS b;', '', '');
t('several queries give several tables', r.stdout === 'a\n1\n\nb\n2\n', JSON.stringify(r.stdout));
r = run(SQL, 'SELECT nama FROM menu WHERE harga > 99999;', '', setup);
t('a query without rows prints nothing', r.stdout === '' && !r.error, JSON.stringify(r));
r = run(SQL, "UPDATE menu SET harga = 9000 WHERE nama = 'Teh Manis'; SELECT harga FROM menu WHERE nama = 'Teh Manis';", '', setup);
t('changes are visible to later statements', r.stdout === 'harga\n9000\n', JSON.stringify(r.stdout));
r = run(SQL, 'SELEC nama FROM menu', '', setup);
t('a syntax error is reported', r.error.startsWith('Error: ') && r.error.includes('syntax error') && r.exitCode === 1 && r.stdout === '', JSON.stringify(r));
r = run(SQL, 'SELECT nama FROM tidak_ada', '', setup);
t('a missing table is reported', r.error.includes('no such table: tidak_ada'), r.error);
r = run(SQL, 'SELECT 1', '', 'CREATE TABLE (');
t('a broken setup is named as such', r.error.startsWith('Setup error: '), r.error);
r = run(SQL, 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 20000) SELECT printf("%050d", x) AS x FROM c;', '', '');
t('output is capped', r.truncated && r.stdout.length <= 64 * 1024, `${r.stdout.length}`);

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
