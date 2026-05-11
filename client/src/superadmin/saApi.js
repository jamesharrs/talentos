/**
 * saApi.js — shared fetch helper for SuperAdmin console components.
 * Adds credentials + CSRF token to every request automatically.
 * Uses relative URLs so it works locally and in production via Vercel proxy.
 */

function getCsrf() {
  const m = document.cookie.match(/vercentic_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function saHeaders(mutating = false) {
  const h = { 'Content-Type': 'application/json' };
  if (mutating) {
    const csrf = getCsrf();
    if (csrf) h['X-CSRF-Token'] = csrf;
  }
  return h;
}

export function saFetch(path, options = {}) {
  // Always use relative URLs — Vercel proxy forwards to Railway
  const url = path.startsWith('/') ? path : `/api/superadmin/${path}`;
  const mutating = options.method && options.method !== 'GET';
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: { ...saHeaders(mutating), ...(options.headers || {}) },
  });
}

const saApi = {
  get:    (path)         => saFetch(path).then(r => r.json()),
  post:   (path, body)   => saFetch(path, { method: 'POST',   body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body)   => saFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }).then(r => r.json()),
  del:    (path)         => saFetch(path, { method: 'DELETE' }).then(r => r.json()),
};

export default saApi;
