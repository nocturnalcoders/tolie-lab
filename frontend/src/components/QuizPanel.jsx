import { useState } from 'react';
import { Link } from 'react-router-dom';
import Prose from './Prose.jsx';
import { api } from '../api.js';
import { useT } from '../lang.jsx';

// A multiple-choice question. The answer is checked on the server, which only reveals the
// correct option(s) once the question is answered right (or after three misses).
export default function QuizPanel({ exercise, signedIn, returnTo, onPassed, onNext, hasNext }) {
  const t = useT();
  const q = exercise.choice;
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const done = result && result.correct;
  const revealed = result && result.correct_options;

  function toggle(i) {
    setResult((r) => (r && r.correct ? r : null));
    setPicked((p) => (q.multiple ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const out = await api(`/api/exercises/${exercise.id}/answer`, { method: 'POST', body: { choice: picked } });
      setResult(out);
      if (out.correct) onPassed(exercise.id, out);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const state = (i) => {
    if (!revealed) return picked.includes(i) ? 'picked' : '';
    const right = result.correct_options.includes(i);
    if (right) return 'right';
    return picked.includes(i) ? 'wrong' : '';
  };

  return (
    <form className="quiz" onSubmit={submit}>
      <fieldset disabled={busy || done}>
        <legend className="sr">{q.multiple ? t('Pilih semua jawaban yang benar') : t('Pilih satu jawaban')}</legend>
        <p className="muted quiz-kind">{q.multiple ? t('Pilih semua jawaban yang benar.') : t('Pilih satu jawaban.')}</p>
        <ul className="opts">
          {q.options_html.map((html, i) => (
            <li key={i}>
              <label className={`opt ${state(i)}`}>
                <input
                  type={q.multiple ? 'checkbox' : 'radio'}
                  name={`q-${exercise.id}`}
                  checked={picked.includes(i)}
                  onChange={() => toggle(i)}
                />
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {!signedIn ? (
        <p className="flash err">
          {t('Jawaban diperiksa di server, jadi kamu perlu')} <Link to={`/masuk?next=${encodeURIComponent(returnTo)}`}>{t('masuk')}</Link> {t('dulu.')}
        </p>
      ) : (
        <div className="row">
          {!done && <button type="submit" disabled={busy || picked.length === 0}>{busy ? t('Memeriksa…') : t('Periksa jawaban')}</button>}
          {done && hasNext && <button type="button" onClick={onNext}>{t('Latihan berikutnya')}</button>}
        </div>
      )}
      {error && <p className="flash err" role="alert">{error}</p>}
      <div aria-live="polite">
        {result && result.correct && <p className="flash ok">{t('Benar.')}</p>}
        {result && !result.correct && (
          <p className="flash err">
            {t('Belum tepat.')}{result.hint ? ` ${result.hint}` : ''}
            {revealed ? ` ${t('Jawaban yang benar sudah ditandai.')}` : ''}
          </p>
        )}
        {result && result.explanation_html && (
          <div className="explain">
            <Prose html={result.explanation_html} />
          </div>
        )}
      </div>
    </form>
  );
}
