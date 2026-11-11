-- Talento FCEN roles (decisions of 2026-11-11): every new account, UNAL or external, starts as «usuario» and only edits
-- its own account; the Facultad may approve a «usuario» as student; administrators assign any role and can register an
-- email with its role before the person signs in with Google.

-- How each account signs in, so administrators can tell a Google-verified address from a typed one
alter table public.profiles add column provider text not null default 'email';
update public.profiles p set provider = coalesce(u.raw_app_meta_data ->> 'provider', 'email')
from auth.users u where u.id = p.id;

-- Emails registered by an administrator: the role applies on the first Google sign-in with that address
create table public.role_invites (
  email text primary key check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  role public.user_role not null check (role <> 'user'),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.role_invites enable row level security;
create policy role_invites_staff_read on public.role_invites for select using (public.is_staff());
create policy role_invites_admin_delete on public.role_invites for delete using (public.is_admin());

-- Every account now starts as «usuario»: the list of Google accounts that entered as students is no longer read
delete from public.app_settings where key = 'google_students';

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
  v_role public.user_role := 'user';
  v_invited public.user_role;
begin
  -- Only Google proves the address (password sign-ups are not confirmed by email), so only Google picks up a registered role
  if v_provider = 'google' then
    select role into v_invited from public.role_invites where email = v_email;
    if v_invited is not null then
      v_role := v_invited;
    elsif v_email in (select jsonb_array_elements_text(value) from public.app_settings where key = 'google_admins') then
      v_role := 'admin';
    end if;
  end if;

  insert into public.profiles (id, email, full_name, role, provider)
  values (new.id, v_email, v_name, v_role, v_provider);

  if v_invited is not null then
    delete from public.role_invites where email = v_email;
  end if;
  return new;
end;
$$;

-- A student always has its profile rows, whoever gives the role and however
create or replace function public.ensure_role_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'student' then
    insert into public.students (id) values (new.id) on conflict (id) do nothing;
    insert into public.student_private (student_id) values (new.id) on conflict (student_id) do nothing;
  end if;
  return null;
end;
$$;

create trigger profiles_role_rows
  after insert or update of role on public.profiles
  for each row execute function public.ensure_role_rows();

-- Who may change a role: administrators any (never their own); the Facultad only «usuario» to student.
-- Scripts with the secret key (no auth.uid()) skip the permission checks but not the last-administrator one.
create or replace function public.guard_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null then
      if old.id = auth.uid() then
        raise exception 'ROLE_SELF: nadie puede cambiar su propio rol';
      end if;
      if not (public.is_admin() or (public.is_staff() and old.role = 'user' and new.role = 'student')) then
        raise exception 'ROLE_FORBIDDEN: solo un administrador puede asignar ese rol';
      end if;
    end if;
    if old.role = 'admin' and not exists (select 1 from public.profiles where role = 'admin' and id <> old.id) then
      raise exception 'ROLE_LAST_ADMIN: debe quedar al menos un administrador';
    end if;
  end if;
  new.email := old.email;
  new.provider := old.provider;
  return new;
end;
$$;

-- Role changes from the app (the Facultad cannot update other profiles directly); guard_profile decides each change
create or replace function public.set_user_role(p_user uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ROLE_FORBIDDEN: solo la Facultad o un administrador gestionan roles';
  end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then
    raise exception 'NOT_FOUND: la cuenta no existe';
  end if;
end;
$$;

-- Register an email with its role: an existing account changes now, a new one gets it on its first Google sign-in
create or replace function public.invite_user(p_email text, p_role public.user_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'ROLE_FORBIDDEN: solo un administrador registra usuarios';
  end if;
  if p_role = 'user' then
    raise exception 'ROLE_INVALID: elige el rol que tendrá la cuenta';
  end if;

  select id into v_id from public.profiles where email = v_email;
  if v_id is not null then
    perform public.set_user_role(v_id, p_role);
    delete from public.role_invites where email = v_email;
    return 'updated';
  end if;

  insert into public.role_invites (email, role, invited_by) values (v_email, p_role, auth.uid())
  on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by, created_at = now();
  return 'invited';
end;
$$;

-- Only accounts that are students now appear to companies (a role change hides the profile, its data stays)
create or replace function public.student_is_listed(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    join public.profiles pr on pr.id = s.id and pr.role = 'student'
    where s.id = p_student
      and s.consent_anonymous
      and s.program_id is not null
      and s.availability in ('disponible', 'en_proceso')
  )
$$;

-- Company access needs the company role: a former company account keeps its membership row but loses the access
create or replace function public.access_level()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_staff() then 2
    when public.my_role() is distinct from 'company' then 0
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid()
        and c.status = 'autorizada'
        and (c.authorized_until is null or c.authorized_until >= current_date)
    ) then 2
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid() and c.status in ('registrada', 'en_revision', 'autorizada')
    ) then 1
    else 0
  end
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
revoke execute on function public.invite_user(text, public.user_role) from public, anon;
revoke execute on function public.ensure_role_rows() from public, anon, authenticated;
