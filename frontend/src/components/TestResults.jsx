import { useT } from '../lang.jsx';

// The list of test cases after "Periksa jawaban": one row per test, details for the ones that failed.
export default function TestResults({ results, total }) {
  const t = useT();
  if (!results) return null;
  const passed = results.filter((r) => r.ok).length;
  const all = passed === total;
  return (
    <div className={`results${all ? ' all-ok' : ''}`} aria-live="polite">
      <p className="results-head">
        {all ? t('Semua {total} tes lulus.', { total }) : t('{passed} dari {total} tes lulus.', { passed, total })}
      </p>
      <ol className="tests">
        {results.map((r, i) => (
          <li key={r.index} className={r.ok ? 'ok' : 'bad'}>
            <details open={!r.ok && results.findIndex((x) => !x.ok) === i}>
              <summary>
                <span className="mark" aria-hidden="true">{r.ok ? '✓' : '✗'}</span>
                {t('Tes {n}', { n: i + 1 })}
                <span className="sr"> {r.ok ? t('lulus') : r.skipped ? t('tidak dijalankan') : t('gagal')}</span>
              </summary>
              {r.skipped ? (
                <p className="muted">{t('Tidak dijalankan karena tes sebelumnya terhenti.')}</p>
              ) : (
                <dl>
                  {r.input !== '' && (
                    <>
                      <dt>{t('Input')}</dt>
                      <dd><pre>{r.input}</pre></dd>
                    </>
                  )}
                  <dt>{t('Seharusnya')}</dt>
                  <dd><pre>{r.expected}</pre></dd>
                  {!r.ok && (
                    <>
                      <dt>{t('Hasil programmu')}</dt>
                      <dd><pre>{r.actual === '' ? t('(tidak mencetak apa pun)') : r.actual}</pre></dd>
                    </>
                  )}
                  {!r.ok && r.error && (
                    <>
                      <dt>{t('Pesan error')}</dt>
                      <dd><pre className="err">{r.error}</pre></dd>
                    </>
                  )}
                  {!r.ok && !r.error && r.diff && (
                    <>
                      <dt>{t('Beda di baris {line}', { line: r.diff.line })}</dt>
                      <dd>
                        <pre>{`${t('seharusnya:')} ${r.diff.expectedLine}\n${t('hasilmu:')}    ${r.diff.actualLine}`}</pre>
                      </dd>
                    </>
                  )}
                </dl>
              )}
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
