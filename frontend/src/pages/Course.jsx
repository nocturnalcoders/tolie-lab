import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import CertificatePanel from '../components/CertificatePanel.jsx';
import { Lamp } from '../components/Lamps.jsx';
import { useAuth } from '../auth.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { useLang } from '../lang.jsx';
import { LANGUAGE_LABEL, priceLabel } from '../utils.js';
import NotFound from './NotFound.jsx';

export default function Course() {
  const { course: slug } = useParams();
  const { user, ready } = useAuth();
  const { t, lang } = useLang();
  const { data, error, loading } = useApi(ready ? `/api/courses/${slug}` : null, user ? user.id : 0);
  useDocumentTitle(data ? `${data.course.title} · Lab` : 'Lab');

  if (error && error.status === 404) return <NotFound />;
  if (loading && !data) return <Layout><p className="note">{t('Memuat kursus…')}</p></Layout>;
  if (error) return <Layout><p className="flash err" role="alert">{error.message}</p></Layout>;

  const { course, lessons, progress, access } = data;
  const next = progress && progress.next;
  const first = lessons[0];

  return (
    <Layout>
      <section className="course-head">
        <p className="meta">
          {LANGUAGE_LABEL[course.language] || course.language} · {course.level} · {priceLabel(course, t, lang)}
        </p>
        <h1>{course.title}</h1>
        <p className="lead">{course.summary}</p>
        <div className="row">
          {!access ? (
            <span className="flash err">{t('Modul berbayar. Pembelian akan dibuka segera.')}</span>
          ) : next ? (
            <Link className="btn" to={`/kursus/${course.slug}/${next}`}>
              {progress.done > 0 ? t('Lanjutkan belajar') : t('Mulai belajar')}
            </Link>
          ) : progress ? (
            <span className="flash ok">{t('Kursus selesai. Semua lentera menyala.')}</span>
          ) : (
            <Link className="btn" to={`/kursus/${course.slug}/${first.slug}`}>{t('Mulai belajar')}</Link>
          )}
          {!user && access && <span className="muted"><Link to="/masuk?daftar=1">{t('Daftar')}</Link> {t('agar kemajuanmu tersimpan.')}</span>}
        </div>
      </section>
      {course.perks && course.perks.length > 0 && (
        <section className="perks-box" aria-label={t('Yang kamu dapat')}>
          <h2>{t('Yang kamu dapat')}</h2>
          <ul className="perks">{course.perks.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      {user && access && course.certificate && <CertificatePanel courseSlug={course.slug} progress={progress} />}
      <ol className="path">
        {lessons.map((l, i) => (
          <li key={l.slug} className={l.done ? 'done' : ''}>
            <Lamp on={l.done} />
            <div className="card path-item">
              {l.locked ? (
                <h2><span className="lock">{t('Terkunci')}</span> {l.position}. {l.title}</h2>
              ) : (
                <h2><Link to={`/kursus/${course.slug}/${l.slug}`}>{l.position}. {l.title}</Link></h2>
              )}
              <p className="meta">
                {l.exercise_count > 0 ? t('{n} latihan', { n: l.exercise_count }) : t('Hanya materi')}
                {l.done ? ` · ${t('selesai')}` : ''}
                {i === 0 && !l.done && ` · ${t('mulai di sini')}`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Layout>
  );
}
