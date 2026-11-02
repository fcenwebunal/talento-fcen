-- Skills get a description and an SVG icon; students can propose skills inside a group. A proposal is usable at
-- once on the proposer's profile (marked as pending) and joins the catalog and suggestions only after staff approve it.
create type public.skill_status as enum ('approved', 'pending');

alter table public.skills
  add column icon_path text,
  add column status public.skill_status not null default 'approved',
  add column proposed_by uuid references public.profiles (id) on delete set null,
  add column created_at timestamptz not null default now();

create unique index skills_name_ci_idx on public.skills (lower(name));
create index skills_pending_idx on public.skills (status) where status = 'pending';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skill-icons', 'skill-icons', true, 262144, array['image/svg+xml', 'image/png', 'image/webp']);

create policy skill_icons_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'skill-icons' and public.is_staff());
create policy skill_icons_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'skill-icons' and public.is_staff());
create policy skill_icons_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'skill-icons' and public.is_staff());

-- Returns the id of an existing skill with that name or alias, or of the new pending proposal
create or replace function public.propose_skill(p_name text, p_domain smallint, p_description text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_id integer;
begin
  if public.my_role() <> 'student' then
    raise exception 'ACCESS_DENIED: solo los estudiantes proponen habilidades';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'INVALID: el nombre debe tener entre 2 y 60 caracteres';
  end if;
  if not exists (select 1 from public.skill_domains where id = p_domain) then
    raise exception 'INVALID: elija un grupo';
  end if;

  select s.id into v_id from public.skills s
  where lower(s.name) = lower(v_name) or exists (select 1 from unnest(s.aliases) a where lower(a) = lower(v_name))
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  if (select count(*) from public.skills where proposed_by = auth.uid() and status = 'pending') >= 5 then
    raise exception 'LIMIT: ya tiene 5 habilidades propuestas en revisión';
  end if;

  insert into public.skills (domain_id, name, description, status, proposed_by)
  values (p_domain, v_name, nullif(left(trim(coalesce(p_description, '')), 280), ''), 'pending', auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- approve (optionally correcting name, group and description), merge into an existing skill, or reject
create or replace function public.review_skill(
  p_skill integer,
  p_action text,
  p_name text default null,
  p_domain smallint default null,
  p_description text default null,
  p_target integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ACCESS_DENIED: solo la Facultad revisa habilidades';
  end if;
  if not exists (select 1 from public.skills where id = p_skill and status = 'pending') then
    raise exception 'NOT_FOUND: la propuesta ya no está pendiente';
  end if;

  if p_action = 'approve' then
    update public.skills set
      name = coalesce(nullif(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), ''), name),
      domain_id = coalesce(p_domain, domain_id),
      description = coalesce(nullif(trim(coalesce(p_description, '')), ''), description),
      status = 'approved'
    where id = p_skill;
  elsif p_action = 'merge' then
    if p_target is null or p_target = p_skill or not exists (select 1 from public.skills where id = p_target and status = 'approved') then
      raise exception 'INVALID: elija una habilidad aprobada para unir';
    end if;
    update public.student_skills ss set skill_id = p_target
    where ss.skill_id = p_skill
      and not exists (select 1 from public.student_skills x where x.student_id = ss.student_id and x.skill_id = p_target);
    delete from public.student_skills where skill_id = p_skill;
    delete from public.skills where id = p_skill;
  elsif p_action = 'reject' then
    delete from public.student_skills where skill_id = p_skill;
    delete from public.skills where id = p_skill;
  else
    raise exception 'INVALID: acción desconocida';
  end if;
end;
$$;

revoke execute on function public.propose_skill(text, smallint, text) from public, anon;
grant execute on function public.propose_skill(text, smallint, text) to authenticated;
revoke execute on function public.review_skill(integer, text, text, smallint, text, integer) from public, anon;
grant execute on function public.review_skill(integer, text, text, smallint, text, integer) to authenticated;

-- Same functions as in 20261031000002, now carrying each skill's pending flag and icon

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
    coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'name', k.name, 'level', ss.level, 'pending', k.status = 'pending', 'icon', k.icon_path) order by ss.level desc, k.name)
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
    'skills', coalesce((select jsonb_agg(jsonb_build_object('name', k.name, 'domain', d.name, 'level', ss.level, 'pending', k.status = 'pending', 'icon', k.icon_path,
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
            where public.student_is_listed(ss.student_id) and k.status = 'approved' group by k.name order by n desc limit 15) x), '[]')
  )
$$;
