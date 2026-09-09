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

Before first use, run `supabase/000_all.sql` in the Supabase SQL Editor (or migrations `001`–`004`). Full setup: [docs/SETUP.md](docs/SETUP.md).

## App walkthrough

| Step | Screen |
|------|--------|
| Sign in | ![Login](docs/screenshots/01-login.png) |
| Create account | ![Signup](docs/screenshots/02-signup.png) |
| Home | ![Dashboard](docs/screenshots/03-dashboard.png) |
| Routines | ![Routines](docs/screenshots/04-routines.png) |
| Build a routine | ![Builder](docs/screenshots/05-routine-builder.png) |
| Exercise photos | ![Picker](docs/screenshots/06-exercise-photo-picker.png) |
| Log a session | ![Session](docs/screenshots/08-workout-session.png) |
| Workout history | ![Workouts](docs/screenshots/07-workouts.png) |
| Progress | ![Progress](docs/screenshots/09-progress.png) |
| Reminders | ![Settings](docs/screenshots/10-settings.png) |

### Mobile

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
