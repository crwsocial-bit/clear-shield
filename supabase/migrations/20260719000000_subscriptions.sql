-- ClearShield has no self-serve free tier. Every new signup gets a 'free'
-- subscription row with sku_limit = 0 so SKU-limit enforcement has a row to
-- check against before the user completes Stripe checkout for a paid plan.
create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text not null default 'free'
                            check (plan in ('free', 'starter', 'pro', 'enterprise')),
  status                 text not null default 'active'
                            check (status in ('active', 'canceled', 'past_due')),
  current_period_end     timestamptz,
  sku_limit              integer,  -- null = unlimited
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id)
);

create unique index if not exists subscriptions_stripe_customer_id_idx
  on subscriptions (stripe_customer_id) where stripe_customer_id is not null;

alter table subscriptions enable row level security;

-- Reads scoped to the owning user. Writes are never performed by
-- authenticated clients — only the signup trigger and the Stripe webhook
-- (both running as service role) ever insert/update this table.
create policy "Users read own subscription"
  on subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function touch_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function touch_subscriptions_updated_at();

create or replace function handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status, sku_limit)
  values (new.id, 'free', 'active', 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function handle_new_user_subscription();

-- Backfill existing accounts that predate this migration.
insert into public.subscriptions (user_id, plan, status, sku_limit)
select id, 'free', 'active', 0 from auth.users
on conflict (user_id) do nothing;
