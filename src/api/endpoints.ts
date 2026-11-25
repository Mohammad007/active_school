/**
 * Typed endpoint functions, grouped by domain. Paths mirror routes/api_mobile.php
 * (prefix /api/activeschool/v1 lives in API_URL).
 */
import { api, uploadFile, type UploadFile } from './client';
import type {
  Achievement,
  AchievementDetail,
  Activity,
  ActivityInput,
  AppConfig,
  AppEvent,
  AppNotification,
  AuthResult,
  Banner,
  BlockedStudent,
  Category,
  Challenge,
  ChallengeDetail,
  ChallengeTab,
  Comment,
  EventLeaderboard,
  EventTab,
  Faq,
  Goal,
  GoalInput,
  Leaderboard,
  Me,
  Media,
  MyProfile,
  OnboardingInput,
  OtpRequestResult,
  PeerProfile,
  PointsEntry,
  PointsMeta,
  Preferences,
  ProfileUpdateInput,
  ReportType,
  RewardClaim,
  RewardsOverview,
  School,
  SchoolClass,
  ScoringRules,
  Season,
  SitePage,
  SubmissionFilter,
  SupportTicket,
  TicketType,
} from '@/types';

const id = (v: number | string) => encodeURIComponent(String(v));

// ───────────────────────────── Public ─────────────────────────────

export const publicApi = {
  config: () => api.get<AppConfig>('/config'),
  schools: (search: string, page = 1) => api.page<School>('/schools', { search, page }),
  classes: (schoolId: number) => api.get<SchoolClass[]>(`/schools/${id(schoolId)}/classes`),
  requestSchool: (body: { school_name: string; city?: string; state?: string; contact?: string }) =>
    api.post<{ id: number; status: string }>('/school-requests', body),
  page: (slug: 'terms' | 'privacy' | string) => api.get<SitePage>(`/pages/${id(slug)}`),
  faqs: () => api.get<Faq[]>('/faqs'),
  /** Public account-recovery ticket (no sign-in). */
  recovery: (body: { subject: string; message: string; contact?: string }) =>
    api.post<{ id: number; status: string }>('/support/recovery', { type: 'recovery', ...body }, { anonymous: true }),
};

// ───────────────────────────── Auth & account ─────────────────────────────

export const authApi = {
  requestOtp: (phone: string) => api.post<OtpRequestResult>('/auth/otp', { phone }, { anonymous: true }),
  verifyOtp: (phone: string, code: string, device_name: string) =>
    api.post<AuthResult>('/auth/verify', { phone, code, device_name }, { anonymous: true }),
  logout: () => api.post<{ signed_out: boolean }>('/auth/logout'),
  logoutAll: () => api.post<{ signed_out: boolean }>('/auth/logout-all'),
};

export const accountApi = {
  me: () => api.get<Me>('/me'),
  onboard: (body: OnboardingInput) => api.post<{ student: MyProfile; can_participate: boolean }>('/onboarding', body),
  uploadAvatar: (file: UploadFile, onProgress?: (f: number) => void) => uploadFile<Media>('/me/avatar', file, {}, onProgress),
  updateProfile: (body: ProfileUpdateInput) => api.patch<MyProfile>('/me/profile', body),
  updatePreferences: (body: { privacy?: Partial<Preferences['privacy']>; notifications?: Partial<Preferences['notifications']>; language?: 'en' | 'hi' }) =>
    api.patch<Preferences>('/me/preferences', body),
  deleteAccount: (reason?: string) => api.delete<{ deletion_pending: boolean }>('/me', { confirm: 'DELETE', reason }),
  tickets: (page = 1) => api.page<SupportTicket>('/support', { page }),
  createTicket: (body: { type: TicketType; subject: string; message: string; contact?: string }) =>
    api.post<{ id: number; status: string }>('/support', body),
};

// ───────────────────────────── Notifications ─────────────────────────────

export const notificationsApi = {
  list: (tab: string, page = 1) => api.page<AppNotification>('/notifications', { tab: tab === 'all' ? undefined : tab, page }),
  unreadCount: () => api.get<{ unread: number }>('/notifications/unread-count'),
  read: (notificationId: number) => api.post<{ read: boolean }>(`/notifications/${id(notificationId)}/read`),
  readAll: () => api.post<{ read: boolean }>('/notifications/read-all'),
};

// ───────────────────────────── Feed & social ─────────────────────────────

