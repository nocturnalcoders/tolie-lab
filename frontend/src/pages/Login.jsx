import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { useDocumentTitle } from '../hooks.js';
import { useT } from '../lang.jsx';

export default function Login() {
  const t = useT();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(params.get('daftar') ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle(mode === 'login' ? t('Masuk · Lab') : t('Daftar · Lab'));

  const next = params.get('next');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/belajar';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="card panel narrow">
        <span className="tab">{mode === 'login' ? t('Masuk') : t('Daftar')}</span>
        <h1>{mode === 'login' ? t('Masuk ke Lab') : t('Buat akun Lab')}</h1>
        <p className="muted">
          {mode === 'login' ? t('Lanjutkan dari pelajaran terakhirmu.') : t('Gratis. Dengan akun, kemajuan belajarmu tersimpan.')}
        </p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label htmlFor="name">{t('Nama')}</label>
              <input id="name" type="text" autoComplete="name" value={form.name} onChange={set('name')} required maxLength={60} />
            </>
          )}
          <label htmlFor="email">Email</label>
          <input id="email" type="text" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          <label htmlFor="password">
            Password {mode === 'register' && <small>{t('(minimal 10 karakter)')}</small>}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={set('password')}
            required
          />
          {error && <p className="flash err" role="alert">{error}</p>}
          <div className="row">
            <button type="submit" disabled={busy}>{busy ? t('Sebentar…') : mode === 'login' ? t('Masuk') : t('Daftar')}</button>
            <button
              type="button"
              className="link"
              onClick={() => {
                setError('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
            >
              {mode === 'login' ? t('Belum punya akun? Daftar') : t('Sudah punya akun? Masuk')}
            </button>
          </div>
          {mode === 'login' && <p className="muted"><Link to="/lupa-password">{t('Lupa password?')}</Link></p>}
        </form>
      </section>
    </Layout>
  );
}
