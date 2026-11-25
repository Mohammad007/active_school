import * as Device from 'expo-device';
import { router, type Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { create } from 'zustand';

import {
  accountApi,
  ApiError,
  APP_VERSION,
  authApi,
  notificationsApi,
  publicApi,
  setAuthToken,
  setErrorListener,
  socialApi,
  type GateCode,
} from '@/api';
import type { AppConfig, Category, FeatureKey, Me, MyProfile } from '@/types';

const TOKEN_KEY = 'activeschool.token';

export type SessionStatus = 'booting' | 'signedOut' | 'ready';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  me: Me | null;
  config: AppConfig | null;
  categories: Category[];
  /** Why a signed-in student cannot see class content yet. */
  gate: GateCode | null;
  gateMessage: string | null;
  /** Set when the API answers 503 maintenance (or config says so). */
  maintenance: string | null;
  unreadCount: number;
  /** A boot failure we could not recover from (e.g. offline on first launch). */
  bootError: ApiError | null;

  restore: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: (opts?: { remote?: boolean; all?: boolean }) => Promise<void>;
  refreshMe: () => Promise<Me | null>;
  loadConfig: () => Promise<AppConfig | null>;
  loadCategories: () => Promise<Category[]>;
  refreshUnread: () => Promise<void>;
  setUnread: (n: number) => void;
  patchStudent: (patch: Partial<MyProfile>) => void;
  clearGate: () => void;
}

export const deviceName = () =>
  [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || `${Platform.OS} device`;

async function readToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function writeToken(value: string | null) {
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(TOKEN_KEY, value);
      else globalThis.localStorage?.removeItem(TOKEN_KEY);
      return;
    }
    if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // secure storage unavailable: the session simply won't survive a restart
  }
}

function gateFromMe(me: Me | null): GateCode | null {
  if (!me) return null;
  if (me.onboarding_required || !me.student) return 'onboarding_required';
  if (me.can_participate === false) {
    return me.student.enrollment_status !== 'active' ? 'enrollment_pending' : 'consent_pending';
  }
  return null;
}

/** Compare dotted versions: true when `current` is older than `min`. */
export function isOlderVersion(current: string, min: string | null | undefined) {
  if (!min) return false;
  const a = current.split('.').map((n) => parseInt(n, 10) || 0);
  const b = min.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'booting',
  token: null,
  me: null,
  config: null,
  categories: [],
  gate: null,
  gateMessage: null,
  maintenance: null,
  unreadCount: 0,
  bootError: null,

  restore: async () => {
    set({ bootError: null });
    const token = await readToken();
    setAuthToken(token);
    set({ token });
    try {
      await get().loadConfig();
    } catch (e) {
      // Config is needed for feature flags; without it we cannot continue.
      set({ bootError: e instanceof ApiError ? e : new ApiError(0, 'network', 'Could not reach ActiveSchool.') });
      return;
    }
    if (!token) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      await get().refreshMe();
      if (get().token) set({ status: 'ready' });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.code.startsWith('account_'))) return; // listener signed us out
      set({ bootError: e instanceof ApiError ? e : new ApiError(0, 'network', 'Could not reach ActiveSchool.') });
    }
  },

  signIn: async (token) => {
    await writeToken(token);
    setAuthToken(token);
    set({ token, gate: null, gateMessage: null });
    await get().refreshMe();
    // Feature flags can differ per school — reload now that we know who this is.
    get().loadConfig().catch(() => undefined);
    set({ status: 'ready' });
  },

  signOut: async ({ remote = true, all = false } = {}) => {
    if (remote && get().token) {
      try {
        await (all ? authApi.logoutAll() : authApi.logout());
      } catch {
        // the token is being dropped locally either way
      }
    }
    await writeToken(null);
    setAuthToken(null);
    set({ status: 'signedOut', token: null, me: null, categories: [], gate: null, gateMessage: null, unreadCount: 0 });
  },

  refreshMe: async () => {
    const me = await accountApi.me();
    const gate = gateFromMe(me);
    set({ me, gate, gateMessage: gate ? get().gateMessage : null });
    if (!gate) {
      // Probing an `active` endpoint also catches `school_disabled`.
      try {
        await get().loadCategories();
        get().refreshUnread();
      } catch {
        // gate errors are handled by the listener; others surface on screens
      }
    }
    return me;
  },

  loadConfig: async () => {
    const config = await publicApi.config();
    set({ config, maintenance: config.maintenance?.enabled ? config.maintenance.message || 'ActiveSchool is down for maintenance.' : null });
    return config;
  },

  loadCategories: async () => {
    const categories = await socialApi.categories();
    set({ categories });
    return categories;
  },

  refreshUnread: async () => {
    try {
      const { unread } = await notificationsApi.unreadCount();
      set({ unreadCount: unread });
    } catch {
      // badge only
    }
  },

  setUnread: (n) => set({ unreadCount: Math.max(0, n) }),

  patchStudent: (patch) => {
    const me = get().me;
    if (!me?.student) return;
    set({ me: { ...me, student: { ...me.student, ...patch } } });
  },

  clearGate: () => set({ gate: null, gateMessage: null }),
}));

/** Where a student belongs right now. */
export function homeRoute(): Href {
  const { status, gate } = useSession.getState();
  if (status !== 'ready') return '/welcome';
  if (gate === 'onboarding_required') return '/select-school';
  if (gate) return '/enrolment-pending' as Href;
  return '/(tabs)/home';
}

/** Is a feature module switched on (GET /config → features)? Defaults to on until config loads. */
export function useFeature(key: FeatureKey): boolean {
  return useSession((s) => s.config?.features?.[key] ?? true);
}

export function useUpdateRequired(): boolean {
  return useSession((s) => isOlderVersion(APP_VERSION, s.config?.min_app_version));
}

// ───────────── Global API error handling ─────────────

let redirecting = false;

setErrorListener((e) => {
  const state = useSession.getState();
  if (e.status === 401 && state.token) {
    if (redirecting) return;
    redirecting = true;
    state.signOut({ remote: false }).finally(() => {
      router.replace('/welcome');
      redirecting = false;
    });
    return;
  }
  if (e.code.startsWith('account_') && state.token) {
    state.signOut({ remote: false }).finally(() => {
      router.replace('/welcome');
      Alert.alert('Signed out', e.message);
    });
    return;
  }
  if (e.code === 'maintenance' || (e.status === 503 && e.code === 'unavailable')) {
    useSession.setState({ maintenance: e.message || 'ActiveSchool is down for maintenance.' });
    return;
  }
  if (e.isGate && state.token) {
    const code = e.code as GateCode;
    const changed = state.gate !== code;
    useSession.setState({ gate: code, gateMessage: e.message });
    // During boot/sign-in the caller routes via homeRoute(); afterwards we redirect here.
    if (changed && state.status === 'ready') {
      router.replace(code === 'onboarding_required' ? '/select-school' : ('/enrolment-pending' as Href));
    }
  }
});
