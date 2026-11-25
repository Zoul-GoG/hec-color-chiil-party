import {
  ErrorCode,
  type AdminLoginDto,
  type AdminMeDto,
  type AdminUserDto,
  type CreateAdminUserDto,
  type UpdateAdminUserDto,
  type AdminTrackDto,
  type AdminTrackPatchDto,
  type AdminTracksQuery,
  type AdminTracksResponseDto,
  type Range,
  type StatsDto,
  type AddTrackResponseDto,
  type Paginated,
  type PreviewDto,
  type PublicSettingsDto,
  type PublicSort,
  type SearchResponseDto,
  type TrackDto,
} from '@hcc/shared';
import { getGuestId } from './guestId';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function fallbackCode(status: number): ErrorCode {
  if (status === 429) return ErrorCode.RATE_LIMITED;
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 503) return ErrorCode.DEEZER_UNAVAILABLE;
  return ErrorCode.INTERNAL_ERROR;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Guest-Id', getGuestId());
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, ErrorCode.INTERNAL_ERROR, 'Network error');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: ErrorCode; message?: string } | null;
    throw new ApiError(res.status, body?.code ?? fallbackCode(res.status), body?.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : '';
};

export const adminApi = {
  login: (body: AdminLoginDto) =>
    request<AdminMeDto>('/admin/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/admin/auth/logout', { method: 'POST' }),
  me: () => request<AdminMeDto>('/admin/auth/me'),
  setSubmissionsOpen: (submissionsOpen: boolean) =>
    request<{ submissionsOpen: boolean }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ submissionsOpen }),
    }),
  stats: (range: Range) => request<StatsDto>(`/admin/stats${qs({ range })}`),
  tracks: (q: AdminTracksQuery) => request<AdminTracksResponseDto>(`/admin/tracks${qs({ ...q })}`),
  patchTrack: (trackKey: string, body: AdminTrackPatchDto) =>
    request<AdminTrackDto>(`/admin/tracks/${encodeURIComponent(trackKey)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  users: () => request<AdminUserDto[]>('/admin/users'),
  createUser: (body: CreateAdminUserDto) =>
    request<AdminUserDto>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: UpdateAdminUserDto) =>
    request<AdminUserDto>(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteUser: (id: string) => request<void>(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const api = {
  settings: () => request<PublicSettingsDto>('/settings/public'),
  search: (q: string, signal?: AbortSignal) => request<SearchResponseDto>(`/search${qs({ q })}`, { signal }),
  tracks: (sort: PublicSort, page: number, limit: number) =>
    request<Paginated<TrackDto>>(`/tracks${qs({ sort, page, limit })}`),
  addTrack: (deezerId: number) =>
    request<AddTrackResponseDto>('/additions', { method: 'POST', body: JSON.stringify({ deezerId }) }),
  preview: (trackKey: string, deezerId?: number) =>
    request<PreviewDto>(`/tracks/${encodeURIComponent(trackKey)}/preview${qs({ deezerId })}`),
};
