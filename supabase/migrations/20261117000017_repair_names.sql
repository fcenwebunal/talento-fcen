-- Some UNAL Google accounts arrive with a broken name from the university directory («Miï¿½o» for «Miño»).
-- repair_name undoes UTF-8 read as Latin-1 («MuÃ±oz») and fills the lost letters from a reference name (the SIA name of the
-- registration), keeping the casing of the Google name. Without a usable reference the name is returned as it came.
create or replace function public.repair_name(p_name text, p_reference text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text := p_name;
  v_ref text;
  v_pattern text;
  v_match text[];
  v_pos int;
  v_prev text;
  i int;
begin
  if v is null then
    return null;
  end if;
  if v ~ 'Ã' then
    begin
      v := convert_from(convert_to(v, 'LATIN1'), 'UTF8');
    exception when others then
      v := p_name;
    end;
  end if;
  v := replace(v, 'ï¿½', U&'\FFFD');
  if strpos(v, U&'\FFFD') = 0 or p_reference is null then
    return v;
  end if;

  -- SIA names come in capitals and usually without accents: compare without vowel accents but keep Ñ
  v_ref := translate(p_reference, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu');
  v_pattern := translate(v, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu');
  v_pattern := regexp_replace(v_pattern, '([.^$*+?()\[\]{}|\])', '\\1', 'g');
  v_pattern := regexp_replace(v_pattern, '\s+', '\s+', 'g');
  v_pattern := replace(v_pattern, U&'\FFFD', '(.)');
  v_match := regexp_match(v_ref, '^\s*' || v_pattern || '\s*$', 'i');
  if v_match is null then
    return v;
  end if;

  for i in 1 .. array_length(v_match, 1) loop
    v_pos := strpos(v, U&'\FFFD');
    v_prev := case when v_pos > 1 then substr(v, v_pos - 1, 1) else '' end;
    v := overlay(v placing case when v_prev <> upper(v_prev) then lower(v_match[i]) else upper(v_match[i]) end from v_pos for 1);
  end loop;
  return v;
end;
$$;

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

  v_name := public.repair_name(v_name, v_data ->> 'name');

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

revoke execute on function public.repair_name(text, text) from public, anon, authenticated;
