import { useCallback, useEffect, useState } from 'react';
import { getLang, langHeaders, translate } from './i18n.js';

// GET a JSON endpoint. Change `path` (or bump `reloadKey`) to fetch again.
export function useApi(path, reloadKey = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!path) return undefined;
    const ctl = new AbortController();
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(path, { signal: ctl.signal, credentials: 'same-origin', headers: langHeaders() })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const err = new Error((json && json.error) || translate(getLang(), 'Terjadi kesalahan ({status}).', { status: res.status }));
          err.status = res.status;
          throw err;
        }
        return json;
      })
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => {
        if (alive && err.name !== 'AbortError') setState({ data: null, error: err, loading: false });
      });
    return () => {
      alive = false;
      ctl.abort();
    };
  }, [path, reloadKey]);

  return state;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}

// Night / daylight. The N key flips it, like in the game.
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'day' ? 'day' : 'night'
  );

  const toggle = useCallback(() => {
    const next = theme === 'day' ? 'night' : 'day';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('tolie-theme', next);
    } catch {
      /* private mode */
    }
    setTheme(next);
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target;
      const tag = el && el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return;
      if (e.key === 'n' || e.key === 'N') toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggle]);

  return [theme, toggle];
}
