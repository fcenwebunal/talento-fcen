-- Talento FCEN: base schema, roles, catalogs and row level security.

create extension if not exists unaccent with schema extensions;

-- Types

create type public.user_role as enum ('student', 'company', 'staff', 'admin');
create type public.program_level as enum ('pregrado', 'especializacion', 'maestria', 'doctorado');
create type public.academic_status as enum ('activo', 'egresado');
create type public.availability_status as enum (
  'disponible', 'en_proceso', 'en_practica', 'sin_confirmar', 'no_disponible', 'archivado'
);
create type public.company_status as enum ('registrada', 'en_revision', 'autorizada', 'suspendida', 'rechazada');

-- Generic updated_at trigger

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Settings

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text
);

insert into public.app_settings (key, value, description) values
  ('availability_days', '90', 'Días sin confirmar antes de pasar a sin_confirmar'),
  ('graduate_months', '12', 'Meses tras el grado en que un egresado sigue elegible'),
  ('authorization_months', '12', 'Meses de vigencia de la autorización de una empresa'),
  ('export_max_rows', '500', 'Filas máximas por exportación'),
  ('export_max_per_day', '10', 'Exportaciones máximas por empresa y día'),
  ('consent_version', '"2026-10-31"', 'Versión vigente de los textos de autorización');

create or replace function public.setting_int(p_key text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (value #>> '{}')::integer from public.app_settings where key = p_key
$$;

-- Profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role in ('staff', 'admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Catalogs

create table public.programs (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  level public.program_level not null,
  department text,
  active boolean not null default true,
  sort smallint not null default 0
);

create table public.areas (
  id smallint generated always as identity primary key,
  name text not null unique,
  active boolean not null default true,
  sort smallint not null default 0
);

create table public.soft_skills (
  id smallint generated always as identity primary key,
  name text not null unique,
  sort smallint not null default 0
);

create table public.skill_domains (
  id smallint generated always as identity primary key,
  name text not null unique,
  sort smallint not null default 0
);

create table public.skills (
  id integer generated always as identity primary key,
  domain_id smallint not null references public.skill_domains (id),
  name text not null unique,
  aliases text[] not null default '{}',
  description text,
  active boolean not null default true
);

-- Students

create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  program_id smallint references public.programs (id),
  academic_status public.academic_status not null default 'activo',
  graduation_date date,
  progress_pct numeric(5, 2) check (progress_pct between 0 and 100),
  progress_verified text not null default 'autodeclarado'
    check (progress_verified in ('autodeclarado', 'documento', 'coordinacion')),
  progress_verified_at timestamptz,
  papa numeric(3, 1) check (papa between 0 and 5),
  emphasis text,
  honors text,
  headline text check (char_length(headline) <= 140),
  about text check (char_length(about) <= 1200),
  motivation text check (char_length(motivation) <= 800),
  city text,
  modalities text[] not null default '{}'
    check (modalities <@ array['presencial', 'remota', 'hibrida']),
  dedication text check (dedication in ('completo', 'medio', 'cualquiera')),
  can_relocate boolean,
  practice_cities text,
  target_companies text,
  practice_period text,
  available_from date,
  available_until date,
  duration_months smallint check (duration_months between 1 and 24),
  practice_end_date date,
  area_other text,
  availability public.availability_status not null default 'no_disponible',
  last_confirmed_at timestamptz,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  consent_anonymous boolean not null default false,
  consent_contact boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  truthful_declared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

create table public.student_private (
  student_id uuid primary key references public.students (id) on delete cascade,
  doc_type text,
  doc_number text,
  birth_date date,
  phone text,
  personal_email text,
  eps text,
  emergency_name text,
  emergency_relation text,
  emergency_phone text,
  updated_at timestamptz not null default now()
);

create trigger student_private_touch before update on public.student_private
  for each row execute function public.touch_updated_at();

create table public.student_skills (
  student_id uuid not null references public.students (id) on delete cascade,
  skill_id integer not null references public.skills (id),
  level smallint not null check (level between 1 and 3),
  evidence_url text,
  primary key (student_id, skill_id)
);

create table public.student_soft_skills (
  student_id uuid not null references public.students (id) on delete cascade,
  soft_skill_id smallint not null references public.soft_skills (id),
  primary key (student_id, soft_skill_id)
);

create table public.student_areas (
  student_id uuid not null references public.students (id) on delete cascade,
  area_id smallint not null references public.areas (id),
  primary key (student_id, area_id)
);

create table public.student_languages (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  language text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo')),
  certificate text
);

create table public.experiences (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  organization text not null,
  role text,
  start_date date,
  end_date date,
  description text
);

create table public.projects (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  year smallint,
  description text,
  url text
);

create table public.courses (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  name text not null,
  institution text,
  year smallint,
  hours smallint
);

create table public.relevant_subjects (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  name text not null,
  reason text
);

create table public.documents (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in (
    'hoja_vida', 'historia_academica', 'documento_identidad', 'certificado_eps', 'foto', 'certificado'
  )),
  path text not null unique,
  file_name text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

-- Companies

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  nit text not null unique,
  name text not null,
  sector text,
  size text check (size in ('micro', 'pequena', 'mediana', 'grande')),
  city text,
  website text,
  description text,
  logo_path text,
  is_public_entity boolean not null default false,
  status public.company_status not null default 'registrada',
  review_note text,
  authorized_at timestamptz,
  authorized_until date,
  authorized_by uuid references public.profiles (id),
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();

create table public.company_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'member')),
  contact_name text,
  position text,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.company_members where user_id = auth.uid()
$$;

-- 0: no company access, 1: registered company, 2: authorized company or staff
create or replace function public.access_level()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_staff() then 2
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid()
        and c.status = 'autorizada'
        and (c.authorized_until is null or c.authorized_until >= current_date)
    ) then 2
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid() and c.status in ('registrada', 'en_revision', 'autorizada')
    ) then 1
    else 0
  end
