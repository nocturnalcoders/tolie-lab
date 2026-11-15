import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import CertificatePanel from '../components/CertificatePanel.jsx';
import { Lamp } from '../components/Lamps.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { useApi, useDocumentTitle } from '../hooks.js';
import { useLang } from '../lang.jsx';
import { LANGUAGE_LABEL, priceLabel } from '../utils.js';
import NotFound from './NotFound.jsx';

// What a visitor without access sees on a paid module: the way to buy it.
function BuyBox({ course }) {
  const { user, payments } = useAuth();
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!payments) return <span className="flash err">{t('Modul berbayar. Pembelian akan dibuka segera.')}</span>;
  if (!user) {
    return (
      <>
        <Link className="btn" to={`/masuk?next=${encodeURIComponent(`/kursus/${course.slug}`)}`}>{t('Masuk untuk membeli')}</Link>
        <span className="muted">{t('Bayar sekali, akses selamanya.')}</span>
      </>
    );
  }

  async function buy() {
    setError('');
    setBusy(true);
    try {
      const out = await api(`/api/courses/${course.slug}/checkout`, { method: 'POST' });
      window.location.assign(out.url); // Stripe's payment page; it sends the learner back here
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={buy} disabled={busy}>
        {busy ? t('Membuka halaman pembayaran…') : t('Beli modul ini · {price}', { price: priceLabel(course, t, lang) })}
      </button>
      <span className="muted">{t('Bayar sekali, akses selamanya.')}</span>
      {error && <p className="flash err" role="alert">{error}</p>}
    </>
  );
}

const PAID_CHECKS = 10; // after paying, look for the access this many times (every 3 seconds)

export default function Course() {
  const { course: slug } = useParams();
  const [params] = useSearchParams();
  const { user, ready } = useAuth();
  const { t, lang } = useLang();
  const [checks, setChecks] = useState(0);
  const { data, error, loading } = useApi(ready ? `/api/courses/${slug}` : null, `${user ? user.id : 0}-${checks}`);
  useDocumentTitle(data ? `${data.course.title} · Lab` : 'Lab');

  // Back from the payment page: Stripe confirms to the server a moment later, so wait for it.
  const justPaid = params.get('paid') === '1' && !!user;
  const waiting = justPaid && !!data && !data.access;
  useEffect(() => {
    if (!waiting || loading || checks >= PAID_CHECKS) return undefined;
    const timer = setTimeout(() => setChecks((n) => n + 1), 3000);
    return () => clearTimeout(timer);
  }, [waiting, loading, checks]);

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
        {justPaid && access && <p className="flash ok" role="status">{t('Pembayaran diterima. Modul ini sudah terbuka untukmu.')}</p>}
        {waiting && (
          <p className="flash ok" role="status">
            {checks < PAID_CHECKS
              ? t('Terima kasih. Pembayaranmu sedang dikonfirmasi, biasanya kurang dari satu menit…')
              : t('Pembayaranmu belum terkonfirmasi. Muat ulang halaman ini beberapa menit lagi; kalau modul masih terkunci, hubungi admin.')}
          </p>
        )}
        <div className="row">
          {waiting ? null : !access ? (
            <BuyBox course={course} />
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
