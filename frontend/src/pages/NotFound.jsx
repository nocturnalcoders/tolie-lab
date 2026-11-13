import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useDocumentTitle } from '../hooks.js';
import { useT } from '../lang.jsx';

export default function NotFound() {
  const t = useT();
  useDocumentTitle(t('Tidak ditemukan · Lab'));
  return (
    <Layout>
      <section className="card lost empty">
        <h1>{t('Halaman ini tidak ada')}</h1>
        <p>{t('Mungkin tautannya salah, atau kursusnya sudah dipindah.')}</p>
        <p><Link className="btn" to="/">{t('Kembali ke daftar kursus')}</Link></p>
      </section>
    </Layout>
  );
}
