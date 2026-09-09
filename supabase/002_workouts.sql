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

