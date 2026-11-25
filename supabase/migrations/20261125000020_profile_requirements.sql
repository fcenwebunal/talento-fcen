-- Talento FCEN: required CV data chosen by the administrators (request of 2026-11-25: students sign up and leave
-- their CVs almost empty). Every item of the student profile can be marked as required; list items take a minimum.
-- A profile missing any required item is not shown to companies (student_is_listed) and cannot apply to calls
-- (call_readiness). The initial set is the minimum CV that calls already demanded, so nothing changes on deploy.

create table public.profile_requirements (
  key text primary key,
  section text not null check (section in ('personales', 'academico', 'perfil', 'experiencia', 'disponibilidad', 'documentos')),
  label text not null,
  sort smallint not null,
  max_count smallint check (max_count between 1 and 50),
  required boolean not null default false,
  min_count smallint,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint profile_requirements_min check (
    (max_count is null and min_count is null) or (max_count is not null and min_count between 1 and max_count)
  )
);

insert into public.profile_requirements (key, section, label, sort, max_count, required, min_count) values
  ('nombre', 'personales', 'Nombre completo', 10, null, true, null),
  ('documento', 'personales', 'Tipo y número de documento', 11, null, false, null),
  ('nacimiento', 'personales', 'Fecha de nacimiento', 12, null, false, null),
  ('ciudad', 'personales', 'Ciudad de residencia', 13, null, true, null),
  ('telefono', 'personales', 'Teléfono', 14, null, true, null),
  ('correo_personal', 'personales', 'Correo personal', 15, null, false, null),
  ('enlaces', 'personales', 'Un enlace profesional (LinkedIn, GitHub o portafolio)', 16, null, false, null),
  ('eps', 'personales', 'EPS', 17, null, false, null),
  ('emergencia', 'personales', 'Contacto de emergencia (nombre, parentesco y teléfono)', 18, null, false, null),
  ('programa', 'academico', 'Programa curricular', 20, null, true, null),
  ('grado', 'academico', 'Fecha estimada de grado', 21, null, false, null),
  ('avance', 'academico', 'Porcentaje de avance en el plan', 22, null, false, null),
  ('papa', 'academico', 'PAPA', 23, null, false, null),
  ('periodo', 'academico', 'Periodo académico de la práctica', 24, null, false, null),
  ('historia', 'academico', 'Historia académica del SIA', 25, null, false, null),
  ('enfasis', 'academico', 'Líneas de profundización o énfasis', 26, null, false, null),
  ('reconocimientos', 'academico', 'Reconocimientos, becas o distinciones', 27, null, false, null),
  ('asignaturas', 'academico', 'Asignaturas relevantes para la práctica', 28, 5, false, 1),
  ('titular', 'perfil', 'Titular', 30, null, true, null),
  ('perfil', 'perfil', 'Perfil profesional', 31, null, true, null),
  ('logros', 'perfil', 'Logros destacados', 32, 3, false, 1),
  ('habilidades', 'perfil', 'Competencias técnicas', 33, 20, true, 3),
  ('transversales', 'perfil', 'Competencias transversales', 34, 5, false, 3),
  ('experiencia', 'experiencia', 'Experiencia', 40, 10, false, 1),
  ('proyectos', 'experiencia', 'Proyectos', 41, 10, false, 1),
  ('experiencia_o_proyectos', 'experiencia', 'Experiencia o proyectos (cualquiera de los dos)', 42, 10, false, 1),
  ('cursos', 'experiencia', 'Cursos y certificaciones', 43, 10, false, 1),
  ('publicaciones', 'experiencia', 'Publicaciones y eventos', 44, 10, false, 1),
  ('idiomas', 'experiencia', 'Idiomas', 45, 5, true, 1),
  ('areas', 'disponibilidad', 'Áreas en las que le gustaría hacer la práctica', 50, 10, false, 1),
  ('inicio', 'disponibilidad', 'Fecha a partir de la cual puede iniciar', 51, null, false, null),
  ('hasta', 'disponibilidad', 'Fecha hasta la cual busca práctica', 52, null, false, null),
  ('duracion', 'disponibilidad', 'Duración de la práctica', 53, null, false, null),
  ('dedicacion', 'disponibilidad', 'Dedicación', 54, null, false, null),
  ('modalidad', 'disponibilidad', 'Modalidad aceptada', 55, null, false, null),
  ('ciudades_practica', 'disponibilidad', 'Ciudades donde puede hacer la práctica', 56, null, false, null),
  ('traslado', 'disponibilidad', 'Disponibilidad para trasladarse de ciudad', 57, null, false, null),
  ('sectores', 'disponibilidad', 'Sectores u organizaciones de interés', 58, null, false, null),
  ('motivacion', 'disponibilidad', 'Por qué quiere hacer la práctica', 59, null, false, null),
  ('foto', 'documentos', 'Fotografía', 60, null, false, null),
  ('hoja_vida', 'documentos', 'Hoja de vida propia en PDF', 61, null, false, null),
  ('veracidad', 'documentos', 'Declaración de que la información es veraz', 62, null, true, null);

