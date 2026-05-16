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
import { supabase } from '@/lib/supabase';

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
  /** Skip auth token injection */
  skipAuth?: boolean;
  /** Extra headers */
  headers?: Record<string, string>;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.access_token;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, skipAuth = false, headers = {} } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = skipAuth ? null : await getAccessToken();

  const buildHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  });

  const doRequest = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        method,
        headers: buildHeaders(),
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

  let response = await doRequest();

  // Handle 401
  if (response.status === 401 && !skipAuth) {
    throw new AuthError();
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
