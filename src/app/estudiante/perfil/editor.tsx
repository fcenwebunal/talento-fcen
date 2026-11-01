"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Area, Program, Skill, SkillDomain, SoftSkill } from "@/lib/types";
import { LEVEL_LABEL, VERIFIED_LABEL } from "@/lib/labels";
import { ListEditor } from "./list-editor";
import { SkillsPicker, type StudentSkill } from "./skills-picker";

type Nullable<T> = T | null;

type StudentRow = {
  program_id: Nullable<number>;
  academic_status: "activo" | "egresado";
  graduation_date: Nullable<string>;
  progress_pct: Nullable<number>;
  progress_verified: string;
  emphasis: Nullable<string>;
  honors: Nullable<string>;
  headline: Nullable<string>;
  about: Nullable<string>;
  motivation: Nullable<string>;
  city: Nullable<string>;
  modalities: string[];
  dedication: Nullable<string>;
  can_relocate: Nullable<boolean>;
  practice_cities: Nullable<string>;
  target_companies: Nullable<string>;
  practice_period: Nullable<string>;
  available_from: Nullable<string>;
  available_until: Nullable<string>;
  duration_months: Nullable<number>;
  area_other: Nullable<string>;
  linkedin_url: Nullable<string>;
  github_url: Nullable<string>;
  portfolio_url: Nullable<string>;
  consent_anonymous: boolean;
  consent_contact: boolean;
  truthful_declared: boolean;
};

type PrivateRow = {
  doc_type: Nullable<string>;
  doc_number: Nullable<string>;
  birth_date: Nullable<string>;
  phone: Nullable<string>;
  personal_email: Nullable<string>;
  eps: Nullable<string>;
  emergency_name: Nullable<string>;
  emergency_relation: Nullable<string>;
  emergency_phone: Nullable<string>;
};

type Language = { language: string; level: string; certificate: Nullable<string> };
type Experience = { organization: string; role: Nullable<string>; start_date: Nullable<string>; end_date: Nullable<string>; description: Nullable<string> };
type Project = { title: string; year: Nullable<number>; description: Nullable<string>; url: Nullable<string> };
type Course = { name: string; institution: Nullable<string>; year: Nullable<number>; hours: Nullable<number> };
type Subject = { name: string; reason: Nullable<string> };
type Doc = { id: number; kind: string; path: string; file_name: Nullable<string>; created_at: string };

export type ProfileData = {
  id: string;
  email: string;
  fullName: string;
  student: StudentRow | null;
  priv: PrivateRow | null;
  skills: StudentSkill[];
  softSkills: number[];
  areas: number[];
  languages: Language[];
  experiences: Experience[];
  projects: Project[];
  courses: Course[];
  subjects: Subject[];
  documents: Doc[];
  catalogs: { programs: Program[]; skills: Skill[]; domains: SkillDomain[]; softSkills: SoftSkill[]; areas: Area[] };
};

