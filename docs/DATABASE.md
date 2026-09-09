# Database

Winter Arc uses Supabase Postgres with Row Level Security (RLS). Every user only reads/writes their own rows.

## Migration files

| File | Purpose |
|------|---------|
| `000_all.sql` | Concatenation of 001–004 for a single paste |
| `001_init.sql` | `routines`, `routine_days`, `routine_exercises` |
| `002_workouts.sql` | `workout_sessions`, `workout_sets` |
| `003_profiles_reminders.sql` | `user_profiles` + `handle_new_user` trigger |
| `004_routine_edit_safe.sql` | `workout_sets.exercise_name`; FK on delete set null |

## Entity overview

```
auth.users
    └── user_profiles (1:1)
    └── routines (1:n)
            └── routine_days (1:n)
                    └── routine_exercises (1:n)
    └── workout_sessions (1:n, references routines)
            └── workout_sets (1:n, optional FK to routine_exercises)
```

### Routines

- At most one `is_active = true` routine per user (partial unique index).
- Days ordered by `day_order`; exercises by `exercise_order`.

### Workouts

- Starting a workout creates a `workout_sessions` row from the active routine.
- Sets store planned + actual reps/weight.
- `exercise_name` on sets keeps history readable after routine edits.

### Profiles / reminders

- Profile row is created on signup (trigger) or lazily from the settings page.
- Reminder fields: `reminder_enabled`, `reminder_time`, `reminder_days` (0=Sun … 6=Sat).

## Verifying schema

In SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by 1;
```

You should see: `routines`, `routine_days`, `routine_exercises`, `user_profiles`, `workout_sessions`, `workout_sets`.
