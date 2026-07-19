-- One row per auth user, mirroring the subscriptions table's shape/conventions.
create table if not exists profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table profiles enable row level security;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function touch_subscriptions_updated_at();

-- SECURITY DEFINER so RLS policies can check admin status without recursing
-- into profiles' own RLS (which would deadlock/reject the check).
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where user_id = uid), false)
$$;

create policy "Users read own profile, admins read all"
  on profiles for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- No insert/update/delete policies for authenticated users — profile writes
-- only ever happen via the signup trigger and the admin-update-user edge
-- function, both running as service role.

-- Admins additionally need to read every user's subscription row for the
-- admin dashboard. This is additive to the existing "Users read own
-- subscription" policy (Postgres OR's same-command policies together).
create policy "Admins read all subscriptions"
  on subscriptions for select
  to authenticated
  using (public.is_admin(auth.uid()));

create or replace function handle_new_user_profile()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, is_admin)
  values (new.id, new.email, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function handle_new_user_profile();

-- Backfill existing accounts that predate this migration.
insert into public.profiles (user_id, email, is_admin)
select id, email, false from auth.users
on conflict (user_id) do nothing;

-- Seed the ClearShield admin account.
update public.profiles set is_admin = true where email = 'crwsocial@gmail.com';
