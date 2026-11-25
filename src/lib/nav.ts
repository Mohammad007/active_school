import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

/**
 * Navigation helpers. Paths are plain strings so server-provided routes
 * (notifications, banners, ledger) can be followed safely.
 */
export function go(path: string) {
  router.push(path as Href);
}

export function goReplace(path: string) {
  router.replace(path as Href);
}

export function goBack(fallback = '/(tabs)/home') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as Href);
}

/** App routes the server may link to. Anything else is ignored. */
const KNOWN = [
  /^\/posts\/\d+$/,
  /^\/students\/\d+$/,
  /^\/submissions(\/\d+)?$/,
  /^\/challenges(\/\d+)?$/,
  /^\/events(\/\d+)?$/,
  /^\/achievements(\/\d+)?$/,
  /^\/goals(\/\d+)?$/,
  /^\/rewards$/,
  /^\/rewards\/tracking\?claim=\d+$/,
  /^\/points$/,
  /^\/notifications$/,
  /^\/saved$/,
  /^\/settings(\/[a-z-]+)?$/,
  /^\/(home|explore|leaderboard|profile|create)$/,
];

const TAB_ALIASES: Record<string, string> = {
  '/home': '/(tabs)/home',
  '/explore': '/(tabs)/explore',
  '/leaderboard': '/(tabs)/leaderboard',
  '/profile': '/(tabs)/profile',
  '/create': '/(tabs)/create',
};

/** Follow a route string from the API. Returns false when it is not a known app route. */
export function openRoute(route: string | null | undefined): boolean {
  if (!route) return false;
  if (/^https?:\/\//i.test(route)) {
    WebBrowser.openBrowserAsync(route).catch(() => undefined);
    return true;
  }
  const path = route.startsWith('/') ? route : `/${route}`;
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (!KNOWN.some((re) => re.test(clean))) return false;
  go(TAB_ALIASES[clean] ?? clean);
  return true;
}

export function openUrl(url: string | null | undefined) {
  if (url) WebBrowser.openBrowserAsync(url).catch(() => undefined);
}
