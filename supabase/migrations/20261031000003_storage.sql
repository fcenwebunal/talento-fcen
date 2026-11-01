-- Talento FCEN: file storage.
-- documentos (private): <student_uid>/<kind>/<file>. Owner and staff; authorized companies only the CV and photo
-- of students who consented to share contact data.
-- logos (public): <company_id>/<file>, written by members of that company.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documentos', 'documentos', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('logos', 'logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

create or replace function public.storage_owner_uuid(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end
$$;

create policy documentos_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and public.storage_owner_uuid(name) = auth.uid());

create policy documentos_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'documentos' and public.storage_owner_uuid(name) = auth.uid());

create policy documentos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (public.storage_owner_uuid(name) = auth.uid() or public.is_staff()));

create policy documentos_read on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos' and (
      public.storage_owner_uuid(name) = auth.uid()
      or public.is_staff()
      or (split_part(name, '/', 2) in ('hoja_vida', 'foto')
          and public.student_contact_visible(public.storage_owner_uuid(name)))
    )
  );

create policy logos_company_write on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.storage_owner_uuid(name) = public.my_company_id());

create policy logos_company_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.storage_owner_uuid(name) = public.my_company_id());

create policy logos_company_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (public.storage_owner_uuid(name) = public.my_company_id() or public.is_staff()));
