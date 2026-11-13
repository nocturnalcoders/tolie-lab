import { Link, Navigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../auth.jsx';

export default function AdminGuard({ children }) {
  const { ready, user } = useAuth();
  const location = useLocation();
  if (!ready) return <Layout><p className="note">Memuat…</p></Layout>;
  if (!user) return <Navigate to={`/masuk?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'admin') {
    return (
      <Layout>
        <section className="card empty">
          <h1>Hanya untuk admin</h1>
          <p>Akunmu belum punya akses admin.</p>
          <p><Link className="btn ghost" to="/">Kembali</Link></p>
        </section>
      </Layout>
    );
  }
  return children;
}
