import { useEffect, useRef, useState } from 'react';
import CodeEditor from './CodeEditor.jsx';
import TestResults from './TestResults.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useT } from '../lang.jsx';

// The right-hand side of a code exercise: editor, "Coba" (free run with your own input),
// and "Periksa jawaban" (every test; the result is reported to the server). Java and Kotlin cannot run
// in the browser: their code goes to the server, which runs and grades it (a limited number of times a day).
export default function CodeWorkbench({ exercise, runner, status, theme, signedIn, onPassed }) {
  const t = useT();
  const cfg = exercise.code;
  const isSql = cfg.language === 'sql';
  const isJs = cfg.language === 'javascript';
  const onServer = cfg.runs === 'server';
  const { judge } = useAuth();
  const name = isSql ? 'SQL' : isJs ? 'JavaScript' : cfg.language === 'java' ? 'Java' : cfg.language === 'kotlin' ? 'Kotlin' : 'Python';
  const fileName = isSql ? 'query.sql' : isJs ? 'main.js' : cfg.language === 'java' ? 'Main.java' : cfg.language === 'kotlin' ? 'main.kt' : 'main.py';
  const STATUS_TEXT = { idle: t('{name} belum dimuat', { name }), loading: t('Memuat {name}…', { name }), ready: t('{name} siap', { name }), running: t('Menjalankan…') };
  const [creditsLeft, setCreditsLeft] = useState(null); // what the site may still run today (server languages)
  const extra = isSql ? { setup: cfg.setup || '', check: cfg.check || '' } : {}; // SQL runs against the tables of the exercise
  const hints = cfg.hints || [];
  const [code, setCode] = useState(cfg.saved ?? cfg.starter);
  const [stdin, setStdin] = useState('');
  const [panel, setPanel] = useState(null); // { kind: 'try' | 'tests', ... }
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(0); // how many hints are open
  const [saveError, setSaveError] = useState('');
  const lastSaved = useRef(cfg.saved ?? cfg.starter);

  // When the lesson arrives in another language, the starter code changes with it. Code the learner
  // has not touched follows; code they wrote stays.
  const starter = useRef(cfg.starter);
  useEffect(() => {
    const previous = starter.current;
    starter.current = cfg.starter;
    if (previous !== cfg.starter && code === previous) {
      if (lastSaved.current === previous) lastSaved.current = cfg.starter;
      setCode(cfg.starter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.starter]);

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
    // Coba shows what the learner's own script returns; the exercise's check query is for the tests only.
    const r = await runner.runOnce(code, isSql || isJs ? '' : stdin, isSql ? { setup: extra.setup } : extra);
    setPanel({ kind: 'try', ...r });
    setBusy(false);
  }

  // Java and Kotlin: the server runs every test in one go and records the result itself.
  async function checkOnServer() {
    setBusy(true);
    setSaveError('');
    setPanel({ kind: 'tests', results: [], total: cfg.tests.length, pending: true });
    try {
      const out = await api(`/api/exercises/${exercise.id}/judge`, { method: 'POST', body: { code } });
      setPanel({ kind: 'tests', results: out.results, total: out.total });
      setCreditsLeft(out.credits_left);
      lastSaved.current = code;
      if (out.all_passed) onPassed(exercise.id, out);
    } catch (err) {
      setPanel(null);
      setSaveError(err.message);
    }
    setBusy(false);
  }

  async function check() {
    if (onServer) {
      await checkOnServer();
      return;
    }
    setBusy(true);
    setSaveError('');
    setPanel({ kind: 'tests', results: [], total: cfg.tests.length, pending: true });
    const res = await runner.runTests(code, cfg.tests, (partial) =>
      setPanel({ kind: 'tests', results: partial, total: cfg.tests.length, pending: true }),
    extra);
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
        <span className="file">{fileName}</span>
        <span className={`py-status s-${onServer ? 'ready' : status}`}>{onServer ? t('Dijalankan di server') : STATUS_TEXT[status] || ''}</span>
      </div>
      <CodeEditor value={code} onChange={setCode} theme={theme} language={isSql ? 'sql' : isJs ? 'javascript' : onServer ? 'java' : 'python'} label={t('Editor kode {name}', { name })} onRun={busy ? undefined : check} />
      {isSql && cfg.setup && (
        <details className="stdin">
          <summary>{t('Tabel yang tersedia')}</summary>
          <pre className="out">{cfg.setup}</pre>
        </details>
      )}
      {!isSql && !isJs && !onServer && <details className="stdin">
        <summary>{t('Input untuk tombol Coba (opsional)')}</summary>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          spellCheck={false}
          aria-label={t('Input untuk programmu, satu baris per input()')}
          placeholder={t('Satu baris untuk tiap input().\nContoh:\n15000\n2')}
        />
      </details>}
      <div className="row run-bar">
        <button type="button" onClick={check} disabled={busy || (onServer && (!judge || !signedIn))}>{t('Periksa jawaban')}</button>
        {!onServer && <button type="button" className="ghost" onClick={tryCode} disabled={busy}>{t('Coba')}</button>}
        {hints.length > 0 && (
          <button type="button" className="link" onClick={() => setShown((n) => (n >= hints.length ? 0 : n + 1))} aria-expanded={shown > 0}>
            {shown === 0 ? t('Petunjuk') : shown < hints.length ? t('Petunjuk berikutnya') : t('Sembunyikan petunjuk')}
          </button>
        )}
        <button type="button" className="link" onClick={restart}>{t('Kode awal')}</button>
        <span className="muted keys">{t('Ctrl+Enter memeriksa')}</span>
      </div>
      {hints.slice(0, shown).map((h, i) => (
        <p className="hint-box" role="note" key={h}>
          {hints.length > 1 && <b>{t('Petunjuk {n} dari {total}:', { n: i + 1, total: hints.length })} </b>}
          {h}
        </p>
      ))}
      {onServer && (
        <p className="muted" role="note">
          {!judge
            ? t('Menjalankan kode {name} belum dibuka di situs ini. Latihan ini opsional; pelajaran tetap bisa diselesaikan lewat soal pilihan ganda.', { name })
            : !signedIn
              ? t('Masuk untuk menjalankan kode {name}: kodenya dijalankan di server.', { name })
              : t('Kode {name} dijalankan di server dan jatah hariannya terbatas, jadi baca ulang kodemu sebelum memeriksa. Latihan ini opsional.', { name })}
          {creditsLeft !== null && ` ${t('Sisa jatah situs hari ini: {n}.', { n: creditsLeft })}`}
        </p>
      )}
      {saveError && <p className="flash err" role="alert">{saveError}</p>}
      {panel && panel.kind === 'try' && (
        <div className="out-panel" aria-live="polite">
          {panel.pending ? (
            <p className="muted">{t('Menjalankan…')}</p>
          ) : (
            <>
              <p className="results-head">{t('Hasil Coba')}</p>
              {panel.stdout === '' && !panel.error && <p className="muted">{isSql ? t('(query-mu tidak menghasilkan baris apa pun)') : t('(programmu tidak mencetak apa pun)')}</p>}
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
      {!signedIn && !onServer && (
        <p className="muted">{t('Kamu belum masuk, jadi kemajuan tidak tersimpan. Kodenya tetap bisa dijalankan.')}</p>
      )}
    </div>
  );
}
