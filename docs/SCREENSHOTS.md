# Screenshots

Product shots live in `docs/screenshots/` and are embedded in the root README.

## Regenerate

1. Apply DB migrations ([SETUP.md](SETUP.md)).
2. Start the app: `npm run dev`.
3. Use a confirmed Supabase user:

```bash
SCREENSHOT_EMAIL=you@example.com \
SCREENSHOT_PASSWORD='your-password' \
npm run screenshots
```

Optional: `SCREENSHOT_BASE_URL=http://localhost:3000` (default).

Credentials are env-only and must never be committed.

## Output files

| File | Screen |
|------|--------|
| `01-login.png` | Login |
| `02-signup.png` | Signup |
| `03-dashboard.png` | Dashboard |
| `04-routines.png` | Routines list |
| `05-routine-builder.png` | New routine |
| `06-exercise-photo-picker.png` | Photo library |
| `07-workouts.png` | Workout history |
| `08-workout-session.png` | Active session |
| `09-progress.png` | Progress |
| `10-settings.png` | Reminders |
| `11-dashboard-mobile.png` | Dashboard (mobile) |
| `12-routine-builder-mobile.png` | Builder (mobile) |

The capture script attempts to save a demo routine when the schema is present so the workout session shot is meaningful.
