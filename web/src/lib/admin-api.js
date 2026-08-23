'use client';
// Admin panel uchun API klienti: JWT saqlash, avtomatik refresh, xatolarni ushlash.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ACCESS_KEY = 'ms-admin-access';
const REFRESH_KEY = 'ms-admin-refresh';

export const tokens = {
  get access() {
    try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
  },
  get refresh() {
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
  },
  set(access, refresh) {
    try {
      if (access) localStorage.setItem(ACCESS_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    } catch { /* private rejim */ }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch { /* */ }
  },
};

/** Bir vaqtning o'zida bir nechta 401 kelsa - faqat bitta refresh so'rovi ketsin */
let refreshPromise = null;

async function refreshAccess() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const rt = tokens.refresh;
    if (!rt) return null;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: rt }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) return null;
      tokens.set(json.data.accessToken, json.data.refreshToken);
      return json.data.accessToken;
    } catch {
      return null;
    } finally {
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
}

/**
 * Himoyalangan so'rov. 401 kelsa tokenni yangilab, bir marta qayta uriniladi.
 * @throws {Error & {status:number, details:any}}
 */
export async function adminFetch(path, { method = 'GET', body, isFormData = false, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const access = tokens.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const fresh = await refreshAccess();
    if (fresh) return adminFetch(path, { method, body, isFormData, retry: false });
    tokens.clear();
    if (typeof window !== 'undefined' && !location.pathname.endsWith('/admin/login')) {
      location.href = '/admin/login';
    }
    throw Object.assign(new Error('Sessiya tugadi'), { status: 401 });
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.ok === false) {
    throw Object.assign(new Error(json?.error?.message || `Xatolik (${res.status})`), {
      status: res.status,
      details: json?.error?.details,
      code: json?.error?.code,
    });
  }

  return json;
}

// ---- Qulay yordamchilar ----
export const api = {
  get: (p) => adminFetch(p),
  post: (p, b) => adminFetch(p, { method: 'POST', body: b }),
  patch: (p, b) => adminFetch(p, { method: 'PATCH', body: b }),
  del: (p) => adminFetch(p, { method: 'DELETE' }),

  /** Rasm yuklash (imgbb orqali) */
  upload: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await adminFetch('/api/upload', { method: 'POST', body: fd, isFormData: true });
    return r.data;
  },

  login: async (login, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error?.message || 'Kirishda xatolik');
    }
    tokens.set(json.data.accessToken, json.data.refreshToken);
    return json.data.admin;
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: tokens.refresh }),
      });
    } catch { /* baribir tozalaymiz */ }
    tokens.clear();
  },
};
