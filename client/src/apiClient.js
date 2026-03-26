/**
 * apiClient.js — shared authenticated API helper
 * Import this instead of defining a local `api` object in each component.
 *
 * Automatically attaches:
 *   X-User-Id     — from talentos_session in localStorage
 *   X-Tenant-Slug — from session or URL subdomain
 *   Content-Type  — application/json (for mutations)
 */

function getSession() {
  try { return JSON.parse(localStorage.getItem('talentos_session') || 'null'); } catch { return null; }
}

function getTenantSlug() {
  // 1. Subdomain detection (production: acme.vercentic.com → slug = 'acme')
  const host = window.location.hostname;
  const parts = host.split('.');
  const INFRA = new Set(['www','app','api','admin','portal','localhost','mail','cdn','static','assets']);
  // Must be subdomain.vercentic.com (3+ parts) and not an infra subdomain
  if (parts.length >= 3 &&
      !INFRA.has(parts[0]) &&
      !['vercel','railway','up','netlify','herokuapp'].some(r => host.includes(r))) {
    return parts[0];
  }
  // 2. Session slug (set after login — covers ?tenant= logins and same-domain sessions)
  const sess = getSession();
  if (sess?.tenant_slug && sess.tenant_slug !== 'master') return sess.tenant_slug;
  // 3. ?tenant= query param (super admin testing / fallback)
  const params = new URLSearchParams(window.location.search);
  if (params.get('tenant')) return params.get('tenant');
  return null;
}

function authHeaders(extra = {}) {
  const sess   = getSession();
  const slug   = getTenantSlug();
  const userId = sess?.user?.id || null;
  const h = { ...extra };
  if (slug)   h['X-Tenant-Slug'] = slug;
  if (userId) h['X-User-Id']     = userId;
  return h;
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

const api = {
  get:    (path)       => fetch(`/api${path}`, { headers: authHeaders() }).then(r => r.json()),
  post:   (path, body) => fetch(`/api${path}`, { method: 'POST',   headers: jsonHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body) => fetch(`/api${path}`, { method: 'PATCH',  headers: jsonHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  put:    (path, body) => fetch(`/api${path}`, { method: 'PUT',    headers: jsonHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  del:    (path)       => fetch(`/api${path}`, { method: 'DELETE', headers: authHeaders() }).then(r => r.json()),
  delete: (path)       => fetch(`/api${path}`, { method: 'DELETE', headers: authHeaders() }).then(r => r.json()),
};

export default api;
export { authHeaders, jsonHeaders, getTenantSlug, getSession };

// Bare fetch wrapper — use instead of raw fetch() so tenant + user headers are always sent.
export function tFetch(url, opts = {}) {
  const h = { ...authHeaders(), ...(opts.headers || {}) };
  return fetch(url, { ...opts, headers: h });
}
