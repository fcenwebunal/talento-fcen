-- Talento FCEN: open calls («Convocatorias abiertas», decisions of the user of 2026-11-24).
-- The Facultad publishes calls (company, logo, programs, profile, duties, conditions, deadline); anyone reads the
-- published ones without signing in. Only accounts with the student role apply, inside the platform, with the CV of
-- their profile. The Facultad sees every applicant; a registered company linked to a call sees the applicants of its
-- own calls and their full CV (applying is the student's consent for that company). Each call says whether the
-- academic requirements are enforced (on by default): admitted program, minimum progress and minimum PAPA.

create type public.call_status as enum ('borrador', 'publicada', 'cerrada');
create type public.application_status as enum (
  'recibida', 'en_revision', 'enviada', 'seleccionada', 'no_seleccionada', 'retirada'
);

insert into public.app_settings (key, value, description) values
  ('call_min_progress', '75', 'Avance mínimo (%) que se propone al crear una convocatoria con requisitos académicos'),
  ('application_consent_version', '"2026-11-24"', 'Versión vigente del texto de autorización al postularse');

-- Calendar date in Colombia: a deadline lasts the whole day there, whatever the server time zone
create or replace function public.today_co()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Bogota')::date
$$;

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  code integer generated always as identity unique,
  status public.call_status not null default 'borrador',
  company_id uuid references public.companies (id) on delete set null,
  company_name text not null check (char_length(company_name) between 2 and 160),
  company_brand text check (char_length(company_brand) <= 160),
  logo_path text,
  title text not null check (char_length(title) between 3 and 160),
  summary text check (char_length(summary) <= 600),
  openings smallint check (openings between 1 and 99),
  start_date date check (start_date between '1900-01-01' and '2100-12-31'),
  deadline date not null check (deadline between '1900-01-01' and '2100-12-31'),
  profile text check (char_length(profile) <= 2000),
  academic_requirement text check (char_length(academic_requirement) <= 1200),
  enforce_requirements boolean not null default true,
  min_progress numeric(5, 2) check (min_progress between 0 and 100),
  min_papa numeric(3, 1) check (min_papa between 0 and 5),
  duties text check (char_length(duties) <= 4000),
  knowledge text check (char_length(knowledge) <= 3000),
  languages jsonb not null default '[]' check (jsonb_typeof(languages) = 'array'),
  contract_type text check (contract_type in (
    'convenio_practica', 'contrato_aprendizaje', 'vinculacion_formativa', 'pasantia', 'otro'
  )),
  paid boolean not null default false,
  stipend numeric(12, 0) check (stipend >= 0),
  stipend_note text check (char_length(stipend_note) <= 300),
  duration_months smallint check (duration_months between 1 and 24),
  schedule text check (char_length(schedule) <= 300),
  city text check (char_length(city) <= 120),
  modality text check (modality in ('presencial', 'remota', 'hibrida')),
  benefits text check (char_length(benefits) <= 1500),
  extra_info text check (char_length(extra_info) <= 1500),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calls_status_deadline_idx on public.calls (status, deadline);
create index calls_company_idx on public.calls (company_id);

create table public.call_programs (
  call_id uuid not null references public.calls (id) on delete cascade,
  program_id smallint not null references public.programs (id),
  primary key (call_id, program_id)
);

create table public.call_skills (
  call_id uuid not null references public.calls (id) on delete cascade,
  skill_id integer not null references public.skills (id),
  level smallint not null default 1 check (level between 1 and 3),
  primary key (call_id, skill_id)
);

-- A call with applications cannot be deleted (on delete restrict): it is closed instead
create table public.applications (
  id bigint generated always as identity primary key,
  call_id uuid not null references public.calls (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete cascade,
  status public.application_status not null default 'recibida',
  message text check (char_length(message) <= 1500),
  meets_requirements boolean not null,
  snapshot jsonb not null default '{}',
  consent_version text not null,
  staff_note text check (char_length(staff_note) <= 1000),
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (call_id, student_id)
);

create index applications_student_idx on public.applications (student_id);
create index applications_status_idx on public.applications (status);

create trigger calls_touch before update on public.calls
  for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

create or replace function public.guard_call()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  else
    new.created_by := old.created_by;
    new.published_at := old.published_at;
  end if;
  if new.status = 'publicada' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger calls_guard before insert or update on public.calls
  for each row execute function public.guard_call();

create or replace function public.guard_application()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  new.call_id := old.call_id;
  new.student_id := old.student_id;
  return new;
end;
$$;

create trigger applications_guard before update on public.applications
  for each row execute function public.guard_application();

-- Row level security: published and closed calls are public; drafts only for the Facultad. Applications are written
-- only through apply_to_call and withdraw_application; companies read applicants only through call_applicants.

alter table public.calls enable row level security;
alter table public.call_programs enable row level security;
alter table public.call_skills enable row level security;
alter table public.applications enable row level security;

create policy calls_read on public.calls for select using (
  status in ('publicada', 'cerrada')
  or public.is_staff()
  or (company_id is not null and company_id = public.my_company_id() and public.access_level() >= 1)
);
create policy calls_staff_insert on public.calls for insert with check (public.is_staff());
create policy calls_staff_update on public.calls for update using (public.is_staff()) with check (public.is_staff());
create policy calls_staff_delete on public.calls for delete using (public.is_staff());

create policy call_programs_read on public.call_programs for select using (
  exists (select 1 from public.calls c where c.id = call_id)
);
create policy call_programs_staff on public.call_programs for all using (public.is_staff()) with check (public.is_staff());
create policy call_skills_read on public.call_skills for select using (
  exists (select 1 from public.calls c where c.id = call_id)
);
create policy call_skills_staff on public.call_skills for all using (public.is_staff()) with check (public.is_staff());

create policy applications_read on public.applications for select using (student_id = auth.uid() or public.is_staff());
create policy applications_staff_update on public.applications for update using (public.is_staff()) with check (public.is_staff());

-- Logos of the calls (public bucket, written by the Facultad): <call_id>/<file>, PNG without background or on white

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('call-logos', 'call-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']);

create policy call_logos_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'call-logos' and public.is_staff());
create policy call_logos_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'call-logos' and public.is_staff());
create policy call_logos_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'call-logos' and public.is_staff());

