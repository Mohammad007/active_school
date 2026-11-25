import Constants from 'expo-constants';

/**
 * API base URL. Set `expo.extra.apiUrl` in app.json to point the app at another
 * server. For a Laravel dev server (`php artisan serve --host 0.0.0.0 --port 8000`):
 *   - Android emulator:  http://10.0.2.2:8000/api/activeschool/v1
 *   - Physical device:   http://<your-LAN-IP>:8000/api/activeschool/v1
 * Plain http only works in development builds (Android blocks cleartext in release).
 */
const DEFAULT_API_URL = 'https://activeschool.in/api/activeschool/v1';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/** `EXPO_PUBLIC_API_URL` (dev server env) wins, so a local backend needs no app.json edit. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
