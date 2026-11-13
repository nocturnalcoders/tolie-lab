import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectLang, setCurrentLang, translate } from './i18n.js';

const LangContext = createContext(null);

export function LangProvider({ children, initial }) {
  const [lang, setLangState] = useState(() => {
    const l = initial || detectLang();
    setCurrentLang(l); // set before the first render, so the first requests already carry it
    return l;
  });

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    setCurrentLang(next);
    try {
      localStorage.setItem('lab-lang', next);
    } catch {
      /* private mode */
    }
    setLangState(next);
  }, []);

  const t = useCallback((text, vars) => translate(lang, text, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => useContext(LangContext).t;
