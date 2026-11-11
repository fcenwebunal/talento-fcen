-- Students registered from the SIA reports (2026-11-11): the invite carries their program, progress and PAPA, which are
-- applied on the first Google sign-in as verified by the coordination. Shape: {"program": "<programs.slug>",
-- "program_name": "...", "progress_pct": 96.5, "papa": 4.3, "source": "SIA 2026-2S"}.
alter table public.role_invites add column student_data jsonb;

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
  v_data jsonb;
begin
  -- Only Google proves the address (password sign-ups are not confirmed by email), so only Google picks up a registered role
  if v_provider = 'google' then
    select role, student_data into v_invited, v_data from public.role_invites where email = v_email;
    if v_invited is not null then
      v_role := v_invited;
    elsif v_email in (select jsonb_array_elements_text(value) from public.app_settings where key = 'google_admins') then
      v_role := 'admin';
    end if;
  end if;

  -- profiles_role_rows creates the student rows when this insert finishes
  insert into public.profiles (id, email, full_name, role, provider)
  values (new.id, v_email, v_name, v_role, v_provider);

  if v_role = 'student' and v_data is not null then
    update public.students set
      program_id = coalesce((select id from public.programs where slug = v_data ->> 'program'), program_id),
      progress_pct = coalesce((v_data ->> 'progress_pct')::numeric, progress_pct),
      papa = coalesce((v_data ->> 'papa')::numeric, papa),
      progress_verified = 'coordinacion',
      progress_verified_at = now()
    where id = new.id;
  end if;

  if v_invited is not null then
    delete from public.role_invites where email = v_email;
  end if;
  return new;
end;
$$;
