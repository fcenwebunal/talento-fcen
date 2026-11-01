"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Briefcase, CalendarDays, Check, CheckCircle2, FileText, FileUp, GraduationCap, Loader2, Lock, Save,
  ShieldCheck, Sparkles, Trash2, TriangleAlert, UserRound, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Area, Program, Skill, SkillDomain, SoftSkill } from "@/lib/types";
import { LEVEL_LABEL, VERIFIED_LABEL } from "@/lib/labels";
import { HelpTip } from "@/components/ui/help-tip";
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

const SECTIONS: readonly { id: string; label: string; short: string; icon: LucideIcon; intro: string }[] = [
  { id: "personales", label: "Datos personales", short: "Personales", icon: UserRound, intro: "Quién eres y cómo contactarte. Lo sensible solo lo ve la Facultad." },
  { id: "academico", label: "Información académica", short: "Académico", icon: GraduationCap, intro: "Tu programa, tu avance y las asignaturas que te preparan para la práctica." },
  { id: "perfil", label: "Perfil y competencias", short: "Competencias", icon: Sparkles, intro: "Lo primero que leen las empresas: tu titular, tu perfil y tus habilidades." },
  { id: "experiencia", label: "Experiencia, proyectos e idiomas", short: "Experiencia", icon: Briefcase, intro: "La evidencia de lo que sabes hacer." },
  { id: "disponibilidad", label: "Intereses y disponibilidad", short: "Disponibilidad", icon: CalendarDays, intro: "Cuándo, cómo y dónde puedes hacer la práctica." },
  { id: "documentos", label: "Documentos y autorización", short: "Documentos", icon: FileText, intro: "Tu hoja de vida y quién puede ver tus datos." },
] as const;

