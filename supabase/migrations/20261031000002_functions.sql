-- Talento FCEN: search by visibility level, exports, company registration, public stats and daily maintenance.

-- A student appears to companies when they consented, have a program and are looking for a practice
create or replace function public.student_is_listed(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student
      and s.consent_anonymous
      and s.program_id is not null
      and s.availability in ('disponible', 'en_proceso')
  )
$$;

create or replace function public.student_contact_visible(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.access_level() = 2 and exists (
    select 1 from public.students s
    where s.id = p_student and s.consent_contact and public.student_is_listed(s.id)
  )
$$;

-- Search core. Filters (jsonb): q, program_ids[], levels[], skill_ids[], require_all_skills, min_skill_level,
-- area_ids[], modality, city, language, include_unlisted (staff only), limit, offset.
-- p_max caps the page size: 100 for interactive search, the export limit for exports.
create type public.student_search_row as (
  student_id uuid,
  program_name text,
  program_level public.program_level,
  academic_status public.academic_status,
  progress_pct numeric,
  progress_verified text,
  headline text,
  about text,
  city text,
  modalities text[],
  dedication text,
  practice_period text,
  available_from date,
  available_until date,
  availability public.availability_status,
  last_confirmed_at timestamptz,
  skills jsonb,
  languages jsonb,
  areas jsonb,
  match_count integer,
  contact_visible boolean,
  full_name text,
  email text,
  phone text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  total_count bigint
);

create or replace function public._search_students(p_filters jsonb, p_max integer)
returns setof public.student_search_row
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_level integer := public.access_level();
  v_staff boolean := public.is_staff();
  v_q text := nullif(trim(p_filters ->> 'q'), '');
  v_programs smallint[] := array(select jsonb_array_elements_text(coalesce(p_filters -> 'program_ids', '[]'))::smallint);
  v_levels public.program_level[] := array(select jsonb_array_elements_text(coalesce(p_filters -> 'levels', '[]'))::public.program_level);
  v_skills integer[] := array(select jsonb_array_elements_text(coalesce(p_filters -> 'skill_ids', '[]'))::integer);
  v_areas smallint[] := array(select jsonb_array_elements_text(coalesce(p_filters -> 'area_ids', '[]'))::smallint);
  v_require_all boolean := coalesce((p_filters ->> 'require_all_skills')::boolean, false);
  v_min_level smallint := coalesce((p_filters ->> 'min_skill_level')::smallint, 1);
  v_modality text := nullif(p_filters ->> 'modality', '');
  v_city text := nullif(trim(p_filters ->> 'city'), '');
  v_language text := nullif(trim(p_filters ->> 'language'), '');
  v_unlisted boolean := v_staff and coalesce((p_filters ->> 'include_unlisted')::boolean, false);
  v_limit integer := least(coalesce((p_filters ->> 'limit')::integer, 24), p_max);
  v_offset integer := greatest(coalesce((p_filters ->> 'offset')::integer, 0), 0);
begin
  if v_level < 1 then
    raise exception 'ACCESS_DENIED: se requiere una empresa registrada';
  end if;

  return query
  with base as (
    select s.*, p.name as p_name, p.level as p_level,
      (select count(*)::integer from public.student_skills ss
        where ss.student_id = s.id and ss.skill_id = any (v_skills) and ss.level >= v_min_level) as m_count
    from public.students s
    join public.programs p on p.id = s.program_id
    where (v_unlisted or public.student_is_listed(s.id))
      and (cardinality(v_programs) = 0 or s.program_id = any (v_programs))
      and (cardinality(v_levels) = 0 or p.level = any (v_levels))
      and (v_modality is null or v_modality = any (s.modalities))
      and (v_city is null or extensions.unaccent(lower(coalesce(s.city, '') || ' ' || coalesce(s.practice_cities, '')))
           like '%' || extensions.unaccent(lower(v_city)) || '%')
      and (cardinality(v_areas) = 0 or exists (
        select 1 from public.student_areas sa where sa.student_id = s.id and sa.area_id = any (v_areas)))
      and (v_language is null or exists (
        select 1 from public.student_languages sl where sl.student_id = s.id
          and extensions.unaccent(lower(sl.language)) = extensions.unaccent(lower(v_language))))
      and (v_q is null or extensions.unaccent(lower(
            coalesce(s.headline, '') || ' ' || coalesce(s.about, '') || ' ' || coalesce(s.emphasis, '') || ' ' ||
            coalesce((select string_agg(k.name, ' ') from public.student_skills ss2
                      join public.skills k on k.id = ss2.skill_id where ss2.student_id = s.id), '')
          )) like '%' || extensions.unaccent(lower(v_q)) || '%')
  ),
  filtered as (
    select * from base b
    where cardinality(v_skills) = 0
       or (v_require_all and b.m_count = cardinality(v_skills))
       or (not v_require_all and b.m_count >= 1)
  )
  select
    f.id,
    f.p_name,
    f.p_level,
    f.academic_status,
    f.progress_pct,
    f.progress_verified,
    f.headline,
    f.about,
    f.city,
    f.modalities,
    f.dedication,
    f.practice_period,
    f.available_from,
    f.available_until,
    f.availability,
    f.last_confirmed_at,
    coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'name', k.name, 'level', ss.level) order by ss.level desc, k.name)
      from public.student_skills ss join public.skills k on k.id = ss.skill_id where ss.student_id = f.id), '[]'),
    coalesce((select jsonb_agg(jsonb_build_object('language', sl.language, 'level', sl.level) order by sl.language)
      from public.student_languages sl where sl.student_id = f.id), '[]'),
    coalesce((select jsonb_agg(a.name order by a.sort)
      from public.student_areas sa join public.areas a on a.id = sa.area_id where sa.student_id = f.id), '[]'),
    f.m_count,
    (v_staff or (v_level = 2 and f.consent_contact)),
    case when v_staff or (v_level = 2 and f.consent_contact) then pr.full_name end,
    case when v_staff or (v_level = 2 and f.consent_contact) then pr.email end,
    case when v_staff or (v_level = 2 and f.consent_contact) then sp.phone end,
    case when v_staff or (v_level = 2 and f.consent_contact) then f.linkedin_url end,
    case when v_staff or (v_level = 2 and f.consent_contact) then f.github_url end,
    case when v_staff or (v_level = 2 and f.consent_contact) then f.portfolio_url end,
    count(*) over ()
  from filtered f
  join public.profiles pr on pr.id = f.id
  left join public.student_private sp on sp.student_id = f.id
  order by f.m_count desc, f.last_confirmed_at desc nulls last
  limit v_limit offset v_offset;
