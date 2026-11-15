import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { useApi, useDocumentTitle } from '../hooks.js';
import { Lamp } from '../components/Lamps.jsx';
import { dateLocale } from '../i18n.js';
import { useLang, useT } from '../lang.jsx';
import { LANGUAGE_LABEL } from '../utils.js';

// Days in a row with practice, and the last seven days as lanterns.
function Streak({ streak }) {
  const { t, lang } = useLang();
  const dayName = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(dateLocale(lang), { weekday: 'short' });
  return (
    <section className="card streak" aria-label={t('Runtun belajar')}>
      <span className="tab">{t('Runtun belajar')}</span>
      <p className="streak-count">
        <b>{t('{n} hari berturut-turut', { n: streak.current })}</b>
        <span className="muted"> · {t('terpanjang {n} hari', { n: streak.best })}</span>
      </p>
      <ol className="streak-week">
        {streak.week.map((d) => (
          <li key={d.date}>
            <Lamp on={d.active} />
            <span aria-hidden="true">{dayName(d.date)}</span>
            <span className="sr">{dayName(d.date)}: {d.active ? t('belajar') : t('tidak belajar')}</span>
          </li>
        ))}
      </ol>
      <p className="muted">
        {streak.today
          ? t('Hari ini sudah belajar. Sampai besok.')
          : streak.current > 0
            ? t('Kerjakan satu latihan hari ini supaya runtunmu tidak putus.')
            : t('Kerjakan satu latihan hari ini untuk memulai runtun baru.')}
      </p>
    </section>
  );
}

export default function MyCourses() {
  const t = useT();
  useDocumentTitle(t('Belajar saya · Lab'));
  const { ready, user, verification } = useAuth();
  const { data, loading } = useApi(ready && user ? '/api/me/courses' : null);
  const certs = useApi(ready && user ? '/api/me/certificates' : null);
  const [mail, setMail] = useState('');

  if (!ready) return <Layout><p className="note">{t('Memuat…')}</p></Layout>;
  if (!user) return <Navigate to="/masuk?next=/belajar" replace />;

  async function resend() {
    setMail('');
    try {
      const r = await api('/api/verify/resend', { method: 'POST' });
      setMail(r.sent === false ? t('Email belum bisa dikirim dari server ini. Hubungi admin.') : t('Email verifikasi dikirim. Cek kotak masukmu.'));
    } catch (err) {
      setMail(err.message);
    }
  }

  return (
    <Layout>
      <section className="lab-hero small">
        <h1>{t('Halo, {name}', { name: user.name })}</h1>
        <p>{t('Ini kursus yang sedang kamu ikuti.')}</p>
      </section>
      {verification && !user.verified && (
        <p className="flash err" role="status">
          {t('Emailmu belum diverifikasi, dan sertifikat nanti butuh itu.')}{' '}
          <button type="button" className="link" onClick={resend}>{t('Kirim ulang email verifikasi')}</button>
          {mail && <span> {mail}</span>}
        </p>
      )}
      {loading && <p className="note">{t('Memuat…')}</p>}
      {data && data.streak && (data.streak.current > 0 || data.streak.best > 0) && <Streak streak={data.streak} />}
      {data && data.courses.length === 0 && (
        <section className="card empty">
          <p>{t('Kamu belum memulai kursus apa pun.')}</p>
          <p><Link className="btn" to="/">{t('Pilih kursus')}</Link></p>
        </section>
      )}
      {data && data.courses.map((c) => (
        <article className="card course-card" key={c.slug}>
          <span className="tab">{LANGUAGE_LABEL[c.language] || c.language}</span>
          <h2><Link to={`/kursus/${c.slug}`}>{c.title}</Link></h2>
          <p className="meta">{t('{done} dari {total} pelajaran selesai ({percent}%)', { done: c.progress.done, total: c.progress.total, percent: c.progress.percent })}</p>
          <div className="row">
            {c.progress.next ? (
              <Link className="btn" to={`/kursus/${c.slug}/${c.progress.next}`}>{t('Lanjutkan')}</Link>
            ) : (
              <Link className="btn ghost" to={`/kursus/${c.slug}`}>{t('Kursus selesai, lihat lagi')}</Link>
            )}
          </div>
        </article>
      ))}
      {certs.data && certs.data.certificates.length > 0 && (
        <section className="my-certs" aria-labelledby="my-certs-title">
          <h2 id="my-certs-title">{t('Sertifikatku')}</h2>
          {certs.data.certificates.map((c) => (
            <article className="card course-card" key={c.id}>
              <span className="tab">{t('Sertifikat')}</span>
              <h3>{c.course.title}</h3>
              <p className="meta">{c.revoked ? t('Dicabut') : t('Nomor {id}', { id: c.id })}</p>
              {!c.revoked && (
                <div className="row">
                  <a className="btn" href={c.pdf_url} target="_blank" rel="noopener noreferrer">{t('Unduh PDF')}</a>
                  <Link className="btn ghost" to={`/verifikasi/${c.id}`}>{t('Halaman verifikasi')}</Link>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </Layout>
  );
}
