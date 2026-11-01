-- Talento FCEN: editable account (photo, bio) for every role, Google sign-in rules and login handoff for the embedded app.

alter table public.profiles
  add column avatar_path text,
  add column bio text check (char_length(bio) <= 600),
  add column position text check (char_length(position) <= 120);

-- Public bucket for account photos: <user_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy avatars_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.storage_owner_uuid(name) = auth.uid());
create policy avatars_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.storage_owner_uuid(name) = auth.uid());
create policy avatars_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (public.storage_owner_uuid(name) = auth.uid() or public.is_staff()));

-- Google accounts: @unal.edu.co and the listed emails are students; any other Google account is a company.
insert into public.app_settings (key, value, description) values
  ('google_students', '["juanmanueldiazgomez247@gmail.com"]', 'Cuentas de Google fuera de @unal.edu.co que entran como estudiantes')
on conflict (key) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
  v_email text := lower(new.email);
  v_role public.user_role;
begin
  if v_provider = 'google' and (
    v_email like '%@unal.edu.co'
    or v_email in (select jsonb_array_elements_text(value) from public.app_settings where key = 'google_students')
  ) then
    v_role := 'student';
  else
    v_role := 'company';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, v_email, v_name, v_role);

  if v_role = 'student' then
    insert into public.students (id) values (new.id);
    insert into public.student_private (student_id) values (new.id);
  end if;

  return new;
end;
$$;

-- Users edit their own name, photo, bio and position
create or replace function public.guard_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  new.email := old.email;
  return new;
end;
$$;

-- One-time login handoff: a popup signs in at top level and the embedded app picks the session up by nonce
create table public.login_handoffs (
  nonce text primary key check (char_length(nonce) >= 32),
  token_hash text,
  created_at timestamptz not null default now()
);
alter table public.login_handoffs enable row level security;
-- No policies: only the server with the secret key reads and writes this table.