end;
$$;

create or replace function public.search_students(p_filters jsonb default '{}')
returns setof public.student_search_row
language sql
stable
security definer
set search_path = ''
as $$
  select * from public._search_students(p_filters, 100)
$$;

-- Detail of one student at the caller's level
create or replace function public.get_student_detail(p_student uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level integer := public.access_level();
  v_staff boolean := public.is_staff();
  v_contact boolean;
  v_result jsonb;
begin
  if not v_staff and p_student <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
    if v_level < 1 or not public.student_is_listed(p_student) then
      raise exception 'ACCESS_DENIED';
    end if;
  end if;

  select v_staff or p_student = auth.uid() or (v_level = 2 and s.consent_contact)
  into v_contact
  from public.students s where s.id = p_student;

  select jsonb_build_object(
    'id', s.id,
    'program', p.name,
    'program_level', p.level,
    'academic_status', s.academic_status,
    'progress_pct', s.progress_pct,
    'progress_verified', s.progress_verified,
    'emphasis', s.emphasis,
    'honors', s.honors,
    'headline', s.headline,
    'about', s.about,
    'motivation', s.motivation,
    'city', s.city,
    'modalities', s.modalities,
    'dedication', s.dedication,
    'can_relocate', s.can_relocate,
    'practice_cities', s.practice_cities,
    'practice_period', s.practice_period,
    'available_from', s.available_from,
    'available_until', s.available_until,
    'duration_months', s.duration_months,
    'availability', s.availability,
    'last_confirmed_at', s.last_confirmed_at,
    'skills', coalesce((select jsonb_agg(jsonb_build_object('name', k.name, 'domain', d.name, 'level', ss.level,
        'evidence_url', case when v_contact then ss.evidence_url end) order by ss.level desc, k.name)
      from public.student_skills ss join public.skills k on k.id = ss.skill_id
      join public.skill_domains d on d.id = k.domain_id where ss.student_id = s.id), '[]'),
    'soft_skills', coalesce((select jsonb_agg(x.name order by x.sort)
      from public.student_soft_skills sx join public.soft_skills x on x.id = sx.soft_skill_id where sx.student_id = s.id), '[]'),
    'areas', coalesce((select jsonb_agg(a.name order by a.sort)
      from public.student_areas sa join public.areas a on a.id = sa.area_id where sa.student_id = s.id), '[]'),
    'languages', coalesce((select jsonb_agg(jsonb_build_object('language', l.language, 'level', l.level, 'certificate', l.certificate))
      from public.student_languages l where l.student_id = s.id), '[]'),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'reason', r.reason))
      from public.relevant_subjects r where r.student_id = s.id), '[]'),
    'experiences', coalesce((select jsonb_agg(jsonb_build_object('organization', e.organization, 'role', e.role,
        'start_date', e.start_date, 'end_date', e.end_date, 'description', e.description) order by e.start_date desc nulls last)
      from public.experiences e where e.student_id = s.id), '[]'),
    'projects', coalesce((select jsonb_agg(jsonb_build_object('title', pj.title, 'year', pj.year, 'description', pj.description,
        'url', case when v_contact then pj.url end) order by pj.year desc nulls last)
      from public.projects pj where pj.student_id = s.id), '[]'),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'institution', c.institution, 'year', c.year, 'hours', c.hours))
      from public.courses c where c.student_id = s.id), '[]'),
    'contact_visible', v_contact,
    'contact', case when v_contact then jsonb_build_object(
        'full_name', pr.full_name, 'email', pr.email, 'phone', sp.phone,
        'linkedin_url', s.linkedin_url, 'github_url', s.github_url, 'portfolio_url', s.portfolio_url,
        'cv_path', (select d2.path from public.documents d2 where d2.student_id = s.id and d2.kind = 'hoja_vida'
                    order by d2.created_at desc limit 1)
      ) end
  )
  into v_result
  from public.students s
  join public.profiles pr on pr.id = s.id
  left join public.programs p on p.id = s.program_id
  left join public.student_private sp on sp.student_id = s.id
  where s.id = p_student;

  if v_contact and not v_staff and p_student <> auth.uid() then
    insert into public.contact_events (company_id, user_id, student_id, kind)
    values (public.my_company_id(), auth.uid(), p_student, 'view_contact');
  end if;

  return v_result;
