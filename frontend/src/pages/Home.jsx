import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { useLang } from '../lang.jsx';
import { LANGUAGE_LABEL, LOCALE_LABEL, priceLabel } from '../utils.js';

function CourseCard({ c, showLocale }) {
  const { t, lang } = useLang();
  const p = c.progress;
  const started = p && p.done > 0;
  return (
    <article className="card course-card">
      <span className="tab">{LANGUAGE_LABEL[c.language] || c.language}</span>
      <h2><Link to={`/kursus/${c.slug}`}>{c.title}</Link></h2>
      <p className="meta">
        {c.level} · {t('{n} pelajaran', { n: c.lesson_count })} · {t('{n} latihan', { n: c.exercise_count })} ·{' '}
        <b className={c.price_idr ? 'paid' : 'free'}>{priceLabel(c, t, lang)}</b>
        {showLocale && <> · <span className="locale-chip">{LOCALE_LABEL[c.locale]}</span></>}
      </p>
      <p>{c.summary}</p>
      <div className="row">
        <Link className="btn" to={`/kursus/${c.slug}`}>{started ? t('Lanjutkan') : t('Lihat kursus')}</Link>
        {p && <span className="muted">{t('{done} dari {total} pelajaran selesai', { done: p.done, total: p.total })}</span>}
      </div>
    </article>
  );
}

function Plans() {
  const { lang, t } = useLang();
  const { data } = useApi('/api/plans');
  if (!data || data.plans.length === 0) return null;
  return (
    <section className="plans" aria-labelledby="plans-title">
      <h2 id="plans-title">{t('Gratis dan berbayar')}</h2>
      <div className="plan-grid">
        {data.plans.map((p) => (
          <article key={p.id} className={`card plan${p.highlight ? ' hot' : ''}`}>
            <span className="tab">{p.name}</span>
            <p className="plan-price">{p.price}</p>
            <p className="muted">{p.tagline}</p>
            <ul className="perks">
              {p.perks.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { lang, t } = useLang();
  useDocumentTitle(t('Lab · belajar coding lewat kasus kerja nyata · tolie.space'));
  const { user, ready } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const filter = showAll ? 'all' : lang;
  const { data, error, loading } = useApi(ready ? `/api/courses?lang=${filter}` : null, user ? user.id : 0);
  // The catalog can be narrowed to one programming language once there are several.
  const [tech, setTech] = useState('');
  const techs = data ? [...new Set(data.courses.map((c) => c.language))] : [];
  const shown = data ? data.courses.filter((c) => !tech || !techs.includes(tech) || c.language === tech) : [];

  return (
    <Layout>
      <section className="lab-hero">
        <h1>{t('Belajar coding dengan pekerjaan yang benar-benar ada')}</h1>
        <p>
          {t('Setiap kursus berangkat dari kasus kantor atau usaha: menghitung struk, memberi diskon, merapikan data pelanggan. Kodenya kamu tulis dan jalankan langsung di browser, tanpa memasang apa pun.')}
        </p>
      </section>
      {loading && <p className="note">{t('Memuat kursus…')}</p>}
      {error && <p className="flash err" role="alert">{error.message}</p>}
      {data && data.courses.length === 0 && <section className="card empty"><p>{t('Belum ada kursus yang terbit.')}</p></section>}
      {techs.length > 1 && (
        <div className="tech-filter" role="group" aria-label={t('Saring menurut bahasa pemrograman')}>
          <button type="button" aria-pressed={!tech || !techs.includes(tech)} onClick={() => setTech('')}>{t('Semua')}</button>
          {techs.map((x) => (
            <button type="button" key={x} aria-pressed={tech === x} onClick={() => setTech(x)}>{LANGUAGE_LABEL[x] || x}</button>
          ))}
        </div>
      )}
      {shown.map((c) => <CourseCard key={c.slug} c={c} showLocale={showAll} />)}
      <p className="lang-filter">
        <button type="button" className="link" onClick={() => setShowAll((v) => !v)} aria-pressed={showAll}>
          {showAll ? t('Tampilkan hanya kursus dalam bahasa pilihanmu') : t('Tampilkan juga kursus dalam bahasa lain')}
        </button>
      </p>
      <Plans />
      <section className="how">
        <h2>{t('Cara belajarnya')}</h2>
        <ul>
          <li><b>{t('Baca sedikit, langsung praktik.')}</b> {t('Tiap pelajaran pendek, diikuti latihan kode dan soal pilihan ganda.')}</li>
          <li><b>{t('Tes otomatis.')}</b> {t('Program kamu dijalankan terhadap beberapa kasus, dan kamu tahu persis tes mana yang belum lulus.')}</li>
          <li><b>{t('Kemajuan tersimpan.')}</b> {t('Masuk dengan email, dan lentera di setiap pelajaran menyala saat kamu menyelesaikannya.')}</li>
        </ul>
      </section>
    </Layout>
  );
}
