-- Authorized companies record their own CV downloads.
create policy contact_events_insert on public.contact_events for insert to authenticated
  with check (
    company_id = public.my_company_id()
    and user_id = auth.uid()
    and public.access_level() = 2
    and kind = 'download_cv'
  );