end;
$$;

-- Export for authorized companies: logged, limited and without sensitive data
create or replace function public.export_students(p_filters jsonb default '{}')
returns table (
  nombre text,
  correo text,
  programa text,
  nivel text,
  avance numeric,
  habilidades text,
  idiomas text,
  disponibilidad text,
  periodo text,
  modalidades text,
  ciudad text,
  linkedin text,
  github text,
  portafolio text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
  v_staff boolean := public.is_staff();
  v_max integer := public.setting_int('export_max_rows');
  v_today integer;
  v_count integer;
begin
  if public.access_level() < 2 then
    raise exception 'ACCESS_DENIED: solo empresas autorizadas';
  end if;

  if not v_staff then
    select count(*) into v_today from public.exports_log
    where company_id = v_company and created_at >= date_trunc('day', now());
    if v_today >= public.setting_int('export_max_per_day') then
      raise exception 'EXPORT_LIMIT: alcanzó el máximo de exportaciones de hoy';
    end if;
  end if;

  return query
  select r.full_name, r.email, r.program_name, r.program_level::text, r.progress_pct,
    (select string_agg(x ->> 'name' || ' (' || (array['básico', 'intermedio', 'avanzado'])[(x ->> 'level')::integer] || ')', '; ')
       from jsonb_array_elements(r.skills) x),
    (select string_agg((x ->> 'language') || ' ' || (x ->> 'level'), '; ') from jsonb_array_elements(r.languages) x),
    r.availability::text, r.practice_period, array_to_string(r.modalities, ', '), r.city,
    r.linkedin_url, r.github_url, r.portfolio_url
  from public._search_students((p_filters - 'limit' - 'offset') || jsonb_build_object('limit', v_max, 'offset', 0), v_max) r
  where r.contact_visible;

  get diagnostics v_count = row_count;

  insert into public.exports_log (company_id, user_id, filters, row_count)
  values (v_company, auth.uid(), p_filters, v_count);
end;
$$;

-- Company registration by the signed-in company user
create or replace function public.register_company(p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if public.my_role() <> 'company' then
    raise exception 'ACCESS_DENIED: la cuenta no es de empresa';
  end if;
  if public.my_company_id() is not null then
    raise exception 'ALREADY_MEMBER: la cuenta ya pertenece a una empresa';
  end if;
  if coalesce((p_data ->> 'terms_accepted')::boolean, false) is not true then
    raise exception 'TERMS_REQUIRED';
  end if;

  insert into public.companies (nit, name, sector, size, city, website, description, is_public_entity,
                                terms_version, terms_accepted_at)
  values (
    regexp_replace(p_data ->> 'nit', '[^0-9-]', '', 'g'),
    trim(p_data ->> 'name'),
    p_data ->> 'sector',
    nullif(p_data ->> 'size', ''),
    p_data ->> 'city',
    p_data ->> 'website',
    p_data ->> 'description',
    coalesce((p_data ->> 'is_public_entity')::boolean, false),
    (select value #>> '{}' from public.app_settings where key = 'consent_version'),
    now()
  )
  returning id into v_id;

  insert into public.company_members (user_id, company_id, member_role, contact_name, position, phone)
  values (auth.uid(), v_id, 'owner', p_data ->> 'contact_name', p_data ->> 'position', p_data ->> 'phone');

  update public.profiles set full_name = coalesce(p_data ->> 'contact_name', full_name) where id = auth.uid();

  insert into public.consents (user_id, kind, version, accepted)
  values (auth.uid(), 'company_terms', (select value #>> '{}' from public.app_settings where key = 'consent_version'), true);

  return v_id;
end;
$$;

create or replace function public.request_company_authorization()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
begin
  if v_company is null then
    raise exception 'NO_COMPANY';
  end if;
  update public.companies set status = 'en_revision'
  where id = v_company and status in ('registrada', 'rechazada');
  insert into public.status_history (entity, entity_id, from_status, to_status, actor)
  values ('company', v_company, 'registrada', 'en_revision', auth.uid());
end;
$$;

create or replace function public.set_company_status(p_company uuid, p_status public.company_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ACCESS_DENIED';
  end if;
  update public.companies set
    status = p_status,
    review_note = p_note,
    authorized_at = case when p_status = 'autorizada' then now() else authorized_at end,
    authorized_until = case when p_status = 'autorizada'
      then (current_date + make_interval(months => public.setting_int('authorization_months')))::date
      else authorized_until end,
    authorized_by = case when p_status = 'autorizada' then auth.uid() else authorized_by end
  where id = p_company;
end;
$$;

-- One-click confirmation of availability
create or replace function public.confirm_availability()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
begin
  update public.students
  set availability = 'disponible', last_confirmed_at = v_now
  where id = auth.uid() and availability in ('disponible', 'en_proceso', 'sin_confirmar', 'no_disponible');
  return v_now;
end;
$$;

-- Aggregated public figures (no personal data)
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'students_listed', (select count(*) from public.students s where public.student_is_listed(s.id)),
    'companies_authorized', (select count(*) from public.companies where status = 'autorizada'),
    'by_program', coalesce((
      select jsonb_agg(jsonb_build_object('program', x.name, 'count', x.n) order by x.n desc)
      from (select p.name, count(*) as n from public.students s join public.programs p on p.id = s.program_id
            where public.student_is_listed(s.id) group by p.name) x), '[]'),
    'top_skills', coalesce((
      select jsonb_agg(jsonb_build_object('skill', x.name, 'count', x.n) order by x.n desc)
      from (select k.name, count(*) as n from public.student_skills ss join public.skills k on k.id = ss.skill_id
            where public.student_is_listed(ss.student_id) group by k.name order by n desc limit 15) x), '[]')
  )
$$;

-- Daily maintenance: inactivation rules from plan-beta.md, section 4
create or replace function public.run_daily_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := public.setting_int('availability_days');
  v_months integer := public.setting_int('graduate_months');
  v_unconfirmed integer;
  v_window integer;
  v_practice integer;
  v_archived integer;
  v_companies integer;
begin
  with changed as (
    update public.students set availability = 'sin_confirmar'
    where availability in ('disponible', 'en_proceso')
      and (last_confirmed_at is null or last_confirmed_at < now() - make_interval(days => v_days))
    returning id
  )
  select count(*) into v_unconfirmed from changed;

  with changed as (
    update public.students set availability = 'no_disponible'
    where availability in ('disponible', 'en_proceso', 'sin_confirmar')
      and available_until is not null and available_until < current_date
    returning id
  )
  select count(*) into v_window from changed;

  with changed as (
    update public.students set availability = 'sin_confirmar'
    where availability = 'en_practica' and practice_end_date is not null and practice_end_date < current_date
    returning id
  )
  select count(*) into v_practice from changed;

  with changed as (
    update public.students set availability = 'archivado'
    where academic_status = 'egresado' and availability <> 'archivado'
      and graduation_date is not null and graduation_date < current_date - make_interval(months => v_months)
    returning id
  )
  select count(*) into v_archived from changed;

  with changed as (
    update public.companies set status = 'registrada', review_note = 'Autorización vencida'
    where status = 'autorizada' and authorized_until is not null and authorized_until < current_date
    returning id
  )
  select count(*) into v_companies from changed;

  return jsonb_build_object('unconfirmed', v_unconfirmed, 'window_ended', v_window, 'practice_ended', v_practice,
                            'archived', v_archived, 'companies_expired', v_companies);
end;
$$;

-- Permissions on functions
revoke execute on function public.run_daily_maintenance() from public, anon, authenticated;
revoke execute on function public.set_company_status(uuid, public.company_status, text) from public, anon;
revoke execute on function public._search_students(jsonb, integer) from public, anon, authenticated;
revoke execute on function public.search_students(jsonb) from public, anon;
revoke execute on function public.student_is_listed(uuid) from public, anon;
revoke execute on function public.student_contact_visible(uuid) from public, anon;
revoke execute on function public.get_student_detail(uuid) from public, anon;
revoke execute on function public.export_students(jsonb) from public, anon;
revoke execute on function public.register_company(jsonb) from public, anon;
revoke execute on function public.request_company_authorization() from public, anon;
revoke execute on function public.confirm_availability() from public, anon;
grant execute on function public.public_stats() to anon, authenticated;

-- Schedule: every day at 06:00 Colombia time (11:00 UTC)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('talento-daily-maintenance', '0 11 * * *', $$select public.run_daily_maintenance()$$);