alter table public.profile_requirements enable row level security;
create policy profile_requirements_read on public.profile_requirements for select using (true);
revoke insert, update, delete on public.profile_requirements from anon, authenticated;

create or replace function public.is_filled(p_text text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when coalesce(btrim(p_text), '') <> '' then 1 else 0 end
$$;

-- What a profile has for each requirement key: 0 or 1 for single data, the number of entries for lists
create or replace function public.profile_values(p_student uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.students;
  v public.student_private;
  v_name text;
  v_docs text[];
  v_exps integer;
  v_projs integer;
begin
  select * into s from public.students where id = p_student;
  if not found then
    return null;
  end if;
  select * into v from public.student_private where student_id = p_student;
  select full_name into v_name from public.profiles where id = p_student;
  select coalesce(array_agg(distinct kind), '{}') into v_docs from public.documents where student_id = p_student;
  select count(*) into v_exps from public.experiences where student_id = p_student;
  select count(*) into v_projs from public.projects where student_id = p_student;

  return jsonb_build_object(
    'nombre', public.is_filled(v_name),
    'documento', public.is_filled(v.doc_type) * public.is_filled(v.doc_number),
    'nacimiento', (v.birth_date is not null)::integer,
    'ciudad', public.is_filled(s.city),
    'telefono', public.is_filled(v.phone),
    'correo_personal', public.is_filled(v.personal_email),
    'enlaces', least(1, public.is_filled(s.linkedin_url) + public.is_filled(s.github_url) + public.is_filled(s.portfolio_url)),
    'eps', public.is_filled(v.eps),
    'emergencia', public.is_filled(v.emergency_name) * public.is_filled(v.emergency_relation) * public.is_filled(v.emergency_phone),
    'programa', (s.program_id is not null)::integer,
    'grado', (s.graduation_date is not null)::integer,
    'avance', (s.progress_pct is not null)::integer,
    'papa', (s.papa is not null)::integer,
    'periodo', public.is_filled(s.practice_period),
    'historia', ('historia_academica' = any(v_docs))::integer,
    'enfasis', public.is_filled(s.emphasis),
    'reconocimientos', public.is_filled(s.honors),
    'asignaturas', (select count(*) from public.relevant_subjects x where x.student_id = p_student),
    'titular', public.is_filled(s.headline),
    'perfil', public.is_filled(s.about),
    'logros', (select count(*) from unnest(s.highlights) h where btrim(h) <> ''),
    'habilidades', (select count(*) from public.student_skills x where x.student_id = p_student),
    'transversales', (select count(*) from public.student_soft_skills x where x.student_id = p_student),
    'experiencia', v_exps,
    'proyectos', v_projs,
    'experiencia_o_proyectos', v_exps + v_projs,
    'cursos', (select count(*) from public.courses x where x.student_id = p_student),
    'publicaciones', (select count(*) from public.student_outputs x where x.student_id = p_student),
    'idiomas', (select count(*) from public.student_languages x where x.student_id = p_student),
    'areas', (select count(*) from public.student_areas x where x.student_id = p_student) + public.is_filled(s.area_other),
    'inicio', (s.available_from is not null)::integer,
    'hasta', (s.available_until is not null)::integer,
    'duracion', (s.duration_months is not null)::integer,
    'dedicacion', public.is_filled(s.dedication),
    'modalidad', least(1, cardinality(s.modalities)),
    'ciudades_practica', public.is_filled(s.practice_cities),
    'traslado', (s.can_relocate is not null)::integer,
    'sectores', public.is_filled(s.target_companies),
    'motivacion', public.is_filled(s.motivation),
    'foto', ('foto' = any(v_docs))::integer,
    'hoja_vida', ('hoja_vida' = any(v_docs))::integer,
    'veracidad', s.truthful_declared::integer
  );
end;
$$;

-- Every requirement with its configuration and whether the profile meets it
create or replace function public.profile_status(p_student uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', r.key, 'section', r.section, 'label', r.label, 'required', r.required,
    'min', r.min_count, 'max', r.max_count,
    'value', coalesce((x.v ->> r.key)::integer, 0),
    'ok', coalesce((x.v ->> r.key)::integer, 0) >= coalesce(r.min_count, 1)
  ) order by r.sort), '[]')
  from public.profile_requirements r
  cross join (select public.profile_values(p_student) as v) x
  where x.v is not null
