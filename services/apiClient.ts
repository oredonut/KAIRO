/**
 * KAIRO — API Client
 * ─────────────────────────────────────────────
 * Centralised fetch wrapper that handles:
 *   - JWT Bearer token injection
 *   - Automatic token refresh on 401
 *   - Request timeout via AbortController
 *   - Typed error discrimination (network / api / auth)
 *   - In-memory token store (swap for SecureStore in production)
 */

import { ENDPOINTS, TIMEOUT_MS } from '@/constants/api';

// ─── Token store (in-memory for demo; swap for expo-secure-store) ─────────────

let _accessToken: string | null  = null;
let _refreshToken: string | null = null;

export const TokenStore = {
  setTokens(access: string, refresh: string) {
    _accessToken  = access;
    _refreshToken = refresh;
  },
  clearTokens() {
    _accessToken  = null;
    _refreshToken = null;
  },
  getAccess()  { return _accessToken; },
  getRefresh() { return _refreshToken; },
};

// ─── Error types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Session expired — please log in again') {
    super(message);
    this.name = 'AuthError';
  }
}

// ─── Core request function ────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip auth token injection (e.g. for login/refresh) */
  skipAuth?: boolean;
  /** Extra headers */
  headers?: Record<string, string>;
}

let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string> {
  const refresh = TokenStore.getRefresh();
  if (!refresh) throw new AuthError();

  const res = await fetch(ENDPOINTS.auth.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    TokenStore.clearTokens();
    throw new AuthError();
  }

  const data = await res.json();
  TokenStore.setTokens(data.access_token, data.refresh_token ?? refresh);
  return data.access_token;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, skipAuth = false, headers = {} } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const buildHeaders = (token: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  });

  const doRequest = async (token: string | null): Promise<Response> => {
    try {
      return await fetch(url, {
        method,
        headers: buildHeaders(token),
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new NetworkError('Request timed out');
      throw new NetworkError();
    } finally {
      clearTimeout(timer);
    }
  };

  let token = TokenStore.getAccess();
  let response = await doRequest(token);

  // ── Handle 401: try refresh once ──────────────────────────────────────────
  if (response.status === 401 && !skipAuth) {
    if (_isRefreshing) {
      // Queue this request until refresh completes
      const newToken = await new Promise<string>((resolve) => {
        _refreshQueue.push(resolve);
      });
      response = await doRequest(newToken);
    } else {
      _isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        _refreshQueue.forEach((cb) => cb(newToken));
        _refreshQueue = [];
        response = await doRequest(newToken);
      } finally {
        _isRefreshing = false;
      }
    }
  }

  // ── Parse response ────────────────────────────────────────────────────────
  if (!response.ok) {
    let errBody: any = {};
    try { errBody = await response.json(); } catch (_) {}
    if (response.status === 401) throw new AuthError(errBody?.detail);
    throw new ApiError(response.status, errBody?.code ?? 'UNKNOWN', errBody?.detail ?? response.statusText);
  }

  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const api = {
  get:    <T>(url: string, opts?: RequestOptions) => apiRequest<T>(url, { ...opts, method: 'GET' }),
  post:   <T>(url: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>(url, { ...opts, method: 'POST', body }),
  put:    <T>(url: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>(url, { ...opts, method: 'PUT',  body }),
  delete: <T>(url: string, opts?: RequestOptions) => apiRequest<T>(url, { ...opts, method: 'DELETE' }),
};
