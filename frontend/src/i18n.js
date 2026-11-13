// Two languages: Indonesian (id) and English (en).
// The text in the code is the Indonesian text. For English it is looked up in locales/en.js,
// and a test makes sure every text used in the code has an English entry.
import EN from './locales/en.js';

export const LANGS = ['id', 'en'];
let current = 'id';

export const getLang = () => current;
export const setCurrentLang = (lang) => {
  current = LANGS.includes(lang) ? lang : 'id';
};

export function format(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}

export function translate(lang, text, vars) {
  const base = lang === 'en' ? EN[text] ?? text : text;
  return typeof base === 'function' ? base(vars || {}) : format(base, vars);
}

// The saved choice wins; otherwise the browser language (Indonesian browsers get Indonesian,
// everyone else gets English).
export function detectLang() {
  try {
    const saved = localStorage.getItem('lab-lang');
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* private mode */
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'id').toLowerCase();
  return nav.startsWith('id') ? 'id' : 'en';
}

// Sent with every API request so the server answers in the same language.
export const langHeaders = () => ({ 'X-Lang': current });

export const dateLocale = (lang) => (lang === 'en' ? 'en-GB' : 'id-ID');
