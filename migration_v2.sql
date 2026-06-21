-- ClearShield migration v2: cert_documents table
-- Run in Supabase SQL editor

create table if not exists cert_documents (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  user_id          uuid not null,
  document_type    text not null default 'third_party_certificate',
  issuing_body     text,
  cert_number      text,
  cert_scope       text,
  cert_issued_date date,
  cert_expiration  date,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint cert_documents_document_type_check check (
    document_type in (
      'third_party_certificate',
      'manufacturer_self_certification',
      'mill_test_report',
      'other'
    )
  ),
  constraint cert_documents_issuing_body_check check (
    issuing_body is null
    or issuing_body in ('NSF', 'IAPMO', 'CSA_Group', 'UL', 'Bureau_Veritas', 'other')
  ),
  -- allows upsert on (product_id, cert_number) from CSV import
  -- NULLs are treated as distinct so multiple null-cert-number docs per product are fine
  constraint cert_documents_product_cert_uniq unique (product_id, cert_number)
);

alter table cert_documents enable row level security;

create policy "Users manage own cert_documents"
  on cert_documents for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Migrate existing flat cert data from products into cert_documents.
-- Defaults to third_party_certificate; normalizes issuing_body free text to enum.
-- Rows where cert_number is null/empty are skipped (no document to migrate).
insert into cert_documents (
  product_id, user_id, document_type,
  issuing_body, cert_number, cert_scope, cert_issued_date, cert_expiration
)
select
  id,
  user_id,
  'third_party_certificate',
  case
    when trim(coalesce(issuing_body, '')) ilike 'nsf%'                               then 'NSF'
    when trim(coalesce(issuing_body, '')) ilike 'iapmo%'                              then 'IAPMO'
    when trim(coalesce(issuing_body, '')) ilike 'csa%'                               then 'CSA_Group'
    when trim(coalesce(issuing_body, '')) ilike 'ul%'
      or trim(coalesce(issuing_body, '')) ilike 'underwriter%'                       then 'UL'
    when trim(coalesce(issuing_body, '')) ilike 'bureau%'                             then 'Bureau_Veritas'
    when issuing_body is not null and trim(issuing_body) != ''                        then 'other'
    else null   -- null = unknown issuing body; distinct from self-cert by document_type
  end,
  nullif(trim(coalesce(cert_number, '')),  ''),
  nullif(trim(coalesce(cert_scope,  '')),  ''),
  cert_issued_date,
  cert_expiration
from products
where cert_number is not null and trim(cert_number) != ''
on conflict (product_id, cert_number) do nothing;
