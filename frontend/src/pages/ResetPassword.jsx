import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { useDocumentTitle } from '../hooks.js';
import { useT } from '../lang.jsx';

// Opened from the link in the reset email: choose a new password, then you are signed in.
export default function ResetPassword() {
  const t = useT();
  useDocumentTitle(t('Password baru · Lab'));
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { adopt } = useAuth();
  const [form, setForm] = useState({ password: '', again: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.again) {
      setError(t('Kedua password tidak sama.'));
      return;
    }
    setBusy(true);
    try {
      adopt(await api('/api/password/reset', { method: 'POST', body: { token: params.get('token') || '', password: form.password } }));
      navigate('/belajar', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="card panel narrow">
        <span className="tab">{t('Password baru')}</span>
        <h1>{t('Buat password baru')}</h1>
        <p className="muted">{t('Setelah disimpan, perangkat lain yang masih masuk dengan password lama akan keluar.')}</p>
        <form onSubmit={submit}>
          <label htmlFor="password">{t('Password baru')} <small>{t('(minimal 10 karakter)')}</small></label>
          <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
          <label htmlFor="again">{t('Ulangi password baru')}</label>
          <input id="again" type="password" autoComplete="new-password" value={form.again} onChange={set('again')} required />
          {error && <p className="flash err" role="alert">{error}</p>}
          <div className="row">
            <button type="submit" disabled={busy}>{busy ? t('Sebentar…') : t('Simpan password')}</button>
            <Link className="link" to="/lupa-password">{t('Minta tautan baru')}</Link>
          </div>
        </form>
      </section>
    </Layout>
  );
}
