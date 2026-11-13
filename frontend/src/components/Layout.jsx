import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../hooks.js';
import { useLang } from '../lang.jsx';

const GAME_URL = 'https://tolie.space';
const NOTES_URL = 'https://blog.tolie.space';
const GITHUB_URL = 'https://github.com/nocturnalcoders';
const LINKEDIN_URL = 'https://www.linkedin.com/in/christianto-lie';

export default function Layout({ children, wide = false }) {
  const [theme, toggle] = useTheme();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();

  return (
    <>
      <a className="skip" href="#main">{t('Lompat ke isi')}</a>
      <header className="site-head">
        <Link className="brand" to="/">tolie.space<small>/ lab</small></Link>
        <nav className="lanterns" aria-label={t('Menu utama')}>
          <Link className="lantern" to="/"><i className="body"><em>&gt;_</em></i><span>{t('Belajar')}</span></Link>
          <a className="lantern l-teal" href={GAME_URL}><i className="body"><em>#</em></i><span>{t('Game')}</span></a>
          <a className="lantern l-coral" href={NOTES_URL}><i className="body"><em>~</em></i><span>{t('Catatan')}</span></a>
        </nav>
        <div className="head-tools">
          {user ? (
            <>
              {user.role === 'admin' && <Link className="who" to="/admin">Admin</Link>}
              <Link className="who" to="/belajar" title={t('Belajar saya')}>{user.name}</Link>
              <button className="link-quiet" type="button" onClick={() => logout()}>{t('Keluar')}</button>
            </>
          ) : (
            <Link className="btn small" to="/masuk">{t('Masuk')}</Link>
          )}
          <div className="lang-switch" role="group" aria-label={t('Bahasa tampilan')}>
            <button type="button" aria-pressed={lang === 'id'} onClick={() => setLang('id')} lang="id" title="Bahasa Indonesia">ID</button>
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en" title="English">EN</button>
          </div>
          <button
            className="theme-btn"
            type="button"
            onClick={toggle}
            aria-pressed={theme === 'day'}
            aria-label={t('Ganti antara malam dan siang')}
          >
            <span className="dot" aria-hidden="true" />
            <span className="lbl">{theme === 'day' ? t('Siang') : t('Malam')}</span>
          </button>
        </div>
      </header>
      <main id="main" className={`wrap${wide ? ' wide' : ''}`}>{children}</main>
      <footer className="site-foot">
        <p>{t('Dibuat selepas gelap.')} © 2026 Christianto Lie.</p>
        <p className="links">
          <a href={GAME_URL}>{t('Game')}</a>
          <a href={NOTES_URL}>{t('Catatan')}</a>
          <a href={GITHUB_URL} rel="noopener noreferrer">GitHub</a>
          <a href={LINKEDIN_URL} rel="noopener noreferrer">LinkedIn</a>
        </p>
      </footer>
    </>
  );
}
