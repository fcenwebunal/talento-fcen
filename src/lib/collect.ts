import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AVAILABILITY_LABEL, LEVEL_LABEL, MODALITY_LABEL, SKILL_LEVEL, VERIFIED_LABEL } from "./labels";
import { PUBLIC_SITE } from "./config";
import type { Availability, ProgramLevel } from "./types";

// «Recoger datos»: summary of the students companies can see, for the Faculty to send out. Same rules as the
// company views: only listed students (consent, program, looking for a practice); name and email only for those who
// agreed to share their contact; PAPA only when the student shows it to authorized companies.

export type CollectFilters = { programa: number | null; estado: "disponible" | "en_proceso" | "todos"; habilidad: number | null };

export type CollectedStudent = {
  id: string;
  name: string | null;
  email: string | null;
  program: string;
  level: string;
  status: string;
  progress: number | null;
  progressNote: string;
  papa: number | null;
  availability: string;
  period: string | null;
  from: string | null;
  city: string | null;
  modalities: string;
  languages: string;
  headline: string | null;
  skills: { name: string; level: number; domain: string }[];
  link: string;
};

export function filtersFrom(params: Record<string, string | undefined>): CollectFilters {
  const estado = params.estado === "en_proceso" || params.estado === "todos" ? params.estado : "disponible";
  return { programa: Number(params.programa) || null, estado, habilidad: Number(params.habilidad) || null };
}

type Row = {
  id: string;
  academic_status: "activo" | "egresado";
  availability: Availability;
  consent_contact: boolean;
  progress_pct: number | null;
  progress_verified: string;
  papa: number | null;
  papa_visibility: string;
  practice_period: string | null;
  available_from: string | null;
  city: string | null;
  modalities: string[];
  headline: string | null;
  profiles: { full_name: string | null; email: string } | null;
  programs: { name: string; level: ProgramLevel } | null;
  student_languages: { language: string; level: string }[];
  student_skills: { level: number; skills: { name: string; status: string; skill_domains: { name: string } | null } | null }[];
};

export async function collectStudents(supabase: SupabaseClient, filters: CollectFilters): Promise<CollectedStudent[]> {
  let query = supabase
    .from("students")
    .select(
      "id, academic_status, availability, consent_contact, progress_pct, progress_verified, papa, papa_visibility, practice_period, available_from, city, modalities, headline, profiles(full_name, email), programs(name, level), student_languages(language, level), student_skills(level, skills(name, status, skill_domains(name)))"
    )
    .eq("consent_anonymous", true)
    .not("program_id", "is", null)
    .in("availability", filters.estado === "todos" ? ["disponible", "en_proceso"] : [filters.estado])
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (filters.programa) query = query.eq("program_id", filters.programa);
  if (filters.habilidad) {
    const { data: withSkill } = await supabase.from("student_skills").select("student_id").eq("skill_id", filters.habilidad);
    query = query.in("id", (withSkill ?? []).map((r) => r.student_id));
  }
  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    name: r.consent_contact ? r.profiles?.full_name ?? null : null,
    email: r.consent_contact ? r.profiles?.email ?? null : null,
    program: r.programs?.name ?? "",
    level: r.programs ? LEVEL_LABEL[r.programs.level] : "",
    status: r.academic_status === "egresado" ? "Egresado reciente" : "Estudiante",
    progress: r.progress_pct,
    progressNote: VERIFIED_LABEL[r.progress_verified] ?? "",
    papa: r.papa_visibility === "autorizadas" ? r.papa : null,
    availability: AVAILABILITY_LABEL[r.availability],
    period: r.practice_period,
    from: r.available_from,
    city: r.city,
    modalities: r.modalities.map((m) => MODALITY_LABEL[m]).join(", "),
    languages: r.student_languages.map((l) => `${l.language} ${l.level}`).join(", "),
    headline: r.headline,
    skills: r.student_skills
      .filter((s) => s.skills && s.skills.status === "approved")
      .map((s) => ({ name: s.skills!.name, level: s.level, domain: s.skills!.skill_domains?.name ?? "" }))
      .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)),
    link: `${PUBLIC_SITE}/empresa/estudiantes/${r.id}`,
  }));
}

export const skillsText = (s: CollectedStudent) => s.skills.map((k) => `${k.name} (${SKILL_LEVEL[k.level].toLowerCase()})`).join(", ");
