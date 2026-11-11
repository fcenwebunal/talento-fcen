-- Talento FCEN roles, second round (decisions of 2026-11-11): the Facultad may move a «usuario» to student, company or
-- Facultad (never administrator) and may register emails and edit or remove pending registrations with those same roles;
-- administrators keep every change, including the role of pending registrations. Only administrators change the role
-- of an account that already has one.

create or replace function public.staff_assignable(p_role public.user_role)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_role in ('student', 'company', 'staff')
$$;

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
      if not (public.is_admin() or (public.is_staff() and old.role = 'user' and public.staff_assignable(new.role))) then
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

-- Register an email with its role (or change the role of a pending registration): an existing account changes now,
-- a new one gets it on its first Google sign-in. The Facultad only with its roles and never over an administrator's.
create or replace function public.invite_user(p_email text, p_role public.user_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_admin boolean := public.is_admin();
  v_id uuid;
  v_pending public.user_role;
begin
  if not public.is_staff() then
    raise exception 'ROLE_FORBIDDEN: solo la Facultad o un administrador registran usuarios';
  end if;
  if p_role = 'user' then
    raise exception 'ROLE_INVALID: elige el rol que tendrá la cuenta';
  end if;
  if not v_admin and not public.staff_assignable(p_role) then
    raise exception 'ROLE_FORBIDDEN: solo un administrador puede asignar ese rol';
  end if;

  select id into v_id from public.profiles where email = v_email;
  if v_id is not null then
    perform public.set_user_role(v_id, p_role);
    delete from public.role_invites where email = v_email;
    return 'updated';
  end if;

  select role into v_pending from public.role_invites where email = v_email;
  if v_pending is not null and not v_admin and not public.staff_assignable(v_pending) then
    raise exception 'ROLE_FORBIDDEN: solo un administrador puede cambiar ese registro';
  end if;
  insert into public.role_invites (email, role, invited_by) values (v_email, p_role, auth.uid())
  on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by, created_at = now();
  return case when v_pending is null then 'invited' else 'changed' end;
end;
$$;

drop policy role_invites_admin_delete on public.role_invites;
create policy role_invites_delete on public.role_invites for delete
  using (public.is_admin() or (public.is_staff() and public.staff_assignable(role)));

revoke execute on function public.staff_assignable(public.user_role) from public, anon;
