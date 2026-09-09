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

