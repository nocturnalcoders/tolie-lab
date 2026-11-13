import { getLang, langHeaders, translate } from './i18n.js';

// Tiny fetch wrapper. The CSRF token comes from /api/session and rides along on every write.
let csrf = '';

export function setCsrf(token) {
  csrf = token || '';
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { ...langHeaders() };
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf;

  const res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || translate(getLang(), 'Terjadi kesalahan ({status}).', { status: res.status }));
    err.status = res.status;
    throw err;
  }
  return data;
}
