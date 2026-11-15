import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Lamps from '../components/Lamps.jsx';
import Prose from '../components/Prose.jsx';
import CodeWorkbench from '../components/CodeWorkbench.jsx';
import QuizPanel from '../components/QuizPanel.jsx';
import { useAuth } from '../auth.jsx';
import { useLang } from '../lang.jsx';
import { api } from '../api.js';
import { useApi, useDocumentTitle, useTheme } from '../hooks.js';
import { useRunner } from '../runner/useRunner.js';
import NotFound from './NotFound.jsx';

function LessonView({ data, courseSlug }) {
  const { user } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const [theme] = useTheme();
  const { course, lesson, exercises, prev, next } = data;
  const [runner, status] = useRunner(course.language);

  const [active, setActive] = useState(() => {
    const firstOpen = exercises.findIndex((e) => !e.passed);
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [passed, setPassed] = useState(() => new Set(exercises.filter((e) => e.passed).map((e) => e.id)));
  const [done, setDone] = useState(lesson.done);
  const [courseDone, setCourseDone] = useState(false);
  const [markError, setMarkError] = useState('');

  const trail = useMemo(() => data.trail.map((t) => (t.slug === lesson.slug ? { ...t, done } : t)), [data.trail, lesson.slug, done]);
  const ex = exercises[active];
  const nextLink = next ? `/kursus/${courseSlug}/${next.slug}` : null;
  const signedIn = !!user;

  function handlePassed(exerciseId, info) {
    setPassed((s) => new Set(s).add(exerciseId));
    if (info && info.lesson_done) setDone(true);
    if (info && info.course_done) setCourseDone(true);
    if (!user) {
      const all = exercises.filter((e) => e.required).every((e) => e.id === exerciseId || passed.has(e.id));
      if (all) setDone(true);
    }
  }

  async function markRead() {
    setMarkError('');
    try {
      const out = await api(`/api/lessons/${lesson.id}/complete`, { method: 'POST' });
      setDone(out.lesson_done);
      setCourseDone(out.course_done);
    } catch (err) {
      setMarkError(err.message);
    }
  }

  return (
    <Layout wide>
      <section className="lesson-head">
        <p className="meta">
          <Link to={`/kursus/${courseSlug}`}>{course.title}</Link> · {t('pelajaran {n} dari {total}', { n: lesson.position, total: lesson.total })}
        </p>
        <h1>{lesson.title}</h1>
        <Lamps items={trail} courseSlug={courseSlug} currentSlug={lesson.slug} />
      </section>

      {!signedIn && (
        <p className="flash err" role="note">
          {t('Kamu belum masuk, jadi kemajuan tidak tersimpan.')} <Link to={`/masuk?next=${encodeURIComponent(location.pathname)}`}>{t('Masuk')}</Link> {t('atau')}{' '}
          <Link to={`/masuk?daftar=1&next=${encodeURIComponent(location.pathname)}`}>{t('daftar')}</Link> {t('gratis.')}
        </p>
      )}

      <div className="bench">
        <article className="card lesson-card">
          <span className="tab">{t('Materi')}</span>
          <Prose html={lesson.html} />
        </article>

        <aside className="work">
          {exercises.length === 0 ? (
            <section className="card prompt">
              <span className="tab">{t('Pelajaran')}</span>
              <p>{t('Pelajaran ini hanya materi. Tandai selesai kalau sudah kamu baca.')}</p>
              {!done && signedIn && <button type="button" onClick={markRead}>{t('Tandai selesai')}</button>}
              {!signedIn && <p className="muted">{t('Masuk untuk menandai selesai.')}</p>}
              {markError && <p className="flash err" role="alert">{markError}</p>}
            </section>
          ) : (
            <>
              <ol className="ex-tabs" aria-label={t('Latihan')}>
                {exercises.map((e, i) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className={`ex-tab${i === active ? ' on' : ''}${passed.has(e.id) ? ' ok' : ''}`}
                      aria-current={i === active ? 'step' : undefined}
                      onClick={() => setActive(i)}
                    >
                      <span className="n">{i + 1}</span>
                      {e.type === 'choice' ? t('Pilihan ganda') : t('Kode')}
                      {passed.has(e.id) && <span className="sr"> ({t('selesai')})</span>}
                    </button>
                  </li>
                ))}
              </ol>
              <section className="card prompt" key={`prompt-${ex.id}`}>
                <span className="tab">{t('Latihan {n}', { n: active + 1 })}</span>
                <h2>{ex.title}</h2>
                <Prose html={ex.prompt_html} />
                {passed.has(ex.id) && <p className="flash ok">{t('Sudah selesai.')}</p>}
              </section>
              {ex.type === 'code' ? (
                <CodeWorkbench
                  key={`work-${ex.id}`}
                  exercise={ex}
                  runner={runner}
                  status={status}
                  theme={theme}
                  signedIn={signedIn}
                  onPassed={handlePassed}
                />
              ) : (
                <QuizPanel
                  key={`work-${ex.id}`}
                  exercise={ex}
                  signedIn={signedIn}
                  returnTo={location.pathname}
                  onPassed={handlePassed}
                  hasNext={active + 1 < exercises.length}
                  onNext={() => setActive((a) => Math.min(a + 1, exercises.length - 1))}
                />
              )}
            </>
          )}
          {done && (
            <section className="card done-card" role="status">
              <span className="tab">{t('Selesai')}</span>
              <p><b>{courseDone ? t('Kursus selesai.') : t('Pelajaran selesai.')}</b> {t('Lentera pelajaran ini sudah menyala.')}</p>
              {nextLink ? (
                <Link className="btn" to={nextLink}>{t('Pelajaran berikutnya:')} {next.title}</Link>
              ) : (
                <Link className="btn" to={`/kursus/${courseSlug}`}>{t('Kembali ke daftar pelajaran')}</Link>
              )}
            </section>
          )}
        </aside>
      </div>

      <nav className="pager two" aria-label={t('Pelajaran')}>
        {prev ? <Link className="btn ghost" to={`/kursus/${courseSlug}/${prev.slug}`}>{t('Sebelumnya:')} {prev.title}</Link> : <span />}
        {nextLink && <Link className={`btn${done ? '' : ' ghost'}`} to={nextLink}>{t('Berikutnya:')} {next.title}</Link>}
      </nav>
    </Layout>
  );
}

export default function Lesson() {
  const { course, lesson } = useParams();
  const { user, ready } = useAuth();
  const { t } = useLang();
  const { data, error, loading } = useApi(ready ? `/api/courses/${course}/lessons/${lesson}` : null, user ? user.id : 0);
  useDocumentTitle(data ? `${data.lesson.title} · ${data.course.title}` : 'Lab');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lesson]);

  if (error && error.status === 404) return <NotFound />;
  if (loading && !data) return <Layout><p className="note">{t('Memuat pelajaran…')}</p></Layout>;
  if (error && error.status === 403) {
    return (
      <Layout>
        <section className="card empty">
          <h1>{t('Modul berbayar')}</h1>
          <p>{error.message}</p>
          <p><Link className="btn ghost" to={`/kursus/${course}`}>{t('Lihat daftar pelajaran')}</Link></p>
        </section>
      </Layout>
    );
  }
  if (error) return <Layout><p className="flash err" role="alert">{error.message}</p></Layout>;
  return <LessonView key={`${course}/${lesson}/${user ? user.id : 0}`} data={data} courseSlug={course} />;
}
