const BASE = '/api';

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('artham_tokens') || '{}');
  } catch {
    return {};
  }
}

export function saveTokens({ access, refresh }) {
  localStorage.setItem('artham_tokens', JSON.stringify({ access, refresh }));
}

export function clearTokens() {
  localStorage.removeItem('artham_tokens');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('artham_user') || 'null');
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem('artham_user', JSON.stringify(user));
}

async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const tokens = getTokens();
  if (auth && tokens.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
    if (tokens.refresh) headers['x-refresh-token'] = tokens.refresh;
  }

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    throw new Error('Network error. Please check your connection.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.status === 401 && data.code === 'TOKEN_EXPIRED' && retry && tokens.refresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(path, { method, body, auth, retry: false });
    }
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong.');
    err.status = res.status;
    err.code = data.code;
    Object.assign(err, data);
    throw err;
  }

  return data;
}

export async function refreshSession() {
  const tokens = getTokens();
  if (!tokens.refresh) return false;
  try {
    const res = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refresh })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('refresh failed');
    saveTokens({ access: data.access, refresh: tokens.refresh });
    if (data.user) saveUser(data.user);
    return true;
  } catch {
    clearTokens();
    if (onUnauthorized) onUnauthorized();
    return false;
  }
}

export const api = {
  get: (p, opts) => request(p, { method: 'GET', ...opts }),
  post: (p, body, opts) => request(p, { method: 'POST', body, ...opts }),
  put: (p, body, opts) => request(p, { method: 'PUT', body, ...opts }),
  patch: (p, body, opts) => request(p, { method: 'PATCH', body, ...opts })
};
