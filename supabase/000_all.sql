-- Winter Arc - initial schema
-- Run with Supabase SQL editor / migration tooling.

create extension if not exists pgcrypto;

-- Routines
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  is_active boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Ensure each user can have at most one active routine
create unique index if not exists routines_active_per_user
  on public.routines (user_id)
  where is_active = true;

-- Routine days (order matters)
create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day_order integer not null,
  label text not null,
  created_at timestamp with time zone not null default now()
);

-- Routine exercises (targets)
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  exercise_order integer not null,
  exercise_name text not null,
  target_sets integer not null default 3,
  target_reps text not null default '8-12',
  target_weight numeric,
  rest_seconds integer not null default 60,
  notes text,
  created_at timestamp with time zone not null default now()
);

-- Row Level Security
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;

-- Routines policies
create policy "routines: select own"
on public.routines for select
using (user_id = auth.uid());

create policy "routines: insert own"
on public.routines for insert
with check (user_id = auth.uid());

create policy "routines: update own"
on public.routines for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "routines: delete own"
on public.routines for delete
using (user_id = auth.uid());

-- Routine days policies
create policy "routine_days: select own"
on public.routine_days for select
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_days.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days: insert own"
on public.routine_days for insert
with check (
  exists (
    select 1
    from public.routines r
    where r.id = routine_days.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days: update own"
on public.routine_days for update
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_days.routine_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routines r
    where r.id = routine_days.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days: delete own"
on public.routine_days for delete
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_days.routine_id
      and r.user_id = auth.uid()
  )
);

-- Routine exercises policies
create policy "routine_exercises: select own"
on public.routine_exercises for select
using (
  exists (
    select 1
    from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_exercises.routine_day_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_exercises: insert own"
on public.routine_exercises for insert
with check (
  exists (
    select 1
    from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_exercises.routine_day_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_exercises: update own"
on public.routine_exercises for update
using (
  exists (
    select 1
    from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_exercises.routine_day_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_exercises.routine_day_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_exercises: delete own"
on public.routine_exercises for delete
using (
  exists (
    select 1
    from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_exercises.routine_day_id
      and r.user_id = auth.uid()
  )
);

-- Winter Arc - workout tracking schema
-- Run after 001_init.sql

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  routine_id uuid not null references public.routines(id) on delete restrict,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  notes text
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  routine_exercise_id uuid not null references public.routine_exercises(id) on delete restrict,
  set_order integer not null,

  -- planned targets (snapshot-ish, so routine edits don't break history)
  planned_reps text not null,
  planned_weight numeric,

  -- actual logged values
  actual_reps integer,
  actual_weight numeric,
  notes text
);

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

-- workout_sessions policies (scoped by user's routine ownership)
create policy "workout_sessions: select own"
on public.workout_sessions for select
using (
  exists (
    select 1
    from public.routines r
    where r.id = workout_sessions.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sessions: insert own"
on public.workout_sessions for insert
with check (
  exists (
    select 1
    from public.routines r
    where r.id = workout_sessions.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sessions: update own"
on public.workout_sessions for update
using (
  exists (
    select 1
    from public.routines r
    where r.id = workout_sessions.routine_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routines r
    where r.id = workout_sessions.routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sessions: delete own"
on public.workout_sessions for delete
using (
  exists (
    select 1
    from public.routines r
    where r.id = workout_sessions.routine_id
      and r.user_id = auth.uid()
  )
);

-- workout_sets policies (scoped by workout_session -> routine -> user)
create policy "workout_sets: select own"
on public.workout_sets for select
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.routines r on r.id = ws.routine_id
    where ws.id = workout_sets.workout_session_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sets: insert own"
on public.workout_sets for insert
with check (
  exists (
    select 1
    from public.workout_sessions ws
    join public.routines r on r.id = ws.routine_id
    where ws.id = workout_sets.workout_session_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sets: update own"
on public.workout_sets for update
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.routines r on r.id = ws.routine_id
    where ws.id = workout_sets.workout_session_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    join public.routines r on r.id = ws.routine_id
    where ws.id = workout_sets.workout_session_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_sets: delete own"
on public.workout_sets for delete
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.routines r on r.id = ws.routine_id
    where ws.id = workout_sets.workout_session_id
      and r.user_id = auth.uid()
  )
);

-- Winter Arc - user profiles + workout reminders
-- Run after 002_workouts.sql

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  reminder_enabled boolean not null default false,
  reminder_time time not null default '07:00',
  -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
  reminder_days integer[] not null default '{1,2,3,4,5}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.user_profiles enable row level security;

create policy "user_profiles: select own"
on public.user_profiles for select
using (id = auth.uid());

create policy "user_profiles: insert own"
on public.user_profiles for insert
with check (id = auth.uid());

create policy "user_profiles: update own"
on public.user_profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- Winter Arc - allow routine edits without breaking workout history
-- Run after 003_profiles_reminders.sql

-- Snapshot exercise name on each logged set (so history stays readable after routine edits)
alter table public.workout_sets
  add column if not exists exercise_name text;

update public.workout_sets ws
set exercise_name = re.exercise_name
from public.routine_exercises re
where ws.routine_exercise_id = re.id
  and (ws.exercise_name is null or ws.exercise_name = '');

-- Allow deleting routine exercises that still have workout history
alter table public.workout_sets
  alter column routine_exercise_id drop not null;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'workout_sets'
      and constraint_name = 'workout_sets_routine_exercise_id_fkey'
  ) then
    alter table public.workout_sets
      drop constraint workout_sets_routine_exercise_id_fkey;
  end if;
end $$;

alter table public.workout_sets
  add constraint workout_sets_routine_exercise_id_fkey
  foreign key (routine_exercise_id)
  references public.routine_exercises(id)
  on delete set null;
