import { useEffect, useRef, useState } from 'react';
import CodeEditor from './CodeEditor.jsx';
import TestResults from './TestResults.jsx';
import { api } from '../api.js';
import { useT } from '../lang.jsx';

// The right-hand side of a code exercise: editor, "Coba" (free run with your own input),
// and "Periksa jawaban" (every test; the result is reported to the server).
export default function CodeWorkbench({ exercise, runner, status, theme, signedIn, onPassed }) {
  const t = useT();
  const STATUS_TEXT = { idle: t('Python belum dimuat'), loading: t('Memuat Python…'), ready: t('Python siap'), running: t('Menjalankan…') };
  const cfg = exercise.code;
  const [code, setCode] = useState(cfg.saved ?? cfg.starter);
  const [stdin, setStdin] = useState('');
  const [panel, setPanel] = useState(null); // { kind: 'try' | 'tests', ... }
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(false);
  const [saveError, setSaveError] = useState('');
  const lastSaved = useRef(cfg.saved ?? cfg.starter);

  // Save the code while the learner types (only when signed in).
  useEffect(() => {
    if (!signedIn || code === lastSaved.current) return undefined;
    const t = setTimeout(() => {
      api(`/api/exercises/${exercise.id}/draft`, { method: 'POST', body: { code } })
        .then(() => {
          lastSaved.current = code;
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [code, signedIn, exercise.id]);

  async function tryCode() {
    setBusy(true);
    setPanel({ kind: 'try', pending: true });
    const r = await runner.runOnce(code, stdin);
    setPanel({ kind: 'try', ...r });
    setBusy(false);
  }

  async function check() {
    setBusy(true);
    setSaveError('');
    setPanel({ kind: 'tests', results: [], total: cfg.tests.length, pending: true });
    const res = await runner.runTests(code, cfg.tests, (partial) =>
      setPanel({ kind: 'tests', results: partial, total: cfg.tests.length, pending: true })
    );
    setPanel({ kind: 'tests', results: res.results, total: res.total });
    if (signedIn && !res.results.some((r) => r.skipped || r.timedOut)) {
      try {
        const out = await api(`/api/exercises/${exercise.id}/result`, {
          method: 'POST',
          body: { code, passed: res.passed, total: res.total },
        });
        lastSaved.current = code;
        if (out.passed) onPassed(exercise.id, out);
      } catch (err) {
        setSaveError(t('Hasil tes belum tersimpan: {message}', { message: err.message }));
      }
    } else if (!signedIn && res.passed === res.total) {
      onPassed(exercise.id, null);
    }
    setBusy(false);
  }

  function restart() {
    if (window.confirm(t('Kembalikan kode ke kode awal? Kodemu saat ini akan hilang.'))) {
      setCode(cfg.starter);
      setPanel(null);
    }
  }

  return (
    <div className="bench-work">
      <div className="editor-bar">
        <span className="file">main.py</span>
        <span className={`py-status s-${status}`}>{STATUS_TEXT[status] || ''}</span>
      </div>
      <CodeEditor value={code} onChange={setCode} theme={theme} onRun={busy ? undefined : check} />
      <details className="stdin">
        <summary>{t('Input untuk tombol Coba (opsional)')}</summary>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          spellCheck={false}
          aria-label={t('Input untuk programmu, satu baris per input()')}
          placeholder={t('Satu baris untuk tiap input().\nContoh:\n15000\n2')}
        />
      </details>
      <div className="row run-bar">
        <button type="button" onClick={check} disabled={busy}>{t('Periksa jawaban')}</button>
        <button type="button" className="ghost" onClick={tryCode} disabled={busy}>{t('Coba')}</button>
        {cfg.hint && (
          <button type="button" className="link" onClick={() => setHint((h) => !h)} aria-expanded={hint}>
            {hint ? t('Sembunyikan petunjuk') : t('Petunjuk')}
          </button>
        )}
        <button type="button" className="link" onClick={restart}>{t('Kode awal')}</button>
        <span className="muted keys">{t('Ctrl+Enter memeriksa')}</span>
      </div>
      {hint && <p className="hint-box" role="note">{cfg.hint}</p>}
      {saveError && <p className="flash err" role="alert">{saveError}</p>}
      {panel && panel.kind === 'try' && (
        <div className="out-panel" aria-live="polite">
          {panel.pending ? (
            <p className="muted">{t('Menjalankan…')}</p>
          ) : (
            <>
              <p className="results-head">{t('Hasil Coba')}</p>
              {panel.stdout === '' && !panel.error && <p className="muted">{t('(programmu tidak mencetak apa pun)')}</p>}
              {panel.stdout !== '' && <pre className="out">{panel.stdout}</pre>}
              {panel.stderr && <pre className="out err">{panel.stderr}</pre>}
              {panel.error && <pre className="out err">{panel.error}</pre>}
              {panel.truncated && <p className="muted">{t('Keluaran dipotong karena terlalu panjang.')}</p>}
            </>
          )}
        </div>
      )}
      {panel && panel.kind === 'tests' && (panel.pending && panel.results.length === 0 ? (
        <div className="out-panel"><p className="muted">{t('Menjalankan tes…')}</p></div>
      ) : (
        <TestResults results={panel.results} total={panel.total} />
      ))}
      {!signedIn && (
        <p className="muted">{t('Kamu belum masuk, jadi kemajuan tidak tersimpan. Kodenya tetap bisa dijalankan.')}</p>
      )}
    </div>
  );
}
