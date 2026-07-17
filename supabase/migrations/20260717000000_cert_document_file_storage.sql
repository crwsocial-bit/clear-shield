alter table cert_documents
  add column if not exists source_file_path text;

insert into storage.buckets (id, name, public)
values ('cert-documents', 'cert-documents', false)
on conflict (id) do nothing;

create policy "Users upload own cert files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cert-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own cert files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cert-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own cert files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cert-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
