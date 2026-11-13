import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { dateLocale } from '../i18n.js';
import { useLang } from '../lang.jsx';
import { LANGUAGE_LABEL } from '../utils.js';

const fmtDate = (iso, lang) => new Date(iso).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// /verifikasi: type a certificate number. /verifikasi/<number>: the public result page.
export function CertificateLookup() {
  const { t } = useLang();
  useDocumentTitle(t('Periksa sertifikat · Lab'));
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  return (
    <Layout>
      <section className="card panel narrow">
        <span className="tab">{t('Verifikasi')}</span>
        <h1>{t('Periksa sertifikat')}</h1>
        <p className="muted">{t('Masukkan nomor di sertifikat, atau pindai kode QR-nya.')}</p>
        <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) navigate(`/verifikasi/${encodeURIComponent(value.trim())}`); }}>
          <label htmlFor="cert-id">{t('Nomor sertifikat')}</label>
          <input id="cert-id" type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="LAB-XXXX-XXXX-XXXX" autoComplete="off" required />
          <div className="row"><button type="submit">{t('Periksa')}</button></div>
        </form>
      </section>
    </Layout>
  );
}

export default function CertificatePage() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const { data, error, loading } = useApi(`/api/certificates/${encodeURIComponent(id)}`);
  useDocumentTitle(data ? t('Sertifikat {name} · Lab', { name: data.certificate.name }) : t('Periksa sertifikat · Lab'));
  if (loading) return <Layout><p className="note">{t('Memeriksa sertifikat…')}</p></Layout>;
  if (error) {
    return (
      <Layout>
        <section className="card empty verify bad" role="alert">
          <h1>{error.status === 404 ? t('Nomor ini tidak ditemukan') : t('Pemeriksaan gagal')}</h1>
          <p>{error.status === 404 ? t('Periksa lagi nomornya. Sertifikat asli selalu berawalan LAB-.') : error.message}</p>
          <p><Link className="btn ghost" to="/verifikasi">{t('Coba nomor lain')}</Link></p>
        </section>
      </Layout>
    );
  }
  const c = data.certificate;
  return (
    <Layout>
      <section className={`card verify ${c.revoked ? 'bad' : 'good'}`}>
        <span className="tab">{c.revoked ? t('Dicabut') : t('Sah')}</span>
        <h1>{c.revoked ? t('Sertifikat ini sudah dicabut') : t('Sertifikat ini asli')}</h1>
        <dl className="facts">
          <dt>{t('Atas nama')}</dt><dd className="holder">{c.name}</dd>
          <dt>{t('Telah menyelesaikan')}</dt><dd>{c.course.title}</dd>
          <dt>{t('Isi kursus')}</dt><dd>{t('{lessons} pelajaran, {exercises} latihan', { lessons: c.lessons, exercises: c.exercises })}, {LANGUAGE_LABEL[c.course.language] || c.course.language}, {c.course.level}</dd>
          <dt>{t('Diterbitkan')}</dt><dd>{t('{date} oleh tolie.space Lab', { date: fmtDate(c.issued_at, lang) })}</dd>
          <dt>{t('Nomor')}</dt><dd><code>{c.id}</code></dd>
        </dl>
        {!c.revoked && <p><a className="btn" href={c.pdf_url} target="_blank" rel="noopener noreferrer">{t('Lihat PDF sertifikat')}</a></p>}
        <p className="muted small-print">
          {t('Sertifikat ini menyatakan bahwa pemegangnya menyelesaikan kursus di tolie.space Lab. Ini bukan akreditasi resmi dan bukan ukuran kemampuan seseorang.')}
        </p>
      </section>
    </Layout>
  );
}
