/**
 * apiClient.js — shared authenticated API helper
 *
 * Automatically attaches:
 *   X-User-Id     — from talentos_session in localStorage
 *   X-Tenant-Slug — from session or URL subdomain
 *   Content-Type  — application/json (for mutations)
 *
 * All methods now THROW on non-2xx responses so callers can catch errors
 * rather than silently receiving { error: "..." } objects.
 * The thrown error always has:
 *   err.message  — human-readable error text
 *   err.status   — HTTP status code
 *   err.body     — full response body (may include err.body.errors[] for validation failures)
 *   err.detail   — short summary (Zod "detail" field or message)
 */

function getSession() {
  try { return JSON.parse(localStorage.getItem('talentos_session') || 'null'); } catch { return null; }
}

function getTenantSlug() {
  const host  = window.location.hostname;
  const parts = host.split('.');
  const INFRA = new Set(['www','app','api','admin','portal','localhost','mail','cdn','static','assets']);
  if (parts.length >= 3 &&
      !INFRA.has(parts[0]) &&
      !['vercel','railway','up','netlify','herokuapp'].some(r => host.includes(r))) {
    return parts[0];
  }
  const sess = getSession();
  if (sess?.tenant_slug && sess.tenant_slug !== 'master') return sess.tenant_slug;
  const params = new URLSearchParams(window.location.search);
  if (params.get('tenant')) return params.get('tenant');
  return null;
}

function authHeaders(extra = {}) {
  const sess   = getSession();
  const slug   = getTenantSlug();
  const userId = sess?.user?.id || null;
  const h      = { ...extra };
  if (slug)   h['X-Tenant-Slug'] = slug;
  if (userId) h['X-User-Id']     = userId;
  return h;
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

/**
 * Parse a fetch Response and throw an ApiError on non-2xx status.
 * Always resolves to the parsed JSON body on success.
 */
class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.body   = body;
    // Zod validation failures surface a short "detail" field — use it if present
    this.detail = body?.detail || body?.error || message;
    // Full validation errors array (each has { field, message, code })
    this.errors = body?.errors || null;
  }
}

async function handleResponse(res) {
  let body;
  const ct = res.headers.get('content-type') || '';
  try {
    body = ct.includes('application/json') ? await res.json() : await res.text();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      (typeof body === 'object' && body !== null)
        ? (body.detail || body.error || `HTTP ${res.status}`)
        : `HTTP ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  return body;
}

const api = {
  get:    (path)       => fetch(`/api${path}`, { headers: authHeaders()  }).then(handleResponse),
  post:   (path, body) => fetch(`/api${path}`, { method: 'POST',   headers: jsonHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  patch:  (path, body) => fetch(`/api${path}`, { method: 'PATCH',  headers: jsonHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put:    (path, body) => fetch(`/api${path}`, { method: 'PUT',    headers: jsonHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  del:    (path)       => fetch(`/api${path}`, { method: 'DELETE', headers: authHeaders()  }).then(handleResponse),
  delete: (path)       => fetch(`/api${path}`, { method: 'DELETE', headers: authHeaders()  }).then(handleResponse),
};

// ── Backward-compatible silent variant ────────────────────────────────────────
// Components that haven't been updated to handle ApiError can use api.quietly.*
// These never throw — they return the data on success, or null on error (and
// log the error to the console so it's still visible during development).
const quietly = {
  get:    async (path, fallback = null)       => { try { return await api.get(path);        } catch(e) { console.warn('[api]', 'GET',    path, e.message); return fallback; } },
  post:   async (path, body, fallback = null) => { try { return await api.post(path, body);  } catch(e) { console.warn('[api]', 'POST',   path, e.message); return fallback; } },
  patch:  async (path, body, fallback = null) => { try { return await api.patch(path, body); } catch(e) { console.warn('[api]', 'PATCH',  path, e.message); return fallback; } },
  put:    async (path, body, fallback = null) => { try { return await api.put(path, body);   } catch(e) { console.warn('[api]', 'PUT',    path, e.message); return fallback; } },
  del:    async (path, fallback = null)       => { try { return await api.del(path);         } catch(e) { console.warn('[api]', 'DELETE', path, e.message); return fallback; } },
  delete: async (path, fallback = null)       => { try { return await api.delete(path);      } catch(e) { console.warn('[api]', 'DELETE', path, e.message); return fallback; } },
};
api.quietly = quietly;

export default api;
export { authHeaders, jsonHeaders, getTenantSlug, getSession, ApiError };

// Bare fetch wrapper — attaches tenant + user headers without throwing
export function tFetch(url, opts = {}) {
  const h = { ...authHeaders(), ...(opts.headers || {}) };
  return fetch(url, { ...opts, headers: h });
}
