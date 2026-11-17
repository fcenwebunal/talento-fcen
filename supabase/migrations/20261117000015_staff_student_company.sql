-- Talento FCEN roles, third round (decision of 2026-11-17): the Facultad only moves a «usuario» to student or company and
-- only registers emails with those roles; the Facultad and administrator roles are given only by administrators.
-- guard_profile, invite_user and the role_invites_delete policy read this function, so they follow without changes.

create or replace function public.staff_assignable(p_role public.user_role)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_role in ('student', 'company')
$$;

revoke execute on function public.staff_assignable(public.user_role) from public, anon;
