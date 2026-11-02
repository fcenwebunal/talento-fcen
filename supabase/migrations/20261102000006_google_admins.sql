-- Test accounts (2026-11-01): Google sign-in with hd=unal.edu.co sends non-UNAL accounts to the university's SSO,
-- so the personal Gmail becomes a company account and admins are listed by email to get their role on first login.
update public.app_settings set value = '[]' where key = 'google_students';

insert into public.app_settings (key, value, description) values
  ('google_admins', '["judiazgom@unal.edu.co"]', 'Cuentas de Google que entran como administradores desde su primer ingreso')
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
  if v_provider = 'google' and v_email in (select jsonb_array_elements_text(value) from public.app_settings where key = 'google_admins') then
    v_role := 'admin';
  elsif v_provider = 'google' and (
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