export const socialApi = {
  categories: () => api.get<Category[]>('/categories'),
  banners: (placement: 'home' | 'explore') => api.get<Banner[]>('/banners', { placement }),
  feed: (params: { cursor?: string | null; category?: number | null; q?: string; per_page?: number }) =>
    api.page<Activity>('/feed', { cursor: params.cursor, category: params.category, q: params.q, per_page: params.per_page ?? 10 }),
  post: (postId: number | string) => api.get<Activity>(`/posts/${id(postId)}`),
  appreciate: (postId: number, on: boolean) =>
    on
      ? api.post<{ appreciated: boolean; appreciations_count: number }>(`/posts/${id(postId)}/appreciate`)
      : api.delete<{ appreciated: boolean; appreciations_count: number }>(`/posts/${id(postId)}/appreciate`),
  save: (postId: number, on: boolean) =>
    on ? api.post<{ saved: boolean }>(`/posts/${id(postId)}/save`) : api.delete<{ saved: boolean }>(`/posts/${id(postId)}/save`),
  saved: (page = 1) => api.page<Activity>('/saved', { page }),
  comments: (postId: number | string, page = 1) => api.page<Comment>(`/posts/${id(postId)}/comments`, { page }),
  addComment: (postId: number, body: string) => api.post<Comment>(`/posts/${id(postId)}/comments`, { body }),
  deleteComment: (commentId: number) => api.delete<{ deleted: boolean }>(`/comments/${id(commentId)}`),
  report: (body: { type: ReportType; id?: number | null; reason: string; details?: string }) =>
    api.post<{ id: number; status: string }>('/reports', body),
  student: (studentId: number | string) => api.get<PeerProfile>(`/students/${id(studentId)}`),
  studentPosts: (studentId: number | string, page = 1) => api.page<Activity>(`/students/${id(studentId)}/posts`, { page }),
  blocks: () => api.get<BlockedStudent[]>('/blocks'),
  block: (studentId: number) => api.post<{ blocked: boolean }>('/blocks', { student_id: studentId }),
  unblock: (studentId: number) => api.delete<{ blocked: boolean }>(`/blocks/${id(studentId)}`),
};

// ───────────────────────────── Activities (my submissions) ─────────────────────────────

export const activitiesApi = {
  upload: (file: UploadFile, kind: 'photo' | 'evidence', onProgress?: (f: number) => void) =>
    uploadFile<Media>('/uploads', file, { kind }, onProgress),
  deleteUpload: (mediaId: number) => api.delete<{ deleted: boolean }>(`/uploads/${id(mediaId)}`),
  list: (status: SubmissionFilter, page = 1) => api.page<Activity>('/activities', { status, page }),
  get: (activityId: number | string) => api.get<Activity>(`/activities/${id(activityId)}`),
  /** `idempotencyKey` must stay the same across retries of one submission attempt. */
  create: (body: ActivityInput, idempotencyKey: string) =>
    api.post<Activity>('/activities', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
  update: (activityId: number, body: ActivityInput) => api.put<Activity>(`/activities/${id(activityId)}`, body),
  remove: (activityId: number) => api.delete<{ deleted: boolean }>(`/activities/${id(activityId)}`),
};

// ───────────────────────────── Competition ─────────────────────────────

export const competitionApi = {
  points: (page = 1) => api.page<PointsEntry, PointsMeta>('/points', { page }),
  rules: () => api.get<ScoringRules>('/scoring-rules'),
  seasons: () => api.get<Season[]>('/seasons'),
  leaderboard: (params: { period?: 'season' | 'all_time'; season_id?: number | null }) =>
    api.get<Leaderboard>('/leaderboard', { period: params.period, season_id: params.season_id }),
  rewards: () => api.get<RewardsOverview>('/rewards'),
  claim: (claimId: number | string) => api.get<RewardClaim>(`/rewards/claims/${id(claimId)}`),
  requestClaim: (claimId: number, body: { delivery_name: string; delivery_phone: string; delivery_address: string }) =>
    api.post<RewardClaim>(`/rewards/claims/${id(claimId)}/request`, body),
};

// ───────────────────────────── Modules ─────────────────────────────

export const challengesApi = {
  list: (tab: ChallengeTab) => api.get<Challenge[]>('/challenges', { tab }),
  get: (challengeId: number | string) => api.get<ChallengeDetail>(`/challenges/${id(challengeId)}`),
  join: (challengeId: number) => api.post<Challenge>(`/challenges/${id(challengeId)}/join`),
  leave: (challengeId: number) => api.delete<{ joined: boolean }>(`/challenges/${id(challengeId)}/join`),
};

export const eventsApi = {
  list: (tab: EventTab, page = 1, filters: { category?: number | null; month?: string | null } = {}) =>
    api.page<AppEvent>('/events', { tab, page, category: filters.category, month: filters.month }),
  get: (eventId: number | string) => api.get<AppEvent>(`/events/${id(eventId)}`),
  register: (eventId: number, team_name?: string) => api.post<AppEvent>(`/events/${id(eventId)}/register`, team_name ? { team_name } : {}),
  cancel: (eventId: number) => api.delete<{ registration: string }>(`/events/${id(eventId)}/register`),
  leaderboard: (eventId: number | string) => api.get<EventLeaderboard>(`/events/${id(eventId)}/leaderboard`),
};

export const achievementsApi = {
  list: () => api.get<Achievement[]>('/achievements'),
  get: (achievementId: number | string) => api.get<AchievementDetail>(`/achievements/${id(achievementId)}`),
  portfolio: (page = 1, filters: { year?: number | null; category?: number | null; level?: string | null } = {}) =>
    api.page<Activity>('/portfolio', { page, ...filters }),
};

export const goalsApi = {
  list: () => api.get<Goal[]>('/goals'),
  get: (goalId: number | string) => api.get<Goal>(`/goals/${id(goalId)}`),
  create: (body: GoalInput) => api.post<Goal>('/goals', body),
  update: (goalId: number, body: GoalInput) => api.patch<Goal>(`/goals/${id(goalId)}`, body),
  remove: (goalId: number) => api.delete<{ deleted: boolean }>(`/goals/${id(goalId)}`),
};
