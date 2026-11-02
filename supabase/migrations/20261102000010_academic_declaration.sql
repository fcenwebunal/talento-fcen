-- Students declare their PAPA and progress themselves (the Faculty verifies them against the uploaded academic
-- record; in the future both values may come straight from the university systems).

create or replace function public.guard_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_staff() then
    if new.availability is distinct from old.availability then
      insert into public.status_history (entity, entity_id, from_status, to_status, actor)
      values ('student', new.id, old.availability::text, new.availability::text, auth.uid());
    end if;
    return new;
  end if;

  -- The student declares progress and PAPA; any change goes back to «declarado» until the Faculty checks it
  -- against an academic record uploaded within the last semester
  if new.progress_pct is distinct from old.progress_pct or new.papa is distinct from old.papa then
    if (new.progress_pct is not null or new.papa is not null) and not exists (
      select 1 from public.documents d
      where d.student_id = new.id and d.kind = 'historia_academica' and d.created_at > now() - interval '120 days'
    ) then
      raise exception 'HISTORIA_REQUIRED: adjunta tu historia académica (PDF o imagen) para declarar el avance y el PAPA';
    end if;
    new.progress_verified := 'autodeclarado';
    new.progress_verified_at := null;
  else
    new.progress_verified := old.progress_verified;
    new.progress_verified_at := old.progress_verified_at;
  end if;

  if new.availability is distinct from old.availability then
    if new.availability in ('sin_confirmar', 'archivado') then
      raise exception 'Ese estado lo asigna el sistema';
    end if;
    insert into public.status_history (entity, entity_id, from_status, to_status, actor)
    values ('student', new.id, old.availability::text, new.availability::text, auth.uid());
  end if;
  if new.availability = 'disponible'
     and (new.availability is distinct from old.availability or new.last_confirmed_at is distinct from old.last_confirmed_at) then
    new.last_confirmed_at := now();
  end if;

  if new.consent_anonymous is distinct from old.consent_anonymous
     or new.consent_contact is distinct from old.consent_contact then
    new.consent_at := now();
    new.consent_version := (select value #>> '{}' from public.app_settings where key = 'consent_version');
    insert into public.consents (user_id, kind, version, accepted)
    select new.id, k.kind, new.consent_version, k.accepted
    from (values ('student_anonymous', new.consent_anonymous), ('student_contact', new.consent_contact)) as k(kind, accepted);
  end if;
  return new;
end;
$$;