$$;

create or replace function public.profile_complete(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select x.v is not null and not exists (
    select 1 from public.profile_requirements r
    where r.required and coalesce((x.v ->> r.key)::integer, 0) < coalesce(r.min_count, 1)
  )
  from (select public.profile_values(p_student) as v) x
$$;

-- The student reads their own status; the Facultad reads anyone's
create or replace function public.profile_checklist(p_student uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target uuid := coalesce(p_student, auth.uid());
begin
  if auth.uid() is null or (v_target <> auth.uid() and not public.is_staff()) then
    raise exception 'FORBIDDEN';
  end if;
  return public.profile_status(v_target);
end;
$$;

-- For the Facultad: what each student lacks, for lists and counters
create or replace function public.profile_missing()
returns table (student_id uuid, missing integer, missing_labels text[])
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, count(r.key)::integer, coalesce(array_agg(r.label order by r.sort) filter (where r.key is not null), '{}')
  from public.students s
  join public.profiles pr on pr.id = s.id and pr.role = 'student'
  cross join lateral (select public.profile_values(s.id) as v) x
  left join public.profile_requirements r
    on r.required and coalesce((x.v ->> r.key)::integer, 0) < coalesce(r.min_count, 1)
  where public.is_staff()
  group by s.id
$$;

-- For the configuration page: every student's values, so the impact of a change is shown before saving
create or replace function public.profile_requirements_matrix()
returns table (student_id uuid, base_listed boolean, vals jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id,
    s.consent_anonymous and s.program_id is not null and s.availability in ('disponible', 'en_proceso'),
    public.profile_values(s.id)
  from public.students s
  join public.profiles pr on pr.id = s.id and pr.role = 'student'
  where public.is_staff()
$$;

-- Only administrators change what is required; labels, sections and limits stay fixed
create or replace function public.set_profile_requirements(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  update public.profile_requirements r set
    required = coalesce((x ->> 'required')::boolean, r.required),
    min_count = case when r.max_count is null then null
      else greatest(1, least(r.max_count, coalesce((x ->> 'min')::integer, r.min_count))) end,
    updated_at = now(),
    updated_by = auth.uid()
  from jsonb_array_elements(coalesce(p_items, '[]')) x
  where r.key = x ->> 'key'
    and (r.required is distinct from coalesce((x ->> 'required')::boolean, r.required)
      or r.min_count is distinct from case when r.max_count is null then null
        else greatest(1, least(r.max_count, coalesce((x ->> 'min')::integer, r.min_count))) end);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Companies only see students whose CV has everything required
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
  ) and public.profile_complete(p_student)
$$;

-- Applying needs the required CV data (now chosen by the administrators) and, when the call enforces them, its
-- academic requirements. Recommended items are the useful ones that are not required.
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
  v_status jsonb;
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
  v_status := public.profile_status(v_uid);

  select coalesce(jsonb_agg(jsonb_build_object('key', x ->> 'key', 'section', x ->> 'section', 'ok', (x ->> 'ok')::boolean,
    'label', (x ->> 'label') || case when x ->> 'max' is not null then ' (al menos ' || (x ->> 'min') || ')' else '' end)), '[]')
  into v_profile
  from jsonb_array_elements(v_status) x
  where (x ->> 'required')::boolean;

  select coalesce(jsonb_agg(jsonb_build_object('key', x ->> 'key', 'section', x ->> 'section', 'ok', (x ->> 'ok')::boolean,
    'label', x ->> 'label')), '[]')
  into v_recommended
  from jsonb_array_elements(v_status) x
  where not (x ->> 'required')::boolean
    and x ->> 'key' in ('avance', 'historia', 'transversales', 'experiencia_o_proyectos', 'modalidad', 'dedicacion', 'foto');

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

revoke execute on function public.profile_values(uuid) from public, anon, authenticated;
revoke execute on function public.profile_status(uuid) from public, anon, authenticated;
revoke execute on function public.profile_complete(uuid) from public, anon, authenticated;
revoke execute on function public.profile_checklist(uuid) from public, anon;
revoke execute on function public.profile_missing() from public, anon;
revoke execute on function public.profile_requirements_matrix() from public, anon;
revoke execute on function public.set_profile_requirements(jsonb) from public, anon;
revoke execute on function public.call_readiness(uuid) from public, anon;
