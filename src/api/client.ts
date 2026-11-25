import { API_URL } from './config';
import { ApiError } from './errors';
import type { Envelope, PageMeta, Paged } from '@/types';

/**
 * Minimal typed fetch client for the ActiveSchool API.
 * - success: `{ data, meta? }`; errors: `{ error: { code, message, fields?, request_id } }`
 * - bearer token comes from the session (secure store) via `setAuthToken`
 * - auth / gate / maintenance failures are reported to the session via `setErrorListener`
 */

export type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  /** Send without the bearer token. */
  anonymous?: boolean;
  timeoutMs?: number;
}

let token: string | null = null;
let errorListener: ((e: ApiError) => void) | null = null;

export function setAuthToken(value: string | null) {
  token = value;
}

export function getAuthToken() {
  return token;
}

/** The session store listens for 401 / gate / maintenance errors. */
export function setErrorListener(fn: ((e: ApiError) => void) | null) {
  errorListener = fn;
}

export function buildUrl(path: string, query?: Query) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

function baseHeaders(anonymous?: boolean): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token && !anonymous) h.Authorization = `Bearer ${token}`;
  return h;
}

type ErrorBody = { error?: { code?: string; message?: string; fields?: Record<string, string[]>; request_id?: string } } | null;

function toApiError(status: number, json: unknown): ApiError {
  const err = (json as ErrorBody)?.error;
  if (err) return new ApiError(status, err.code ?? `http_${status}`, err.message ?? 'Request failed.', err.fields, err.request_id);
  if (status === 401) return new ApiError(401, 'unauthenticated', 'Please sign in again.');
  if (status === 429) return new ApiError(429, 'rate_limited', 'Too many attempts. Please wait a moment and try again.');
  if (status >= 500) return new ApiError(status, 'server_error', 'The server had a problem. Please try again.');
  return new ApiError(status, `http_${status}`, 'Request failed.');
}

function report(e: ApiError) {
  try {
    errorListener?.(e);
  } catch {
    // listener problems must never mask the original failure
  }
}

async function request<T, M = PageMeta>(method: string, path: string, opts: RequestOptions = {}): Promise<Envelope<T, M>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
  const headers: Record<string, string> = { ...baseHeaders(opts.anonymous), ...opts.headers };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: controller.signal });
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    throw new ApiError(
      0,
      aborted ? 'timeout' : 'network',
      aborted ? 'The request timed out. Check your connection and try again.' : 'You appear to be offline. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const e = toApiError(res.status, json);
    report(e);
    throw e;
  }
  return (json ?? { data: null }) as Envelope<T, M>;
}

type NoBody = Omit<RequestOptions, 'body'>;
type NoQueryBody = Omit<RequestOptions, 'query' | 'body'>;

export const api = {
  /** GET → `data` */
  async get<T>(path: string, query?: Query, opts?: NoQueryBody): Promise<T> {
    return (await request<T>('GET', path, { ...opts, query })).data;
  },
  /** GET a paginated list → `{ data, meta }` */
  async page<T, M = PageMeta>(path: string, query?: Query, opts?: NoQueryBody): Promise<Paged<T, M>> {
    const env = await request<T[], M>('GET', path, { ...opts, query });
    return { data: env.data ?? [], meta: (env.meta ?? {}) as M };
  },
  async post<T>(path: string, body?: unknown, opts?: NoBody): Promise<T> {
    return (await request<T>('POST', path, { ...opts, body: body ?? {} })).data;
  },
  async put<T>(path: string, body?: unknown, opts?: NoBody): Promise<T> {
    return (await request<T>('PUT', path, { ...opts, body: body ?? {} })).data;
  },
  async patch<T>(path: string, body?: unknown, opts?: NoBody): Promise<T> {
    return (await request<T>('PATCH', path, { ...opts, body: body ?? {} })).data;
  },
  async delete<T>(path: string, body?: unknown, opts?: NoBody): Promise<T> {
    return (await request<T>('DELETE', path, { ...opts, body })).data;
  },
};

export interface UploadFile {
  uri: string;
  name?: string | null;
  type?: string | null;
}

export interface UploadTask<T> {
  promise: Promise<T>;
  abort: () => void;
}

function guessType(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Multipart upload with progress. XMLHttpRequest exposes upload progress in
 * React Native (fetch does not). Resolves with the response `data`.
 */
export function uploadFile<T>(
  path: string,
  file: UploadFile,
  fields: Record<string, string> = {},
  onProgress?: (fraction: number) => void,
): UploadTask<T> {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<T>((resolve, reject) => {
    const form = new FormData();
    const name = file.name || file.uri.split('/').pop() || 'photo.jpg';
    // React Native FormData accepts { uri, name, type } file parts.
    form.append('file', { uri: file.uri, name, type: file.type || guessType(name) } as unknown as Blob);
    for (const [k, v] of Object.entries(fields)) form.append(k, v);

    xhr.open('POST', buildUrl(path));
    for (const [k, v] of Object.entries(baseHeaders())) xhr.setRequestHeader(k, v);
    xhr.timeout = 120000;
    if (onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && ev.total > 0) onProgress(Math.min(0.99, ev.loaded / ev.total));
      };
    }
    xhr.onload = () => {
      let json: unknown = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve((json as Envelope<T>)?.data);
      } else {
        const e = toApiError(xhr.status, json);
        report(e);
        reject(e);
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'network', 'Upload failed. Check your connection and try again.'));
    xhr.ontimeout = () => reject(new ApiError(0, 'timeout', 'Upload timed out. Try again on a stronger connection.'));
    xhr.onabort = () => reject(new ApiError(0, 'aborted', 'Upload cancelled.'));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}
