# ActiveSchool student app

Expo SDK 58 · expo-router · React Native 0.88 · TypeScript · zustand.
Talks to the Laravel API at `/api/activeschool/v1` (routes in `routes/api_mobile.php`).

## Run

```bash
npm install
npx expo start          # dev server (needs a development build for native modules)
npx tsc --noEmit        # typecheck
npx expo lint           # lint
```

## Pointing the app at an API

The base URL is `expo.extra.apiUrl` in `app.json` (default `https://activeschool.in/api/activeschool/v1`).
For a local Laravel server started with `php artisan serve --host 0.0.0.0 --port 8000`:

| Device | `apiUrl` |
|---|---|
| Android emulator | `http://10.0.2.2:8000/api/activeschool/v1` |
| Physical phone on the same Wi-Fi | `http://<your-PC-LAN-IP>:8000/api/activeschool/v1` |

Plain `http` only works in development builds; release builds should use https.

## Layout

- `src/api` — fetch client (`client.ts`: bearer token, `{data, meta}` envelope, `ApiError` with `code/message/fields`, multipart uploads with progress), typed endpoints (`endpoints.ts`).
- `src/types` — API response shapes, snake_case exactly as the server sends them.
- `src/stores` — `session` (token in expo-secure-store, `/me`, `/config`, categories, gate/maintenance handling), `posts` (optimistic appreciate/save), `draftStore` (persisted composer draft), `onboarding`, `uploads`.
- `src/hooks` — `useQuery` (loading/error/refresh), `usePaged` (page or cursor infinite lists), `useLayout` (tablet/phone sizing).
- `src/components/ui` — design-system primitives; `src/theme` — colour/type/spacing tokens (website palette).
- `src/app` — screens (file-based routes).