type SectionId = string;

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

  const current = SECTIONS.find((x) => x.id === section) ?? SECTIONS[0];
  const currentIndex = SECTIONS.indexOf(current);

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="Secciones del perfil">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {SECTIONS.map((sec, i) => {
            const active = section === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setSection(sec.id);
                  setStatus(null);
                  window.history.replaceState(null, "", `?seccion=${sec.id}`);
                }}
                className={`group relative flex shrink-0 items-center gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] px-3 py-2.5 text-left text-sm transition-all ${active ? "bg-azul text-white shadow-lg" : "bg-white text-azul-oscuro shadow-sm hover:bg-celeste"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-celeste text-azul"}`}>
                  <sec.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-black">
                  <span className={`mr-1 text-xs ${active ? "text-verde" : "text-suave"}`}>{i + 1}.</span>
                  <span className="lg:hidden">{sec.short}</span>
                  <span className="hidden lg:inline">{sec.label}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Link href="/estudiante" className="mt-3 hidden items-center gap-2 px-3 py-2 text-sm text-suave hover:text-azul lg:flex">
          <ArrowLeft className="h-4 w-4" /> Volver a mi panel
        </Link>
      </nav>

      <div key={section} className="card page-in p-5 md:p-8">
        <header className="mb-6 flex items-start gap-4 border-b border-borde pb-5">
          <span className="icon-tile h-12 w-12">
            <current.icon />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-suave">
              Paso {currentIndex + 1} de {SECTIONS.length}
            </p>
            <h2 className="display text-2xl text-azul-oscuro">{current.label}</h2>
            <p className="text-sm text-suave">{current.intro}</p>
          </div>
        </header>
        {section === "personales" && (
          <div className="space-y-6">
            <PrivacyNote text="Tu documento, fecha de nacimiento, EPS y contacto de emergencia nunca los ve una empresa: solo la Facultad, para formalizar tu práctica." />
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
              <h3 className="font-black text-azul-oscuro">Contacto de emergencia</h3>
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
              <h3 className="font-black text-azul-oscuro">Asignaturas más relevantes para la práctica (máximo 5)</h3>
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
              <h3 className="font-black text-azul-oscuro">Competencias técnicas</h3>
              <p className="mt-1 text-sm text-suave">Elige del catálogo e indica tu nivel. Una habilidad con evidencia vale más que una lista larga.</p>
              <div className="mt-3">
                <SkillsPicker catalog={data.catalogs.skills} domains={data.catalogs.domains} value={skills} onChange={setSkills} />
              </div>
            </div>
            <div>
              <h3 className="font-black text-azul-oscuro">Competencias transversales</h3>
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
              <h3 className="font-black text-azul-oscuro">Áreas en las que te gustaría hacer la práctica</h3>
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
              <span className="text-sm font-black">Modalidad aceptada</span>
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
              <div className="grid gap-4 md:grid-cols-2">
                {DOC_KINDS.map((d) => {
                  const docs = documents.filter((x) => x.kind === d.kind);
                  return (
                    <div key={d.kind} className="rounded-[1rem_1rem_1rem_0.25rem] border border-borde bg-white p-4">
                      <p className="flex items-center gap-2 font-black text-azul-oscuro">
                        <FileText className="h-4 w-4 text-azul-medio" aria-hidden="true" />
                        {d.label}
                        <HelpTip>{d.help}</HelpTip>
                      </p>
                      {docs.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {docs.map((doc) => (
                            <li key={doc.id} className="flex items-center gap-2 rounded-lg bg-verde-claro px-3 py-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-verde-tinta" aria-hidden="true" />
                              <button type="button" className="flex-1 truncate text-left text-azul-oscuro underline-offset-2 hover:underline" onClick={() => openDoc(doc)}>
                                {doc.file_name ?? "Archivo"}
                              </button>
                              <button type="button" className="rounded p-1 text-naranja hover:bg-white" onClick={() => removeDoc(doc)} aria-label="Quitar archivo">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <label className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border-2 border-dashed border-borde px-4 py-5 text-center text-sm text-suave transition-colors hover:border-azul hover:bg-celeste">
                        <FileUp className="h-6 w-6 text-azul" aria-hidden="true" />
                        <span className="font-black text-azul">{docs.length ? "Subir otro archivo" : "Elegir archivo"}</span>
                        <span className="text-xs">{d.kind === "foto" ? "JPG, PNG o WebP" : "PDF, JPG o PNG"} · máximo 5 MB</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept={d.kind === "foto" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) upload(d.kind, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-suave">
                La copia del documento de identidad y el certificado de la EPS se piden solo al formalizar la práctica.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-black text-azul-oscuro"><ShieldCheck className="h-5 w-5 text-azul" aria-hidden="true" /> Autorización para el tratamiento de datos personales</h3>
              <p className="text-sm text-suave">
                En cumplimiento de la Ley 1581 de 2012, autorizas a la Universidad Nacional de Colombia a tratar tus datos para
                conectarte con empresas que buscan practicantes. Puedes cambiar estas opciones cuando quieras.{" "}
                <Link href="/datos-personales" className="text-azul-medio underline" target="_blank">
                  Leer el tratamiento de datos
                </Link>
                .
              </p>
              <Consent
                checked={student.consent_anonymous}
                onChange={(v) => setStudent((prev) => ({ ...prev, consent_anonymous: v, consent_contact: v ? prev.consent_contact : false }))}
                label="Acepto aparecer, sin mi nombre ni mis datos de contacto, en las búsquedas de las empresas registradas."
              />
              <Consent
                checked={student.consent_contact}
                disabled={!student.consent_anonymous}
                onChange={(v) => s("consent_contact", v)}
                label="Acepto que las empresas autorizadas por la Facultad vean mi nombre, correo institucional, teléfono, enlaces y hoja de vida, y que me incluyan en sus listados exportados."
              />
              <Consent
                checked={student.truthful_declared}
                onChange={(v) => s("truthful_declared", v)}
                label="Declaro que la información suministrada es veraz y puede ser verificada."
              />
            </div>
          </div>
        )}

        <div className="sticky bottom-3 z-20 -mx-2 mt-8 flex flex-wrap items-center gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-borde bg-white/95 p-3 shadow-lg backdrop-blur md:-mx-4">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Guardando…" : "Guardar esta sección"}
          </button>
          {currentIndex < SECTIONS.length - 1 && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSection(SECTIONS[currentIndex + 1].id);
                setStatus(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Siguiente: {SECTIONS[currentIndex + 1].short}
            </button>
          )}
          {status && (
            <p
              className={`ml-auto flex items-center gap-2 text-sm font-black ${status.tone === "ok" ? "text-verde-tinta" : "text-naranja"}`}
              style={{ animation: "pop 0.35s var(--ease-out) both" }}
              role="status"
            >
              {status.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
              {status.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, help, tip, lock, children }: { label: string; help?: string; tip?: string; lock?: boolean; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="flex flex-wrap items-center gap-1.5">
        {label}
        {tip && <HelpTip>{tip}</HelpTip>}
        {lock && (
          <span className="chip ml-auto px-2 py-0 text-[0.6875rem]" title="Este dato nunca lo ve una empresa">
            <Lock /> Solo la Facultad
          </span>
        )}
      </span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}

function Block({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
        <span className="h-4 w-1 rounded-r bg-verde" aria-hidden="true" />
        {title}
        {help && <HelpTip>{help}</HelpTip>}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PrivacyNote({ text }: { text: string }) {
  return (
    <p className="flex gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-azul/15 bg-celeste p-4 text-sm text-azul-oscuro">
      <ShieldCheck className="h-5 w-5 shrink-0 text-azul" aria-hidden="true" />
      {text}
    </p>
  );
}

function Consent({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border p-4 text-sm transition-colors ${checked ? "border-verde bg-verde-claro" : "border-borde bg-white hover:border-azul"} ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-verde bg-verde text-white" : "border-borde bg-white"}`}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
