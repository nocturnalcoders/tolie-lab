import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useT } from '../lang.jsx';

// The certificate card on a course page: locked until every lantern is lit, then a claim form,
// then the downloadable certificate with its public verification link.
export default function CertificatePanel({ courseSlug, progress, reloadKey = 0 }) {
  const t = useT();
  const [st, setSt] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    api(`/api/courses/${courseSlug}/certificate`)
      .then((s) => {
        if (!alive) return;
        setSt(s);
        setName((n) => n || s.default_name);
      })
      .catch(() => alive && setSt(null));
    return () => {
      alive = false;
    };
  }, [courseSlug, reloadKey, progress && progress.done]);

  if (!st || !st.enabled) return null;
  const cert = st.certificate;

  async function claim(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const out = await api(`/api/courses/${courseSlug}/certificate`, { method: 'POST', body: { name } });
      setSt({ ...st, certificate: out.certificate });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(cert.verify_url);
      setCopied(true);
    } catch {
      setError(t('Salin manual dari halaman verifikasi.'));
    }
  }

  if (cert) {
    return (
      <section className="card cert-card" aria-labelledby="cert-title">
        <span className="tab">{t('Sertifikat')}</span>
        <h2 id="cert-title">{cert.revoked ? t('Sertifikat ini sudah dicabut') : t('Sertifikatmu sudah terbit')}</h2>
        <p>
          {t('Atas nama')} <b>{cert.name}</b>, {t('nomor')} <code>{cert.id}</code>.
        </p>
        {!cert.revoked && (
          <div className="row">
            <a className="btn" href={cert.pdf_url} target="_blank" rel="noopener noreferrer">{t('Unduh PDF')}</a>
            <Link className="btn ghost" to={`/verifikasi/${cert.id}`}>{t('Halaman verifikasi')}</Link>
            <button type="button" className="link" onClick={copy}>{copied ? t('Tautan tersalin') : t('Salin tautan verifikasi')}</button>
          </div>
        )}
        {error && <p className="flash err" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section className="card cert-card" aria-labelledby="cert-title">
      <span className="tab">{t('Sertifikat')}</span>
      <h2 id="cert-title">{t('Sertifikat penyelesaian')}</h2>
      {!st.eligible ? (
        <p>
          {t('Selesaikan semua pelajaran untuk mendapat sertifikat dari tolie.space dengan tanda tangan Christianto Lie.')}
          {progress ? ` ${t('Kamu sudah {done} dari {total}.', { done: progress.done, total: progress.total })}` : ''}
        </p>
      ) : st.needs_verification ? (
        <p className="flash err">{t('Semua pelajaran selesai. Verifikasi emailmu dulu supaya sertifikat bisa diterbitkan.')}</p>
      ) : (
        <form onSubmit={claim}>
          <p>{t('Semua lentera menyala. Tulis namamu persis seperti yang ingin tercetak. Setelah terbit, nama tidak bisa diubah.')}</p>
          <label htmlFor="cert-name">{t('Nama di sertifikat')}</label>
          <input id="cert-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          {error && <p className="flash err" role="alert">{error}</p>}
          <div className="row">
            <button type="submit" disabled={busy}>{busy ? t('Menerbitkan…') : t('Terbitkan sertifikat')}</button>
          </div>
        </form>
      )}
    </section>
  );
}
