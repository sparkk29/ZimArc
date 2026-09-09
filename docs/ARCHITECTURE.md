# Architecture

## Layout

```
src/
  app/                 # App Router pages + auth callback
  components/          # UI: shell, editors, media, timers, PWA helpers
  lib/
    exercises/         # Photo catalog for common lifts
    supabase/          # Auth clients + data helpers (routines, workouts, profile)
    reminders/         # Service-worker reminder sync
    format-error.ts    # Human-readable API/PostgREST errors
public/
  sw.js                # Service worker (PWA / reminders)
  manifest.webmanifest
supabase/              # SQL migrations
docs/                  # Setup + screenshots
scripts/               # Playwright screenshot capture
```

## Data access

- Server components use `createSupabaseServerClient()` for auth gates (e.g. dashboard).
- Interactive pages are client components that call helpers in `src/lib/supabase/*`.
- Helpers throw PostgREST/Auth errors; UI surfaces them via `formatError`.

## UI / design

- Global theme tokens in `src/app/globals.css` (navy / ice).
- Display + body fonts: Syne + Outfit.
- Exercise visuals: Unsplash URLs in `src/lib/exercises/catalog.ts` via `next/image`.

## PWA

- `ServiceWorkerRegister` registers `/sw.js` in **production only**; unregisters caches in dev to avoid stale HTML/hydration issues.
- Settings sync reminder prefs into the SW for background notifications when supported.
