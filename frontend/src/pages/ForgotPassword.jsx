import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../api.js';
import { useDocumentTitle } from '../hooks.js';
import { useT } from '../lang.jsx';

// Asks for the email and sends a reset link. The answer is the same whether or not the email has
// an account, so this page cannot be used to find out who is registered.
export default function ForgotPassword() {
  const t = useT();
  useDocumentTitle(t('Lupa password · Lab'));
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/password/forgot', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="card panel narrow">
        <span className="tab">{t('Lupa password')}</span>
        <h1>{t('Atur ulang password')}</h1>
        {sent ? (
          <>
            <p className="flash ok" role="status">
              {t('Kalau email itu terdaftar, tautan untuk membuat password baru sudah dikirim. Tautannya berlaku 1 jam. Cek juga folder spam.')}
            </p>
            <p><Link className="btn ghost" to="/masuk">{t('Kembali ke halaman masuk')}</Link></p>
          </>
        ) : (
          <>
            <p className="muted">{t('Tulis email akunmu. Kami kirim tautan untuk membuat password baru.')}</p>
            <form onSubmit={submit}>
              <label htmlFor="email">Email</label>
              <input id="email" type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <p className="flash err" role="alert">{error}</p>}
              <div className="row">
                <button type="submit" disabled={busy}>{busy ? t('Sebentar…') : t('Kirim tautan')}</button>
                <Link className="link" to="/masuk">{t('Kembali ke halaman masuk')}</Link>
              </div>
            </form>
          </>
        )}
      </section>
    </Layout>
  );
}