const SECTIONS = [
  { id: "personales", label: "1. Datos personales" },
  { id: "academico", label: "2. Información académica" },
  { id: "perfil", label: "3. Perfil y competencias" },
  { id: "experiencia", label: "4. Experiencia, proyectos e idiomas" },
  { id: "disponibilidad", label: "5. Intereses y disponibilidad" },
  { id: "documentos", label: "6. Documentos y autorización" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const DOC_KINDS = [
  { kind: "hoja_vida", label: "Hoja de vida en PDF (máximo 2 páginas)", help: "La ven las empresas autorizadas si aceptas compartir tu contacto." },
  { kind: "historia_academica", label: "Historia académica del SIA", help: "Solo la ve la Facultad, para verificar tu avance." },
  { kind: "foto", label: "Fotografía tipo documento (opcional)", help: "Solo la ven las empresas autorizadas, si aceptas compartir tu contacto." },
  { kind: "certificado", label: "Certificados de idiomas o cursos (opcional)", help: "Solo los ve la Facultad." },
];

const blank = (v: string) => (v.trim() === "" ? null : v.trim());

export function ProfileEditor({ data, initialSection }: { data: ProfileData; initialSection?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [section, setSection] = useState<SectionId>(
    SECTIONS.some((s) => s.id === initialSection) ? (initialSection as SectionId) : "personales"
  );
  const [student, setStudent] = useState<StudentRow>(data.student!);
  const [priv, setPriv] = useState<PrivateRow>(
    data.priv ?? {
      doc_type: null, doc_number: null, birth_date: null, phone: null, personal_email: null,
      eps: null, emergency_name: null, emergency_relation: null, emergency_phone: null,
    }
  );
  const [fullName, setFullName] = useState(data.fullName);
  const [skills, setSkills] = useState<StudentSkill[]>(data.skills);
  const [softSkills, setSoftSkills] = useState<number[]>(data.softSkills);
  const [areas, setAreas] = useState<number[]>(data.areas);
  const [languages, setLanguages] = useState<Language[]>(data.languages);
  const [experiences, setExperiences] = useState<Experience[]>(data.experiences);
  const [projects, setProjects] = useState<Project[]>(data.projects);
  const [courses, setCourses] = useState<Course[]>(data.courses);
  const [subjects, setSubjects] = useState<Subject[]>(data.subjects);
  const [documents, setDocuments] = useState<Doc[]>(data.documents);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const s = <K extends keyof StudentRow>(key: K, value: StudentRow[K]) => setStudent((prev) => ({ ...prev, [key]: value }));
  const p = <K extends keyof PrivateRow>(key: K, value: PrivateRow[K]) => setPriv((prev) => ({ ...prev, [key]: value }));
  const text = (v: Nullable<string>) => v ?? "";

  async function replace(table: string, rows: Record<string, unknown>[]) {
    const del = await supabase.from(table).delete().eq("student_id", data.id);
    if (del.error) throw del.error;
    if (rows.length === 0) return;
    const ins = await supabase.from(table).insert(rows.map((r) => ({ ...r, student_id: data.id })));
    if (ins.error) throw ins.error;
  }

  async function updateStudent(fields: Partial<StudentRow>) {
    const { error } = await supabase.from("students").update(fields).eq("id", data.id);
    if (error) throw error;
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      if (section === "personales") {
        const prof = await supabase.from("profiles").update({ full_name: blank(fullName) }).eq("id", data.id);
        if (prof.error) throw prof.error;
        const pr = await supabase.from("student_private").update(priv).eq("student_id", data.id);
        if (pr.error) throw pr.error;
        await updateStudent({
          city: student.city, linkedin_url: student.linkedin_url, github_url: student.github_url, portfolio_url: student.portfolio_url,
        });
      } else if (section === "academico") {
        await updateStudent({
          program_id: student.program_id, academic_status: student.academic_status,
          graduation_date: student.academic_status === "egresado" ? student.graduation_date : null,
          progress_pct: student.progress_pct, practice_period: student.practice_period,
          emphasis: student.emphasis, honors: student.honors,
        });
        await replace("relevant_subjects", subjects.filter((x) => x.name.trim()));
      } else if (section === "perfil") {
        await updateStudent({ headline: student.headline, about: student.about });
        await replace("student_skills", skills);
        await replace("student_soft_skills", softSkills.map((id) => ({ soft_skill_id: id })));
      } else if (section === "experiencia") {
        await replace("experiences", experiences.filter((x) => x.organization.trim()));
        await replace("projects", projects.filter((x) => x.title.trim()));
        await replace("courses", courses.filter((x) => x.name.trim()));
        await replace("student_languages", languages.filter((x) => x.language.trim() && x.level));
      } else if (section === "disponibilidad") {
        await updateStudent({
          modalities: student.modalities, dedication: student.dedication, can_relocate: student.can_relocate,
          practice_cities: student.practice_cities, target_companies: student.target_companies,
          available_from: student.available_from, available_until: student.available_until,
          duration_months: student.duration_months, motivation: student.motivation, area_other: student.area_other,
        });
        await replace("student_areas", areas.map((id) => ({ area_id: id })));
      } else if (section === "documentos") {
        await updateStudent({
          consent_anonymous: student.consent_anonymous, consent_contact: student.consent_contact,
          truthful_declared: student.truthful_declared,
        });
      }
      setStatus({ tone: "ok", text: "Cambios guardados." });
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : (e as { message?: string })?.message;
      setStatus({ tone: "error", text: `No se pudo guardar. ${message ?? ""}` });
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: string, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ tone: "error", text: "El archivo supera los 5 MB." });
      return;
    }
    const safe = file.name.normalize("NFD").replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${data.id}/${kind}/${Date.now()}-${safe}`;
    const up = await supabase.storage.from("documentos").upload(path, file, { contentType: file.type });
    if (up.error) {
      setStatus({ tone: "error", text: `No se pudo subir el archivo. ${up.error.message}` });
      return;
    }
    const { data: row, error } = await supabase
      .from("documents")
      .insert({ student_id: data.id, kind, path, file_name: file.name, size_bytes: file.size })
      .select("id, kind, path, file_name, created_at")
      .single();
    if (error) {
      setStatus({ tone: "error", text: error.message });
      return;
    }
    setDocuments((prev) => [row as Doc, ...prev]);
    setStatus({ tone: "ok", text: "Archivo subido." });
  }

  async function removeDoc(doc: Doc) {
    await supabase.storage.from("documentos").remove([doc.path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  async function openDoc(doc: Doc) {
    const { data: signed } = await supabase.storage.from("documentos").createSignedUrl(doc.path, 120);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank", "noopener");
  }

  const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const programsByLevel = data.catalogs.programs.reduce<Record<string, Program[]>>((acc, pr) => {
    (acc[pr.level] ??= []).push(pr);
    return acc;
  }, {});

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Secciones del perfil">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setSection(sec.id);
              setStatus(null);
            }}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-bold ${section === sec.id ? "bg-azul text-white" : "bg-superficie text-azul-oscuro hover:bg-superficie-2"}`}
          >
            {sec.label}
          </button>
        ))}
        <Link href="/estudiante" className="shrink-0 rounded-lg px-3 py-2 text-sm text-suave hover:text-azul">
          ← Volver a mi panel
        </Link>
      </nav>

      <div className="card">
        {section === "personales" && (
          <div className="space-y-6">
            <Lock text="Tu documento, fecha de nacimiento, EPS y contacto de emergencia nunca los ve una empresa: solo la Facultad, para formalizar tu práctica." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombres y apellidos completos">
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Correo institucional" help="Viene de tu cuenta y no se puede cambiar.">
                <input className="input bg-superficie" value={data.email} readOnly />
              </Field>
              <Field label="Tipo de documento" lock>
                <select className="input" value={text(priv.doc_type)} onChange={(e) => p("doc_type", blank(e.target.value))}>
                  <option value="">Elegir…</option>
                  <option>Cédula de ciudadanía</option>
                  <option>Tarjeta de identidad</option>
                  <option>Cédula de extranjería</option>
                  <option>Pasaporte</option>
                  <option>Permiso por protección temporal</option>
                </select>
              </Field>
              <Field label="Número de documento" lock>
                <input className="input" value={text(priv.doc_number)} onChange={(e) => p("doc_number", blank(e.target.value))} />
              </Field>
              <Field label="Fecha de nacimiento" lock>
                <input className="input" type="date" value={text(priv.birth_date)} onChange={(e) => p("birth_date", blank(e.target.value))} />
              </Field>
              <Field label="Ciudad de residencia">
                <input className="input" value={text(student.city)} onChange={(e) => s("city", blank(e.target.value))} />
              </Field>
              <Field label="Teléfono" help="Lo ven las empresas autorizadas si aceptas compartir tu contacto.">
                <input className="input" type="tel" value={text(priv.phone)} onChange={(e) => p("phone", blank(e.target.value))} />
              </Field>
              <Field label="Correo personal" lock>
                <input className="input" type="email" value={text(priv.personal_email)} onChange={(e) => p("personal_email", blank(e.target.value))} />
              </Field>
              <Field label="LinkedIn">
                <input className="input" type="url" placeholder="https://www.linkedin.com/in/…" value={text(student.linkedin_url)} onChange={(e) => s("linkedin_url", blank(e.target.value))} />
              </Field>
              <Field label="GitHub">
                <input className="input" type="url" placeholder="https://github.com/…" value={text(student.github_url)} onChange={(e) => s("github_url", blank(e.target.value))} />
              </Field>
              <Field label="Portafolio o sitio personal">
                <input className="input" type="url" value={text(student.portfolio_url)} onChange={(e) => s("portfolio_url", blank(e.target.value))} />
              </Field>
              <Field label="EPS a la que estás afiliado" lock>
                <input className="input" value={text(priv.eps)} onChange={(e) => p("eps", blank(e.target.value))} />
              </Field>
            </div>
            <div>
              <h3 className="font-bold text-azul-oscuro">Contacto de emergencia</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <Field label="Nombre" lock>
                  <input className="input" value={text(priv.emergency_name)} onChange={(e) => p("emergency_name", blank(e.target.value))} />
                </Field>
                <Field label="Parentesco" lock>
                  <input className="input" value={text(priv.emergency_relation)} onChange={(e) => p("emergency_relation", blank(e.target.value))} />
                </Field>
                <Field label="Teléfono" lock>
                  <input className="input" type="tel" value={text(priv.emergency_phone)} onChange={(e) => p("emergency_phone", blank(e.target.value))} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {section === "academico" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Programa curricular">
                <select className="input" value={student.program_id ?? ""} onChange={(e) => s("program_id", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Elegir…</option>
                  {Object.entries(programsByLevel).map(([level, list]) => (
                    <optgroup key={level} label={LEVEL_LABEL[level as keyof typeof LEVEL_LABEL]}>
                      {list.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Situación">
                <select className="input" value={student.academic_status} onChange={(e) => s("academic_status", e.target.value as StudentRow["academic_status"])}>
                  <option value="activo">Estudiante activo</option>
                  <option value="egresado">Egresado reciente</option>
                </select>
              </Field>
              {student.academic_status === "egresado" && (
                <Field label="Fecha de grado" help="La plataforma te mantiene activo hasta 12 meses después de tu grado.">
                  <input className="input" type="date" value={text(student.graduation_date)} onChange={(e) => s("graduation_date", blank(e.target.value))} />
                </Field>
              )}
              <Field label="Porcentaje de avance en el plan de estudios" help={`Estado: ${VERIFIED_LABEL[student.progress_verified] ?? student.progress_verified}. Sube tu historia académica en la sección 6 para que la Facultad lo verifique.`}>
                <input className="input" type="number" min={0} max={100} step={0.1} value={student.progress_pct ?? ""} onChange={(e) => s("progress_pct", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Periodo académico de la práctica" help="Por ejemplo, 2027-1.">
                <input className="input" placeholder="2027-1" value={text(student.practice_period)} onChange={(e) => s("practice_period", blank(e.target.value))} />
              </Field>
              <Field label="Líneas de profundización o énfasis">
                <input className="input" value={text(student.emphasis)} onChange={(e) => s("emphasis", blank(e.target.value))} />
              </Field>
            </div>
            <Field label="Reconocimientos académicos, monitorías o becas (si aplica)">
              <textarea className="input" value={text(student.honors)} onChange={(e) => s("honors", blank(e.target.value))} />
            </Field>
            <div>
              <h3 className="font-bold text-azul-oscuro">Asignaturas más relevantes para la práctica (máximo 5)</h3>
              <div className="mt-3">
                <ListEditor
                  items={subjects}
                  onChange={setSubjects}
                  max={5}
                  empty={{ name: "", reason: null }}
                  addLabel="Agregar asignatura"
                  fields={[
                    { key: "name", label: "Asignatura" },
                    { key: "reason", label: "Por qué es relevante" },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {section === "perfil" && (
          <div className="space-y-6">
            <Field label="Titular" help="Una línea que te presente. Ejemplo: «Estudiante de Estadística con experiencia en encuestas y R».">
              <input className="input" maxLength={140} value={text(student.headline)} onChange={(e) => s("headline", blank(e.target.value))} />
            </Field>
            <Field label="Perfil profesional" help="De 4 a 6 líneas: quién eres, qué sabes hacer y qué aportas. No incluyas datos de contacto: las empresas sin autorización también leen este texto.">
              <textarea className="input min-h-32" maxLength={1200} value={text(student.about)} onChange={(e) => s("about", blank(e.target.value))} />
            </Field>
            <div>
              <h3 className="font-bold text-azul-oscuro">Competencias técnicas</h3>
              <p className="mt-1 text-sm text-suave">Elige del catálogo e indica tu nivel. Una habilidad con evidencia vale más que una lista larga.</p>
              <div className="mt-3">
                <SkillsPicker catalog={data.catalogs.skills} domains={data.catalogs.domains} value={skills} onChange={setSkills} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-azul-oscuro">Competencias transversales</h3>
              <p className="mt-1 text-sm text-suave">Marca las 3 a 5 que mejor te describen ({softSkills.length} marcadas).</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.catalogs.softSkills.map((x) => (
                  <label key={x.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={softSkills.includes(x.id)}
                      disabled={!softSkills.includes(x.id) && softSkills.length >= 5}
                      onChange={() => setSoftSkills(toggle(softSkills, x.id))}
                    />
                    {x.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "experiencia" && (
          <div className="space-y-8">
            <Block title="Experiencia laboral, voluntariados o prácticas previas" help="Si no tienes, déjalo en blanco.">
              <ListEditor
                items={experiences}
                onChange={setExperiences}
                empty={{ organization: "", role: null, start_date: null, end_date: null, description: null }}
                addLabel="Agregar experiencia"
                fields={[
                  { key: "organization", label: "Organización" },
                  { key: "role", label: "Cargo o rol" },
                  { key: "start_date", label: "Desde", type: "date" },
                  { key: "end_date", label: "Hasta", type: "date" },
                  { key: "description", label: "Principales funciones o logros", type: "textarea" },
                ]}
              />
            </Block>
            <Block title="Proyectos académicos, de investigación o personales" help="Cuenta qué hiciste tú y qué resultado obtuviste. El enlace solo lo ven las empresas autorizadas.">
              <ListEditor
                items={projects}
                onChange={setProjects}
                empty={{ title: "", year: null, description: null, url: null }}
                addLabel="Agregar proyecto"
                fields={[
                  { key: "title", label: "Proyecto" },
                  { key: "year", label: "Año", type: "number" },
                  { key: "description", label: "Qué hiciste y qué resultado obtuviste", type: "textarea" },
                  { key: "url", label: "Enlace (si existe)", type: "url", wide: true },
                ]}
              />
            </Block>
            <Block title="Cursos, certificaciones o semilleros">
              <ListEditor
                items={courses}
                onChange={setCourses}
                empty={{ name: "", institution: null, year: null, hours: null }}
                addLabel="Agregar curso"
                fields={[
                  { key: "name", label: "Nombre" },
                  { key: "institution", label: "Institución" },
                  { key: "year", label: "Año", type: "number" },
                  { key: "hours", label: "Horas", type: "number" },
                ]}
              />
            </Block>
            <Block title="Idiomas">
              <ListEditor
                items={languages}
                onChange={setLanguages}
                empty={{ language: "", level: "", certificate: null }}
                addLabel="Agregar idioma"
                fields={[
                  { key: "language", label: "Idioma", placeholder: "Inglés" },
                  { key: "level", label: "Nivel (MCER)", type: "select", options: ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"] },
                  { key: "certificate", label: "Certificado (sí, no, cuál)", wide: true },
                ]}
              />
            </Block>
          </div>
        )}

        {section === "disponibilidad" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-azul-oscuro">Áreas en las que te gustaría hacer la práctica</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.catalogs.areas.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={areas.includes(a.id)} onChange={() => setAreas(toggle(areas, a.id))} />
                    {a.name}
                  </label>
                ))}
              </div>
              <div className="mt-3 max-w-md">
                <Field label="Otra, ¿cuál?">
                  <input className="input" value={text(student.area_other)} onChange={(e) => s("area_other", blank(e.target.value))} />
                </Field>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha a partir de la cual puedes iniciar">
                <input className="input" type="date" value={text(student.available_from)} onChange={(e) => s("available_from", blank(e.target.value))} />
              </Field>
              <Field label="Fecha hasta la cual buscas práctica" help="Al pasar esta fecha, tu perfil sale de las búsquedas.">
                <input className="input" type="date" value={text(student.available_until)} onChange={(e) => s("available_until", blank(e.target.value))} />
              </Field>
              <Field label="Duración de la práctica (meses)">
                <input className="input" type="number" min={1} max={24} value={student.duration_months ?? ""} onChange={(e) => s("duration_months", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="Dedicación">
                <select className="input" value={text(student.dedication)} onChange={(e) => s("dedication", blank(e.target.value))}>
                  <option value="">Elegir…</option>
                  <option value="completo">Tiempo completo</option>
                  <option value="medio">Medio tiempo</option>
                  <option value="cualquiera">Cualquiera</option>
                </select>
              </Field>
            </div>
            <div>
              <span className="text-sm font-bold">Modalidad aceptada</span>
              <div className="mt-2 flex flex-wrap gap-4">
                {[
                  ["presencial", "Presencial"],
                  ["remota", "Remota"],
                  ["hibrida", "Híbrida"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={student.modalities.includes(value)}
                      onChange={() =>
                        s("modalities", student.modalities.includes(value) ? student.modalities.filter((m) => m !== value) : [...student.modalities, value])
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ciudades donde puedes hacer la práctica">
                <input className="input" value={text(student.practice_cities)} onChange={(e) => s("practice_cities", blank(e.target.value))} />
              </Field>
              <Field label="¿Tienes disponibilidad para trasladarte de ciudad?">
                <select
                  className="input"
                  value={student.can_relocate === null ? "" : student.can_relocate ? "si" : "no"}
                  onChange={(e) => s("can_relocate", e.target.value === "" ? null : e.target.value === "si")}
                >
                  <option value="">Elegir…</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
            <Field label="Empresas de interés específico (si las tienes)">
              <input className="input" value={text(student.target_companies)} onChange={(e) => s("target_companies", blank(e.target.value))} />
            </Field>
            <Field label="¿Por qué quieres hacer la práctica y qué esperas aprender?" help="Máximo 5 líneas.">
              <textarea className="input" maxLength={800} value={text(student.motivation)} onChange={(e) => s("motivation", blank(e.target.value))} />
            </Field>
          </div>
        )}

        {section === "documentos" && (
          <div className="space-y-8">
            <div className="space-y-4">
              {DOC_KINDS.map((d) => {
                const docs = documents.filter((x) => x.kind === d.kind);
                return (
                  <div key={d.kind} className="rounded-lg border border-borde p-4">
                    <p className="font-bold">{d.label}</p>
                    <p className="text-sm text-suave">{d.help}</p>
                    {docs.map((doc) => (
                      <div key={doc.id} className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <button type="button" className="text-azul-medio underline underline-offset-2" onClick={() => openDoc(doc)}>
                          {doc.file_name ?? "Archivo"}
                        </button>
                        <button type="button" className="text-naranja hover:underline" onClick={() => removeDoc(doc)}>
                          Quitar
                        </button>
                      </div>
                    ))}
                    <input
                      type="file"
                      accept={d.kind === "foto" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png"}
                      className="mt-3 block text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(d.kind, file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                );
              })}
              <p className="text-xs text-suave">
                La copia del documento de identidad y el certificado de la EPS se piden solo al formalizar la práctica.
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-superficie p-4">
              <h3 className="font-bold text-azul-oscuro">Autorización para el tratamiento de datos personales</h3>
              <p className="text-sm text-suave">
                En cumplimiento de la Ley 1581 de 2012, autorizas a la Universidad Nacional de Colombia a tratar tus datos para
                conectarte con empresas que buscan practicantes. Puedes cambiar estas opciones cuando quieras.{" "}
                <Link href="/datos-personales" className="text-azul-medio underline" target="_blank">
                  Leer el tratamiento de datos
                </Link>
                .
              </p>
              <Check
                checked={student.consent_anonymous}
                onChange={(v) => setStudent((prev) => ({ ...prev, consent_anonymous: v, consent_contact: v ? prev.consent_contact : false }))}
                label="Acepto aparecer, sin mi nombre ni mis datos de contacto, en las búsquedas de las empresas registradas."
              />
              <Check
                checked={student.consent_contact}
                disabled={!student.consent_anonymous}
                onChange={(v) => s("consent_contact", v)}
                label="Acepto que las empresas autorizadas por la Facultad vean mi nombre, correo institucional, teléfono, enlaces y hoja de vida, y que me incluyan en sus listados exportados."
              />
              <Check
                checked={student.truthful_declared}
                onChange={(v) => s("truthful_declared", v)}
                label="Declaro que la información suministrada es veraz y puede ser verificada."
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-borde pt-5">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar esta sección"}
          </button>
          {status && <p className={`text-sm ${status.tone === "ok" ? "text-verde-tinta" : "text-naranja"}`}>{status.text}</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, help, lock, children }: { label: string; help?: string; lock?: boolean; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="flex items-center gap-2">
        {label}
        {lock && <span className="chip px-2 py-0 text-[0.6875rem]">Solo la Facultad</span>}
      </span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}

function Block({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-azul-oscuro">{title}</h3>
      {help && <p className="mt-1 text-sm text-suave">{help}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Lock({ text }: { text: string }) {
  return <p className="rounded-lg border border-azul/20 bg-azul/5 p-3 text-sm text-azul-oscuro">{text}</p>;
}

function Check({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 text-sm ${disabled ? "opacity-50" : ""}`}>
      <input type="checkbox" className="mt-1" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
