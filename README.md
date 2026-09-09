# Winter Arc (ZimArc)

Create gym routines, log workouts with rest timers, and track progress — with photo-backed exercises and optional workout reminders.

![Login](docs/screenshots/01-login.png)

## Features

- Email/password auth via Supabase
- Routine builder with multi-day splits and exercise photo library
- Workout logging with rest timer and editable history
- Progress: streaks, volume, and per-exercise PRs
- Reminder settings (browser notifications + service worker)
- Installable PWA (production)

## Quick start

```bash
npm install
cp .env.example .env
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Required before routines/workouts work:** run the database migrations in your Supabase project. Easiest path — paste `supabase/000_all.sql` into the Supabase **SQL Editor** and run it. Details: [docs/SETUP.md](docs/SETUP.md).

## App walkthrough

Screens below are from the live app. **Routines / workouts / progress / settings need the SQL migrations** — if those pages say tables are missing, run `supabase/000_all.sql` once (see [docs/SETUP.md](docs/SETUP.md)), then `npm run screenshots` to refresh shots.

| Step | Screen |
|------|--------|
| Sign in | ![Login](docs/screenshots/01-login.png) |
| Create account | ![Signup](docs/screenshots/02-signup.png) |
| Home | ![Dashboard](docs/screenshots/03-dashboard.png) |
| Routines | ![Routines](docs/screenshots/04-routines.png) |
| Build a routine | ![Builder](docs/screenshots/05-routine-builder.png) |
| Exercise photos | ![Picker](docs/screenshots/06-exercise-photo-picker.png) |
| Workout history | ![Workouts](docs/screenshots/07-workouts.png) |
| Log a session | ![Session](docs/screenshots/08-workout-session.png) |
| Progress | ![Progress](docs/screenshots/09-progress.png) |
| Reminders | ![Settings](docs/screenshots/10-settings.png) |

Mobile:

| Dashboard | Routine builder |
|-----------|-----------------|
| ![Mobile dashboard](docs/screenshots/11-dashboard-mobile.png) | ![Mobile builder](docs/screenshots/12-routine-builder-mobile.png) |

## Docs

- [Setup](docs/SETUP.md) — env, Auth URLs, SQL migrations
- [Database](docs/DATABASE.md) — schema and migration order
- [Auth](docs/AUTH.md) — login, signup, callback flow
- [Architecture](docs/ARCHITECTURE.md) — app structure
- [Screenshots](docs/SCREENSHOTS.md) — regenerate product shots
- [Contributing](CONTRIBUTING.md)

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase Auth + Postgres · `@supabase/ssr`

## License

Private / personal project unless otherwise noted.
