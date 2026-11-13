import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { useDocumentTitle } from '../hooks.js';
import { useT } from '../lang.jsx';

export default function Verify() {
  const t = useT();
  useDocumentTitle(t('Verifikasi email · Lab'));
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const [state, setState] = useState({ status: 'working', message: '' });

  useEffect(() => {
    let alive = true;
    const token = params.get('token') || '';
    api(`/api/verify?token=${encodeURIComponent(token)}`)
      .then(() => {
        if (!alive) return;
        setState({ status: 'ok', message: '' });
        refresh().catch(() => {});
      })
      .catch((err) => alive && setState({ status: 'error', message: err.message }));
    return () => {
      alive = false;
    };
  }, [params, refresh]);

  return (
    <Layout>
      <section className="card empty">
        {state.status === 'working' && <p>{t('Memeriksa tautan…')}</p>}
        {state.status === 'ok' && (
          <>
            <h1>{t('Emailmu terverifikasi')}</h1>
            <p><Link className="btn" to="/belajar">{t('Lanjut belajar')}</Link></p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <h1>{t('Verifikasi gagal')}</h1>
            <p role="alert">{state.message}</p>
            <p><Link className="btn" to="/belajar">{t('Ke Belajar Saya')}</Link></p>
          </>
        )}
      </section>
    </Layout>
  );
}
