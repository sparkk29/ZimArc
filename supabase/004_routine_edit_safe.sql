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
