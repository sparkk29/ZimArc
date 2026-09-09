# Winter Arc (ZimArc)

Create your Winter Arc gym routine, save it, log workouts, and update progress.

## Supabase setup

1. Create a Supabase project.
2. Copy credentials into your environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run SQL migrations (Supabase SQL editor):
   - `supabase/001_init.sql` (routines)
   - `supabase/002_workouts.sql` (workout sessions + sets)
   - `supabase/003_profiles_reminders.sql` (profiles + workout reminders)
   - `supabase/004_routine_edit_safe.sql` (safe routine editing with history)

## Auth redirect URLs (important)

In Supabase Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL**: `http://localhost:3000`
2. **Redirect URLs** (add both):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

For local testing, you can also disable **Confirm email** under Authentication → Providers → Email so signup logs you in immediately (avoids email rate limits).

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## PWA / offline reminders

- The app registers a service worker (`public/sw.js`) and ships a web manifest.
- Install it from your browser (“Add to Home Screen” / install prompt) on HTTPS or localhost.
- Reminder settings are synced into the service worker so notifications can fire even when the tab is in the background.
- True closed-app periodic reminders depend on browser support for Periodic Background Sync (Chromium + permission).
