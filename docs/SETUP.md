# Setup

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copy `.env.example` to `.env` and fill those values.

Never commit `.env`.

## 2. Database migrations

Until these run, routines/workouts/progress show a “tables missing” message.

**One-shot (recommended):** open Supabase **SQL Editor**, paste and run:

- [`supabase/000_all.sql`](../supabase/000_all.sql)

**Or run in order:**

1. `supabase/001_init.sql` — routines, days, exercises + RLS  
2. `supabase/002_workouts.sql` — sessions + sets + RLS  
3. `supabase/003_profiles_reminders.sql` — `user_profiles` + signup trigger  
4. `supabase/004_routine_edit_safe.sql` — exercise name snapshot + safe deletes  

See [DATABASE.md](DATABASE.md).

## 3. Auth URL configuration

**Authentication → URL Configuration:**

| Setting | Local value |
|---------|-------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` and `http://localhost:3000/**` |

Optional for local testing: under **Authentication → Providers → Email**, disable **Confirm email** so signup signs you in immediately (avoids email rate limits).

## 4. Run the app

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm start
```

## 5. Screenshots (optional)

With the app running and a confirmed user:

```bash
SCREENSHOT_EMAIL=you@example.com SCREENSHOT_PASSWORD='…' npm run screenshots
```

See [SCREENSHOTS.md](SCREENSHOTS.md).
