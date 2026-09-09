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