$$;

create table public.favorites (
  company_id uuid not null references public.companies (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_id, student_id)
);

create table public.contact_events (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  student_id uuid references public.students (id) on delete cascade,
  kind text not null check (kind in ('view_contact', 'download_cv')),
  created_at timestamptz not null default now()
);

create table public.exports_log (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  filters jsonb not null default '{}',
  row_count integer not null,
  created_at timestamptz not null default now()
);

create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('student_anonymous', 'student_contact', 'student_truthful', 'company_terms')),
  version text not null,
  accepted boolean not null,
  created_at timestamptz not null default now()
);

create table public.status_history (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('student', 'company')),
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,
  actor uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index status_history_entity_idx on public.status_history (entity, entity_id, created_at desc);
create index students_availability_idx on public.students (availability, last_confirmed_at desc);
create index student_skills_skill_idx on public.student_skills (skill_id);

-- New users: Google accounts must be @unal.edu.co and become students; email accounts are companies

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
  v_role public.user_role;
begin
  if v_provider = 'google' then
    if lower(new.email) not like '%@unal.edu.co' then
      raise exception 'UNAL_ONLY: solo se admiten cuentas @unal.edu.co';
    end if;
    v_role := 'student';
  else
    v_role := 'company';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, lower(new.email), v_name, v_role);

  if v_role = 'student' then
    insert into public.students (id) values (new.id);
    insert into public.student_private (student_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guards for fields only staff (or the server with the secret key) may change

create or replace function public.guard_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  new.email := old.email;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile();

create or replace function public.guard_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_staff() then
    if new.availability is distinct from old.availability then
      insert into public.status_history (entity, entity_id, from_status, to_status, actor)
      values ('student', new.id, old.availability::text, new.availability::text, auth.uid());
    end if;
    return new;
  end if;

  if new.progress_pct is distinct from old.progress_pct then
    new.progress_verified := 'autodeclarado';
    new.progress_verified_at := null;
  else
    new.progress_verified := old.progress_verified;
    new.progress_verified_at := old.progress_verified_at;
  end if;
  new.papa := old.papa;

  if new.availability is distinct from old.availability then
    if new.availability in ('sin_confirmar', 'archivado') then
      raise exception 'Ese estado lo asigna el sistema';
    end if;
    insert into public.status_history (entity, entity_id, from_status, to_status, actor)
    values ('student', new.id, old.availability::text, new.availability::text, auth.uid());
  end if;
  if new.availability = 'disponible'
     and (new.availability is distinct from old.availability or new.last_confirmed_at is distinct from old.last_confirmed_at) then
    new.last_confirmed_at := now();
  end if;

  if new.consent_anonymous is distinct from old.consent_anonymous
     or new.consent_contact is distinct from old.consent_contact then
    new.consent_at := now();
    new.consent_version := (select value #>> '{}' from public.app_settings where key = 'consent_version');
    insert into public.consents (user_id, kind, version, accepted)
    select new.id, k.kind, new.consent_version, k.accepted
    from (values ('student_anonymous', new.consent_anonymous), ('student_contact', new.consent_contact)) as k(kind, accepted);
  end if;
  return new;
end;
$$;

create trigger students_guard before update on public.students
  for each row execute function public.guard_student();

create or replace function public.guard_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_staff() then
    if new.status is distinct from old.status then
      insert into public.status_history (entity, entity_id, from_status, to_status, reason, actor)
      values ('company', new.id, old.status::text, new.status::text, new.review_note, auth.uid());
    end if;
    return new;
  end if;
  new.status := old.status;
  new.review_note := old.review_note;
  new.authorized_at := old.authorized_at;
  new.authorized_until := old.authorized_until;
  new.authorized_by := old.authorized_by;
  new.nit := old.nit;
  return new;
end;
$$;

create trigger companies_guard before update on public.companies
  for each row execute function public.guard_company();

-- Row level security

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.areas enable row level security;
alter table public.soft_skills enable row level security;
alter table public.skill_domains enable row level security;
alter table public.skills enable row level security;
alter table public.students enable row level security;
alter table public.student_private enable row level security;
alter table public.student_skills enable row level security;
alter table public.student_soft_skills enable row level security;
alter table public.student_areas enable row level security;
alter table public.student_languages enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.courses enable row level security;
alter table public.relevant_subjects enable row level security;
alter table public.documents enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.favorites enable row level security;
alter table public.contact_events enable row level security;
alter table public.exports_log enable row level security;
alter table public.consents enable row level security;
alter table public.status_history enable row level security;

create policy settings_read on public.app_settings for select using (true);
create policy settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy programs_read on public.programs for select using (true);
create policy programs_staff on public.programs for all using (public.is_staff()) with check (public.is_staff());
create policy areas_read on public.areas for select using (true);
create policy areas_staff on public.areas for all using (public.is_staff()) with check (public.is_staff());
create policy soft_skills_read on public.soft_skills for select using (true);
create policy soft_skills_staff on public.soft_skills for all using (public.is_staff()) with check (public.is_staff());
create policy skill_domains_read on public.skill_domains for select using (true);
create policy skill_domains_staff on public.skill_domains for all using (public.is_staff()) with check (public.is_staff());
create policy skills_read on public.skills for select using (true);
create policy skills_staff on public.skills for all using (public.is_staff()) with check (public.is_staff());

create policy students_owner_read on public.students for select using (id = auth.uid() or public.is_staff());
create policy students_owner_update on public.students for update using (id = auth.uid() or public.is_staff());
create policy students_staff_delete on public.students for delete using (public.is_staff());

create policy student_private_owner on public.student_private for select using (student_id = auth.uid() or public.is_staff());
create policy student_private_update on public.student_private for update using (student_id = auth.uid() or public.is_staff());

do $$
declare
  t text;
begin
  foreach t in array array[
    'student_skills', 'student_soft_skills', 'student_areas', 'student_languages',
    'experiences', 'projects', 'courses', 'relevant_subjects', 'documents'
  ] loop
    execute format(
      'create policy %1$s_owner on public.%1$s for all using (student_id = auth.uid() or public.is_staff()) with check (student_id = auth.uid() or public.is_staff())',
      t
    );
  end loop;
end;
$$;

create policy companies_member_read on public.companies for select using (id = public.my_company_id() or public.is_staff());
create policy companies_member_update on public.companies for update using (id = public.my_company_id() or public.is_staff());
create policy companies_staff_delete on public.companies for delete using (public.is_staff());

create policy members_read on public.company_members for select using (user_id = auth.uid() or company_id = public.my_company_id() or public.is_staff());
create policy members_self_update on public.company_members for update using (user_id = auth.uid() or public.is_staff());
create policy members_staff on public.company_members for delete using (public.is_staff());

create policy favorites_company on public.favorites for all
  using (company_id = public.my_company_id() or public.is_staff())
  with check (company_id = public.my_company_id() and public.access_level() >= 1);

create policy contact_events_read on public.contact_events for select using (company_id = public.my_company_id() or public.is_staff());
create policy exports_log_read on public.exports_log for select using (company_id = public.my_company_id() or public.is_staff());
create policy consents_read on public.consents for select using (user_id = auth.uid() or public.is_staff());
create policy status_history_read on public.status_history for select using (
  public.is_staff()
  or (entity = 'student' and entity_id = auth.uid())
  or (entity = 'company' and entity_id = public.my_company_id())
);

-- Seeds

insert into public.programs (slug, name, level, department, sort) values
  ('matematicas', 'Matemáticas', 'pregrado', 'Matemáticas y Estadística', 1),
  ('ciencias-computacion', 'Ciencias de la Computación', 'pregrado', 'Matemáticas y Estadística', 2),
  ('estadistica', 'Estadística', 'pregrado', 'Matemáticas y Estadística', 3),
  ('ingenieria-fisica', 'Ingeniería Física', 'pregrado', 'Física y Química', 4),
  ('ingenieria-biologica', 'Ingeniería Biológica', 'pregrado', 'Física y Química', 5),
  ('esp-actuaria-finanzas', 'Especialización en Actuaría y Finanzas', 'especializacion', 'Matemáticas y Estadística', 10),
  ('esp-estadistica', 'Especialización en Estadística con Énfasis en Econometría o Ciencia de Datos', 'especializacion', 'Matemáticas y Estadística', 11),
  ('esp-nanotecnologia', 'Especialización en Nanotecnología', 'especializacion', 'Física y Química', 12),
  ('esp-energia-solar', 'Especialización en Energía Solar', 'especializacion', 'Física y Química', 13),
  ('maestria-ensenanza-cen', 'Maestría en Enseñanza de las Ciencias Exactas y Naturales', 'maestria', null, 20),
  ('maestria-matematica-aplicada', 'Maestría en Ciencias - Matemática Aplicada', 'maestria', 'Matemáticas y Estadística', 21),
  ('maestria-fisica', 'Maestría en Ciencias - Física', 'maestria', 'Física y Química', 22),
  ('doctorado-matematicas', 'Doctorado en Ciencias - Matemáticas', 'doctorado', 'Matemáticas y Estadística', 30),
  ('doctorado-fisica', 'Doctorado en Ciencias - Física', 'doctorado', 'Física y Química', 31);

insert into public.areas (name, sort) values
  ('Investigación y desarrollo', 1),
  ('Análisis de datos y estadística', 2),
  ('Desarrollo de software y tecnología', 3),
  ('Laboratorio, calidad y control de procesos', 4),
  ('Finanzas, riesgo y modelamiento', 5),
  ('Docencia y divulgación', 6),
  ('Medio ambiente y sostenibilidad', 7),
  ('Instrumentación, electrónica y automatización', 8),
  ('Biotecnología y bioprocesos', 9),
  ('Materiales, óptica y nanotecnología', 10),
  ('Ciberseguridad y criptografía', 11),
  ('Actuaría y seguros', 12),
  ('Energía', 13),
  ('Sector público y políticas basadas en datos', 14);

insert into public.soft_skills (name, sort) values
  ('Trabajo en equipo', 1),
  ('Comunicación oral y escrita', 2),
  ('Pensamiento analítico y resolución de problemas', 3),
  ('Liderazgo', 4),
  ('Adaptabilidad y aprendizaje autónomo', 5),
  ('Organización y manejo del tiempo', 6),
  ('Creatividad e innovación', 7),
  ('Orientación a resultados', 8);

insert into public.skill_domains (name, sort) values
  ('Datos y estadística', 1),
  ('Computación', 2),
  ('Matemáticas aplicadas', 3),
  ('Física aplicada e instrumentación', 4),
  ('Biología y bioprocesos', 5),
  ('Herramientas', 6),
  ('Docencia y divulgación', 7);

insert into public.skills (domain_id, name)
select d.id, s.name
from (values
  ('Datos y estadística', 'Diseño de experimentos'),
  ('Datos y estadística', 'Muestreo y encuestas'),
  ('Datos y estadística', 'Modelos de regresión'),
  ('Datos y estadística', 'Series de tiempo'),
  ('Datos y estadística', 'Estadística bayesiana'),
  ('Datos y estadística', 'Análisis multivariado'),
  ('Datos y estadística', 'Aprendizaje estadístico'),
  ('Datos y estadística', 'Control estadístico de la calidad'),
  ('Datos y estadística', 'Bioestadística'),
  ('Datos y estadística', 'Econometría'),
  ('Datos y estadística', 'Visualización de datos'),
  ('Datos y estadística', 'Ciencia de datos'),
  ('Computación', 'Algoritmos y estructuras de datos'),
  ('Computación', 'Desarrollo de software'),
  ('Computación', 'Desarrollo web'),
  ('Computación', 'Bases de datos'),
  ('Computación', 'Criptografía'),
  ('Computación', 'Seguridad informática'),
  ('Computación', 'Inteligencia artificial'),
  ('Computación', 'Aprendizaje automático'),
  ('Computación', 'Computación científica'),
  ('Computación', 'Modelamiento computacional'),
  ('Computación', 'Computación en la nube'),
  ('Matemáticas aplicadas', 'Modelación matemática'),
  ('Matemáticas aplicadas', 'Análisis numérico'),
  ('Matemáticas aplicadas', 'Optimización'),
  ('Matemáticas aplicadas', 'Investigación de operaciones'),
  ('Matemáticas aplicadas', 'Ecuaciones diferenciales'),
  ('Matemáticas aplicadas', 'Probabilidad'),
  ('Matemáticas aplicadas', 'Matemática financiera'),
  ('Matemáticas aplicadas', 'Actuaría'),
  ('Física aplicada e instrumentación', 'Instrumentación y metrología'),
  ('Física aplicada e instrumentación', 'Sensores'),
  ('Física aplicada e instrumentación', 'Electrónica'),
  ('Física aplicada e instrumentación', 'Ciencia de materiales'),
  ('Física aplicada e instrumentación', 'Caracterización de materiales'),
  ('Física aplicada e instrumentación', 'Óptica y optoelectrónica'),
  ('Física aplicada e instrumentación', 'Magnetismo'),
  ('Física aplicada e instrumentación', 'Física del plasma'),
  ('Física aplicada e instrumentación', 'Biofísica'),
  ('Física aplicada e instrumentación', 'Simulación de sistemas físicos'),
  ('Física aplicada e instrumentación', 'Nanotecnología'),
  ('Física aplicada e instrumentación', 'Energía solar'),
  ('Biología y bioprocesos', 'Biología molecular'),
  ('Biología y bioprocesos', 'Microbiología'),
  ('Biología y bioprocesos', 'Cultivos in vitro'),
  ('Biología y bioprocesos', 'Biorreactores'),
  ('Biología y bioprocesos', 'Bioprocesos'),
  ('Biología y bioprocesos', 'Biotecnología'),
  ('Biología y bioprocesos', 'Bioinformática'),
  ('Biología y bioprocesos', 'Buenas prácticas de laboratorio'),
  ('Biología y bioprocesos', 'Buenas prácticas de manufactura'),
  ('Herramientas', 'Python'),
  ('Herramientas', 'R'),
  ('Herramientas', 'SQL'),
  ('Herramientas', 'Java'),
  ('Herramientas', 'C y C++'),
  ('Herramientas', 'JavaScript y TypeScript'),
  ('Herramientas', 'MATLAB u Octave'),
  ('Herramientas', 'SageMath'),
  ('Herramientas', 'LaTeX'),
  ('Herramientas', 'Excel avanzado'),
  ('Herramientas', 'Power BI'),
  ('Herramientas', 'Tableau'),
  ('Herramientas', 'SAS'),
  ('Herramientas', 'SPSS'),
  ('Herramientas', 'Stata'),
  ('Herramientas', 'Git'),
  ('Herramientas', 'Linux'),
  ('Herramientas', 'Docker'),
  ('Herramientas', 'LabVIEW'),
  ('Herramientas', 'Arduino'),
  ('Herramientas', 'Raspberry Pi'),
  ('Herramientas', 'COMSOL'),
  ('Herramientas', 'CAD'),
  ('Docencia y divulgación', 'Docencia'),
  ('Docencia y divulgación', 'Tutoría académica'),
  ('Docencia y divulgación', 'Divulgación científica'),
  ('Docencia y divulgación', 'Diseño de material educativo')
) as s(domain, name)
join public.skill_domains d on d.name = s.domain;