-- Saves a call with its programs and skills in one transaction. p_skills: [{"skill_id": 1, "level": 2}]
create or replace function public.save_call(p_id uuid, p_data jsonb, p_programs smallint[], p_skills jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_row public.calls;
begin
  if not public.is_staff() then
    raise exception 'ACCESS_DENIED';
  end if;

  v_row := jsonb_populate_record(null::public.calls, p_data);

  if v_id is null then
    insert into public.calls (
      status, company_id, company_name, company_brand, title, summary, openings, start_date, deadline, profile,
      academic_requirement, enforce_requirements, min_progress, min_papa, duties, knowledge, languages, contract_type,
      paid, stipend, stipend_note, duration_months, schedule, city, modality, benefits, extra_info
    ) values (
      coalesce(v_row.status, 'borrador'), v_row.company_id, v_row.company_name, v_row.company_brand, v_row.title, v_row.summary,
      v_row.openings, v_row.start_date, v_row.deadline, v_row.profile, v_row.academic_requirement,
      coalesce(v_row.enforce_requirements, true), v_row.min_progress, v_row.min_papa, v_row.duties, v_row.knowledge,
      coalesce(v_row.languages, '[]'), v_row.contract_type, coalesce(v_row.paid, false), v_row.stipend, v_row.stipend_note,
      v_row.duration_months, v_row.schedule, v_row.city, v_row.modality, v_row.benefits, v_row.extra_info
    )
    returning id into v_id;
  else
    update public.calls set
      status = coalesce(v_row.status, status), company_id = v_row.company_id, company_name = v_row.company_name,
      company_brand = v_row.company_brand, title = v_row.title, summary = v_row.summary, openings = v_row.openings,
      start_date = v_row.start_date, deadline = v_row.deadline, profile = v_row.profile,
      academic_requirement = v_row.academic_requirement, enforce_requirements = coalesce(v_row.enforce_requirements, true),
      min_progress = v_row.min_progress, min_papa = v_row.min_papa, duties = v_row.duties, knowledge = v_row.knowledge,
      languages = coalesce(v_row.languages, '[]'), contract_type = v_row.contract_type, paid = coalesce(v_row.paid, false),
      stipend = v_row.stipend, stipend_note = v_row.stipend_note, duration_months = v_row.duration_months,
      schedule = v_row.schedule, city = v_row.city, modality = v_row.modality, benefits = v_row.benefits,
      extra_info = v_row.extra_info
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  delete from public.call_programs where call_id = v_id;
  insert into public.call_programs (call_id, program_id)
  select v_id, p from unnest(coalesce(p_programs, '{}')) as p group by p;

  delete from public.call_skills where call_id = v_id;
  insert into public.call_skills (call_id, skill_id, level)
  select v_id, (x ->> 'skill_id')::integer, greatest(1, least(3, coalesce((x ->> 'level')::smallint, 1)))
  from jsonb_array_elements(coalesce(p_skills, '[]')) as x
  on conflict do nothing;

  return v_id;
end;
$$;

-- What a student needs to apply to a call: the minimum CV (always) and the academic requirements of the call
-- (only when the call enforces them; otherwise they are reported but do not block). Anyone else gets only «open».
create or replace function public.call_readiness(p_call uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_call public.calls;
  v_open boolean;
  v_s public.students;
  v_name text;
  v_phone text;
  v_skills integer;
  v_soft integer;
  v_langs integer;
  v_work integer;
  v_docs text[];
  v_programs smallint[];
  v_program_names text;
  v_profile jsonb;
  v_req jsonb := '[]';
  v_recommended jsonb;
  v_app record;
  v_profile_ok boolean;
  v_req_ok boolean;
begin
  select * into v_call from public.calls
  where id = p_call and (status in ('publicada', 'cerrada') or public.is_staff());
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  v_open := v_call.status = 'publicada' and v_call.deadline >= public.today_co();

  if v_uid is null or public.my_role() is distinct from 'student' then
    return jsonb_build_object('open', v_open, 'student', false, 'can_apply', false);
  end if;

  select * into v_s from public.students where id = v_uid;
  select full_name into v_name from public.profiles where id = v_uid;
  select phone into v_phone from public.student_private where student_id = v_uid;
  select count(*) into v_skills from public.student_skills where student_id = v_uid;
  select count(*) into v_soft from public.student_soft_skills where student_id = v_uid;
  select count(*) into v_langs from public.student_languages where student_id = v_uid;
  select (select count(*) from public.experiences where student_id = v_uid)
       + (select count(*) from public.projects where student_id = v_uid) into v_work;
  select coalesce(array_agg(distinct kind), '{}') into v_docs from public.documents where student_id = v_uid;

  v_profile := jsonb_build_array(
    jsonb_build_object('key', 'nombre', 'label', 'Nombre completo', 'section', 'personales',
      'ok', coalesce(btrim(v_name), '') <> ''),
    jsonb_build_object('key', 'contacto', 'label', 'Celular y ciudad', 'section', 'personales',
      'ok', coalesce(btrim(v_phone), '') <> '' and coalesce(btrim(v_s.city), '') <> ''),
    jsonb_build_object('key', 'programa', 'label', 'Programa', 'section', 'academico', 'ok', v_s.program_id is not null),
    jsonb_build_object('key', 'perfil', 'label', 'Titular y perfil profesional', 'section', 'perfil',
      'ok', coalesce(btrim(v_s.headline), '') <> '' and coalesce(btrim(v_s.about), '') <> ''),
    jsonb_build_object('key', 'habilidades', 'label', 'Al menos 3 habilidades', 'section', 'perfil', 'ok', v_skills >= 3),
    jsonb_build_object('key', 'idiomas', 'label', 'Al menos un idioma', 'section', 'experiencia', 'ok', v_langs >= 1),
    jsonb_build_object('key', 'veracidad', 'label', 'Declaración de que tu información es verídica', 'section', 'documentos',
      'ok', v_s.truthful_declared)
  );

  v_recommended := jsonb_build_array(
    jsonb_build_object('key', 'avance', 'label', 'Avance del plan de estudios', 'section', 'academico', 'ok', v_s.progress_pct is not null),
    jsonb_build_object('key', 'historia', 'label', 'Historia académica del SIA', 'section', 'academico', 'ok', 'historia_academica' = any(v_docs)),
    jsonb_build_object('key', 'transversales', 'label', 'Competencias transversales', 'section', 'perfil', 'ok', v_soft >= 3),
    jsonb_build_object('key', 'experiencia', 'label', 'Experiencia o proyectos', 'section', 'experiencia', 'ok', v_work >= 1),
    jsonb_build_object('key', 'disponibilidad', 'label', 'Disponibilidad', 'section', 'disponibilidad',
      'ok', cardinality(v_s.modalities) > 0 and v_s.dedication is not null),
    jsonb_build_object('key', 'foto', 'label', 'Foto', 'section', 'documentos', 'ok', 'foto' = any(v_docs))
  );

  select coalesce(array_agg(cp.program_id), '{}'), string_agg(p.name, ', ' order by p.sort)
  into v_programs, v_program_names
  from public.call_programs cp join public.programs p on p.id = cp.program_id
  where cp.call_id = p_call;

  if cardinality(v_programs) > 0 then
    v_req := v_req || jsonb_build_array(jsonb_build_object('key', 'programa', 'section', 'academico',
      'label', 'Estudiante de ' || v_program_names, 'ok', v_s.program_id = any(v_programs)));
  end if;
  if v_call.min_progress is not null then
    v_req := v_req || jsonb_build_array(jsonb_build_object('key', 'avance', 'section', 'academico',
      'label', 'Avance del plan de al menos ' || replace(trim_scale(v_call.min_progress)::text, '.', ',') || ' %',
      'value', v_s.progress_pct, 'verified', v_s.progress_verified,
      'ok', coalesce(v_s.progress_pct >= v_call.min_progress, false)));
  end if;
  if v_call.min_papa is not null then
    v_req := v_req || jsonb_build_array(jsonb_build_object('key', 'papa', 'section', 'academico',
      'label', 'PAPA de al menos ' || replace(to_char(v_call.min_papa, 'FM0.0'), '.', ','),
      'value', v_s.papa, 'ok', coalesce(v_s.papa >= v_call.min_papa, false)));
  end if;

  select id, status, created_at into v_app from public.applications where call_id = p_call and student_id = v_uid;

  v_profile_ok := not exists (select 1 from jsonb_array_elements(v_profile) x where not (x ->> 'ok')::boolean);
  v_req_ok := not exists (select 1 from jsonb_array_elements(v_req) x where not (x ->> 'ok')::boolean);

  return jsonb_build_object(
    'open', v_open,
    'student', true,
    'enforced', v_call.enforce_requirements,
    'profile', v_profile,
    'profile_ok', v_profile_ok,
    'requirements', v_req,
    'requirements_ok', v_req_ok,
    'recommended', v_recommended,
    'application', case when v_app.id is not null then jsonb_build_object('id', v_app.id, 'status', v_app.status, 'created_at', v_app.created_at) end,
    'can_apply', v_open and v_profile_ok and (v_req_ok or not v_call.enforce_requirements)
      and (v_app.id is null or v_app.status = 'retirada')
  );
end;
$$;

create or replace function public.apply_to_call(p_call uuid, p_message text default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_r jsonb := public.call_readiness(p_call);
  v_id bigint;
  v_snapshot jsonb;
begin
  if not (v_r ->> 'student')::boolean then
    raise exception 'STUDENT_ONLY';
  end if;
  if not (v_r ->> 'open')::boolean then
    raise exception 'CALL_CLOSED';
  end if;
  if v_r -> 'application' is not null and v_r -> 'application' ->> 'status' <> 'retirada' then
    raise exception 'ALREADY_APPLIED';
  end if;
  if not (v_r ->> 'profile_ok')::boolean then
    raise exception 'PROFILE_INCOMPLETE';
  end if;
  if (v_r ->> 'enforced')::boolean and not (v_r ->> 'requirements_ok')::boolean then
    raise exception 'REQUIREMENTS_NOT_MET';
  end if;

  select jsonb_build_object('program', p.name, 'progress_pct', s.progress_pct, 'progress_verified', s.progress_verified,
    'papa', s.papa, 'papa_visibility', s.papa_visibility)
  into v_snapshot
  from public.students s left join public.programs p on p.id = s.program_id where s.id = v_uid;

  insert into public.applications (call_id, student_id, message, meets_requirements, snapshot, consent_version)
  values (p_call, v_uid, nullif(btrim(p_message), ''), (v_r ->> 'requirements_ok')::boolean, v_snapshot,
    (select value #>> '{}' from public.app_settings where key = 'application_consent_version'))
  on conflict (call_id, student_id) do update set
    status = 'recibida', message = excluded.message, meets_requirements = excluded.meets_requirements,
    snapshot = excluded.snapshot, consent_version = excluded.consent_version, staff_note = null,
    status_changed_at = now(), created_at = now()
  where public.applications.status = 'retirada'
  returning id into v_id;

  if v_id is null then
    raise exception 'ALREADY_APPLIED';
  end if;
  return v_id;
end;
$$;

-- A student withdraws while the Facultad has not decided yet
create or replace function public.withdraw_application(p_call uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications set status = 'retirada'
  where call_id = p_call and student_id = auth.uid() and status in ('recibida', 'en_revision', 'enviada');
  if not found then
    raise exception 'NOT_FOUND';
  end if;
end;
$$;

-- True when the student applied to a call of the viewer's company (and has not withdrawn)
create or replace function public.applied_to_my_company(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.access_level() >= 1 and exists (
    select 1 from public.applications a
    join public.calls c on c.id = a.call_id
    where a.student_id = p_student and a.status <> 'retirada'
      and c.company_id is not null and c.company_id = public.my_company_id()
  )
$$;

-- Applicants of a call for the Facultad (all, with the internal note) or for its company (without withdrawn ones)
create or replace function public.call_applicants(p_call uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff boolean := public.is_staff();
  v_company boolean;
begin
  select not v_staff and c.company_id is not null and c.company_id = public.my_company_id() and public.access_level() >= 1
  into v_company
  from public.calls c where c.id = p_call;
  if not v_staff and not coalesce(v_company, false) then
    raise exception 'ACCESS_DENIED';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id,
      'student_id', a.student_id,
      'status', a.status,
      'message', a.message,
      'meets_requirements', a.meets_requirements,
      'created_at', a.created_at,
      'status_changed_at', a.status_changed_at,
      'staff_note', case when v_staff then a.staff_note end,
      'full_name', pr.full_name,
      'email', pr.email,
      'phone', sp.phone,
      'city', s.city,
      'headline', s.headline,
      'program', p.name,
      'progress_pct', s.progress_pct,
      'progress_verified', s.progress_verified,
      'papa', case when (v_staff and s.papa_visibility <> 'nadie') or (s.papa_visibility = 'autorizadas' and public.access_level() = 2)
        then s.papa end
    ) order by a.created_at)
    from public.applications a
    join public.profiles pr on pr.id = a.student_id
    join public.students s on s.id = a.student_id
    left join public.student_private sp on sp.student_id = a.student_id
    left join public.programs p on p.id = s.program_id
    where a.call_id = p_call and (v_staff or a.status <> 'retirada')
  ), '[]');
end;
$$;

-- Applying shares the photo and the contact with the company of the call
create or replace function public.student_contact_visible(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (public.access_level() = 2 and exists (
    select 1 from public.students s
    where s.id = p_student and s.consent_contact and public.student_is_listed(s.id)
  )) or public.applied_to_my_company(p_student)
$$;

revoke execute on function public.save_call(uuid, jsonb, smallint[], jsonb) from public, anon;
revoke execute on function public.call_readiness(uuid) from public, anon;
revoke execute on function public.apply_to_call(uuid, text) from public, anon;
revoke execute on function public.withdraw_application(uuid) from public, anon;
revoke execute on function public.applied_to_my_company(uuid) from public, anon;
revoke execute on function public.call_applicants(uuid) from public, anon;

-- A company sees the full CV of the students who applied to its calls, even when they are not listed in the search
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
  v_applicant boolean := public.applied_to_my_company(p_student);
  v_result jsonb;
begin
  if not v_staff and p_student <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
    if not v_applicant and (v_level < 1 or not public.student_is_listed(p_student)) then
      raise exception 'ACCESS_DENIED';
    end if;
  end if;

  select v_staff or p_student = auth.uid() or (v_level = 2 and s.consent_contact) or v_applicant
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
        'linkedin_url', s.linkedin_url, 'github_url', s.github_url, 'portfolio_url', s.portfolio_url
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
