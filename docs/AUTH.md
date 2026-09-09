# Auth

Winter Arc uses Supabase Auth with email/password and the App Router.

## Flow

1. **Signup** (`/signup`) — `signUp` with `emailRedirectTo` pointing at `/auth/callback`.
2. **Email confirm** (if enabled) — user lands on `/auth/callback` (or `/` with `?code=`), which exchanges the PKCE code for a session.
3. **Login** (`/login`) — `signInWithPassword`; on success → `/dashboard`.
4. **Middleware** (`src/middleware.ts`) — refreshes the auth cookie on matched routes.
5. **Logout** — client `signOut`, then redirect home/login.

## Key files

| File | Role |
|------|------|
| `src/lib/supabase/browser.ts` | Browser client (`createBrowserClient`); returns `null` if env missing |
| `src/lib/supabase/server.ts` | Server client with Next cookies |
| `src/app/auth/callback/route.ts` | OAuth/email code exchange |
| `src/app/page.tsx` | Forwards stray `?code=` / auth errors to callback |
| `src/middleware.ts` | Session refresh |

## Redirect URLs

Configure in Supabase:

- Site URL: `http://localhost:3000` (or your production origin)
- Redirect allow list: `/auth/callback` and `/**` under that origin

## Local tip

If signup hits `over_email_send_rate_limit`, either wait, use an existing confirmed user, or temporarily disable **Confirm email** in the Supabase dashboard.
