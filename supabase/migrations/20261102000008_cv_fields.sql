-- Richer CV (2026-11-02): experience types, highlights, PAPA visibility chosen by the student, project role and
-- tools, course credential links and a list of publications and events. get_student_detail applies the same
-- permission rules as before to every new field.

alter table public.experiences
  add column kind text not null default 'laboral'
    check (kind in ('laboral', 'practica', 'monitoria', 'investigacion', 'voluntariado', 'extension', 'emprendimiento'));

create or replace function public.text_items_fit(p_items text[], p_max_items integer, p_max_len integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(p_items), 0) <= p_max_items
     and not exists (select 1 from unnest(p_items) x where char_length(x) > p_max_len)
$$;

-- papa stays editable only by staff (guard_student); the student decides who sees it on the CV
alter table public.students
  add column highlights text[] not null default '{}' check (public.text_items_fit(highlights, 3, 220)),
  add column papa_visibility text not null default 'facultad' check (papa_visibility in ('nadie', 'facultad', 'autorizadas'));

alter table public.projects
  add column role text check (char_length(role) <= 80),
  add column tools text check (char_length(tools) <= 200);

alter table public.courses
  add column url text check (char_length(url) <= 500);

create table public.student_outputs (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('articulo', 'ponencia', 'poster', 'capitulo', 'evento', 'otro')),
  title text not null check (char_length(title) <= 240),
  venue text check (char_length(venue) <= 200),
  year smallint check (year between 1990 and 2100),
  url text check (char_length(url) <= 500)
);

create index student_outputs_student_idx on public.student_outputs (student_id);
alter table public.student_outputs enable row level security;
create policy student_outputs_owner on public.student_outputs for all
  using (student_id = auth.uid() or public.is_staff()) with check (student_id = auth.uid() or public.is_staff());

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
    'highlights', s.highlights,
    'graduation_date', s.graduation_date,
    'target_companies', s.target_companies,
    'papa', case when p_student = auth.uid()
      or (v_staff and s.papa_visibility <> 'nadie')
      or (v_level = 2 and s.papa_visibility = 'autorizadas') then s.papa end,
    'papa_visibility', case when p_student = auth.uid() or v_staff then s.papa_visibility end,
    'updated_at', s.updated_at,
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
    'experiences', coalesce((select jsonb_agg(jsonb_build_object('organization', e.organization, 'role', e.role, 'kind', e.kind,
        'start_date', e.start_date, 'end_date', e.end_date, 'description', e.description) order by e.start_date desc nulls last)
      from public.experiences e where e.student_id = s.id), '[]'),
    'projects', coalesce((select jsonb_agg(jsonb_build_object('title', pj.title, 'year', pj.year, 'description', pj.description, 'role', pj.role, 'tools', pj.tools,
        'url', case when v_contact then pj.url end) order by pj.year desc nulls last)
      from public.projects pj where pj.student_id = s.id), '[]'),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'institution', c.institution, 'year', c.year, 'hours', c.hours,
        'url', case when v_contact then c.url end))
      from public.courses c where c.student_id = s.id), '[]'),
    -- A title can be searched online and reveal who wrote it: anonymous viewers get the kind, venue and year
    'outputs', coalesce((select jsonb_agg(jsonb_build_object('kind', o.kind, 'venue', o.venue, 'year', o.year,
        'title', case when v_contact then o.title end, 'url', case when v_contact then o.url end) order by o.year desc nulls last, o.id)
      from public.student_outputs o where o.student_id = s.id), '[]'),
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
