export const rupiah = (n, lang = 'id') => `Rp${Number(n).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}`;

export const LANGUAGE_LABEL = { python: 'Python', javascript: 'JavaScript', sql: 'SQL', java: 'Java' };

export function priceLabel(course, t = (x) => x, lang = 'id') {
  return course.price_idr > 0 ? rupiah(course.price_idr, lang) : t('Gratis');
}

export const LOCALE_LABEL = { id: 'Bahasa Indonesia', en: 'English' };
