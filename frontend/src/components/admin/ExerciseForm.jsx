import { useState } from 'react';
import TestResults from '../TestResults.jsx';
import { api } from '../../api.js';

const blankTest = () => ({ input: '', output: '' });

function fromExercise(ex, type) {
  if (!ex) {
    return type === 'choice'
      ? { type, title: '', slug: '', prompt: '', required: true, hint: '', options: ['', ''], correct: [], multiple: false, explanation: '' }
      : { type, title: '', slug: '', prompt: '', required: true, hint: '', starter: '', solution: '', tests: [blankTest()] };
  }
  const c = ex.config;
  const base = { type: ex.type, title: ex.title, slug: ex.slug, prompt: ex.prompt, required: ex.required, hint: c.hint || '' };
  return ex.type === 'choice'
    ? { ...base, options: [...c.options], correct: [...c.correct], multiple: !!c.multiple, explanation: c.explanation }
    : { ...base, starter: c.starter || '', solution: c.solution || '', tests: c.tests.map((t) => ({ input: t.input || '', output: t.output })) };
}

// One form for both kinds of question. Code questions are checked in the browser before they are saved:
// the solution must pass every test, and the starter code must not (otherwise it is free points).
export default function ExerciseForm({ exercise, type, lessonId, language, runner, status, onSaved, onCancel }) {
  const [f, setF] = useState(() => fromExercise(exercise, type));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verdict, setVerdict] = useState(null); // { ok, message, results? }
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const isChoice = f.type === 'choice';

  function setOption(i, value) {
    setF((s) => ({ ...s, options: s.options.map((o, j) => (j === i ? value : o)) }));
  }
  function addOption() {
    setF((s) => (s.options.length >= 8 ? s : { ...s, options: [...s.options, ''] }));
  }
  function removeOption(i) {
    setF((s) => {
      if (s.options.length <= 2) return s;
      const correct = s.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c));
      return { ...s, options: s.options.filter((_, j) => j !== i), correct };
    });
  }
  function toggleCorrect(i) {
    setF((s) => {
      if (!s.multiple) return { ...s, correct: [i] };
      return { ...s, correct: s.correct.includes(i) ? s.correct.filter((c) => c !== i) : [...s.correct, i].sort((a, b) => a - b) };
    });
  }
  function setMultiple(e) {
    const multiple = e.target.checked;
    setF((s) => ({ ...s, multiple, correct: multiple ? s.correct : s.correct.slice(0, 1) }));
  }
  function setTest(i, key, value) {
    setF((s) => ({ ...s, tests: s.tests.map((t, j) => (j === i ? { ...t, [key]: value } : t)) }));
  }

  function payload() {
    const common = { type: f.type, title: f.title, slug: f.slug.trim(), prompt: f.prompt, required: f.required, hint: f.hint };
    if (isChoice) {
      return { ...common, options: f.options.map((o) => o.trim()), correct: f.correct, multiple: f.multiple, explanation: f.explanation };
    }
    return { ...common, language, starter: f.starter, solution: f.solution, tests: f.tests.map((t) => ({ input: t.input, output: t.output })) };
  }

  // Runs the solution and the starter. Returns true when the question is sound.
  async function gate() {
    if (isChoice) return true;
    if (!f.tests.length || f.tests.some((t) => t.output.trim() === '')) {
      setVerdict({ ok: false, message: 'Setiap tes butuh keluaran yang diharapkan.' });
      return false;
    }
    setVerdict({ ok: true, message: 'Menguji solusi dan kode awal…', pending: true });
    const sol = await runner.runTests(f.solution, f.tests);
    if (sol.passed !== sol.total) {
      setVerdict({ ok: false, message: `Solusimu belum lulus semua tes (${sol.passed} dari ${sol.total}). Perbaiki solusi atau tesnya.`, results: sol });
      return false;
    }
    const start = await runner.runTests(f.starter, f.tests);
    if (start.passed === start.total) {
      setVerdict({ ok: false, message: 'Kode awal sudah lulus semua tes, jadi peserta tidak perlu mengerjakan apa pun. Kosongkan sebagian kode awalnya.' });
      return false;
    }
    setVerdict({ ok: true, message: `Solusi lulus ${sol.total} dari ${sol.total} tes, dan kode awal belum lulus. Soal ini layak disimpan.` });
    return true;
  }

  async function test(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    await gate();
    setBusy(false);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!(await gate())) return;
      const body = payload();
      const out = exercise
        ? await api(`/api/admin/exercises/${exercise.id}`, { method: 'PUT', body })
        : await api(`/api/admin/lessons/${lessonId}/exercises`, { method: 'POST', body });
      onSaved(out.exercise);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card panel ex-form" onSubmit={save} aria-label={exercise ? 'Edit soal' : 'Soal baru'}>
      <span className="tab">{isChoice ? 'Pilihan ganda' : 'Latihan kode'}</span>
      <h2>{exercise ? 'Edit soal' : 'Soal baru'}</h2>

      <label htmlFor="ex-title">Judul soal</label>
      <input id="ex-title" type="text" value={f.title} onChange={set('title')} required maxLength={120} />

      <label htmlFor="ex-prompt">{isChoice ? 'Pertanyaan' : 'Perintah'} <small>(Markdown; pakai `kode` untuk potongan kode)</small></label>
      <textarea id="ex-prompt" value={f.prompt} onChange={set('prompt')} rows={5} required />

      {isChoice ? (
        <fieldset className="opts-edit">
          <legend>Pilihan jawaban <small>(tandai yang benar)</small></legend>
          {f.options.map((o, i) => (
            <div className="opt-row" key={i}>
              <input
                type={f.multiple ? 'checkbox' : 'radio'}
                name="correct"
                checked={f.correct.includes(i)}
                onChange={() => toggleCorrect(i)}
                aria-label={`Pilihan ${i + 1} benar`}
              />
              <input type="text" value={o} onChange={(e) => setOption(i, e.target.value)} aria-label={`Teks pilihan ${i + 1}`} required />
              <button type="button" className="link danger" onClick={() => removeOption(i)} disabled={f.options.length <= 2}>Hapus</button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="ghost" onClick={addOption} disabled={f.options.length >= 8}>Tambah pilihan</button>
            <label className="check"><input type="checkbox" checked={f.multiple} onChange={setMultiple} /> Boleh lebih dari satu jawaban benar</label>
          </div>
          <label htmlFor="ex-explain">Penjelasan <small>(tampil setelah dijawab benar)</small></label>
          <textarea id="ex-explain" value={f.explanation} onChange={set('explanation')} rows={3} required />
        </fieldset>
      ) : (
        <>
          <label htmlFor="ex-starter">Kode awal <small>(yang tampil di editor peserta)</small></label>
          <textarea id="ex-starter" className="mono" value={f.starter} onChange={set('starter')} rows={6} spellCheck={false} />
          <label htmlFor="ex-solution">Solusi <small>(tidak pernah dikirim ke peserta)</small></label>
          <textarea id="ex-solution" className="mono" value={f.solution} onChange={set('solution')} rows={6} spellCheck={false} required />
          <fieldset className="tests-edit">
            <legend>Tes <small>(input satu baris per input(); keluaran yang diharapkan)</small></legend>
            {f.tests.map((t, i) => (
              <div className="test-row-edit" key={i}>
                <div>
                  <label htmlFor={`t-in-${i}`}>Input tes {i + 1}</label>
                  <textarea id={`t-in-${i}`} className="mono" rows={2} value={t.input} onChange={(e) => setTest(i, 'input', e.target.value)} spellCheck={false} />
                </div>
                <div>
                  <label htmlFor={`t-out-${i}`}>Keluaran tes {i + 1}</label>
                  <textarea id={`t-out-${i}`} className="mono" rows={2} value={t.output} onChange={(e) => setTest(i, 'output', e.target.value)} spellCheck={false} />
                </div>
                <button type="button" className="link danger" onClick={() => setF((s) => ({ ...s, tests: s.tests.filter((_, j) => j !== i) }))} disabled={f.tests.length <= 1}>Hapus</button>
              </div>
            ))}
            <button type="button" className="ghost" onClick={() => setF((s) => ({ ...s, tests: [...s.tests, blankTest()] }))}>Tambah tes</button>
          </fieldset>
        </>
      )}

      <label htmlFor="ex-hint">Petunjuk <small>(opsional)</small></label>
      <input id="ex-hint" type="text" value={f.hint} onChange={set('hint')} maxLength={600} />

      <div className="two-col">
        <div>
          <label htmlFor="ex-slug">Slug <small>(kosongkan agar dibuat dari judul)</small></label>
          <input id="ex-slug" type="text" value={f.slug} onChange={set('slug')} />
        </div>
        <label className="check pad"><input type="checkbox" checked={f.required} onChange={set('required')} /> Wajib untuk menyelesaikan pelajaran</label>
      </div>

      {verdict && (
        <div className={`flash ${verdict.ok ? 'ok' : 'err'}`} role="status">
          {verdict.message}
          {verdict.results && <TestResults results={verdict.results.results} total={verdict.results.total} />}
        </div>
      )}
      {error && <p className="flash err" role="alert">{error}</p>}
      <div className="row">
        <button type="submit" disabled={busy}>{busy ? 'Sebentar…' : 'Simpan soal'}</button>
        {!isChoice && <button type="button" className="ghost" onClick={test} disabled={busy}>Uji solusi dan kode awal</button>}
        <button type="button" className="link" onClick={onCancel}>Batal</button>
        {!isChoice && <span className="muted">Python: {status === 'ready' ? 'siap' : status === 'loading' ? 'memuat…' : 'dimuat saat diuji'}</span>}
      </div>
    </form>
  );
}
