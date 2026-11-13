// How a program's output is compared with the expected output.
// Trailing spaces on a line and blank lines at the very end do not matter; everything else does.

export function normalizeOutput(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

// -> { ok: true } or { ok: false, line, expectedLine, actualLine } for the first line that differs
export function compareOutput(expected, actual) {
  const e = normalizeOutput(expected);
  const a = normalizeOutput(actual);
  if (e === a) return { ok: true };
  const el = e.split('\n');
  const al = a.split('\n');
  let i = 0;
  while (i < el.length && i < al.length && el[i] === al[i]) i += 1;
  return {
    ok: false,
    line: i + 1,
    expectedLine: i < el.length ? el[i] : '(tidak ada baris)',
    actualLine: i < al.length ? al[i] : '(tidak ada baris)',
  };
}
