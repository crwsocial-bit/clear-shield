-- ClearShield migration v3: audit_lists and audit_list_items
-- Run in Supabase SQL editor

create table if not exists audit_lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table audit_lists enable row level security;

drop policy if exists "Users manage own audit_lists" on audit_lists;
create policy "Users manage own audit_lists"
  on audit_lists for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists audit_list_items (
  id            uuid primary key default gen_random_uuid(),
  audit_list_id uuid not null references audit_lists(id) on delete cascade,
  entity_type   text not null,
  entity_id     uuid not null,
  label         text,      -- sku for products, name for companies
  sublabel      text,      -- description for products, type for companies
  created_at    timestamptz not null default now(),
  constraint audit_list_items_entity_type_check
    check (entity_type in ('product', 'company')),
  constraint audit_list_items_unique
    unique (audit_list_id, entity_type, entity_id)
);

alter table audit_list_items enable row level security;

drop policy if exists "Users manage own audit_list_items" on audit_list_items;
create policy "Users manage own audit_list_items"
  on audit_list_items for all
  to authenticated
  using (
    exists (
      select 1 from audit_lists
      where id = audit_list_items.audit_list_id
        and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from audit_lists
      where id = audit_list_items.audit_list_id
        and user_id = auth.uid()
    )
  );
