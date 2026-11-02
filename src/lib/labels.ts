import type { Availability, CompanyStatus, ExperienceKind, OutputKind, PapaVisibility, ProgramLevel } from "@/lib/types";

export const LEVEL_LABEL: Record<ProgramLevel, string> = {
  pregrado: "Pregrado",
  especializacion: "Especialización",
  maestria: "Maestría",
  doctorado: "Doctorado",
};

export const SKILL_LEVEL = ["", "Básico", "Intermedio", "Avanzado"];
export const SKILL_LEVEL_HELP = [
  "",
  "Lo usé en clase",
  "Lo usé en un proyecto real",
  "Puedo enseñarlo o resolver problemas complejos con él",
];

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  disponible: "Disponible",
  en_proceso: "En proceso con una empresa",
  en_practica: "En práctica",
  sin_confirmar: "Sin confirmar",
  no_disponible: "No disponible",
  archivado: "Archivado",
};

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  registrada: "Registrada",
  en_revision: "En revisión",
  autorizada: "Autorizada",
  suspendida: "Suspendida",
  rechazada: "Rechazada",
};

export const MODALITY_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remota: "Remota",
  hibrida: "Híbrida",
};

export const DEDICATION_LABEL: Record<string, string> = {
  completo: "Tiempo completo",
  medio: "Medio tiempo",
  cualquiera: "Cualquiera",
};

export const VERIFIED_LABEL: Record<string, string> = {
  autodeclarado: "declarado por el estudiante",
  documento: "verificado con documento",
  coordinacion: "verificado por la Facultad",
};

export const EXPERIENCE_KIND: Record<ExperienceKind, string> = {
  laboral: "Laboral",
  practica: "Práctica",
  monitoria: "Monitoría",
  investigacion: "Investigación o semillero",
  voluntariado: "Voluntariado",
  extension: "Extensión",
  emprendimiento: "Emprendimiento",
};

export const OUTPUT_KIND: Record<OutputKind, string> = {
  articulo: "Artículo",
  ponencia: "Ponencia",
  poster: "Póster",
  capitulo: "Capítulo de libro",
  evento: "Evento",
  otro: "Otro",
};

export const PAPA_VISIBILITY: Record<PapaVisibility, string> = {
  nadie: "Nadie: no aparece en mi hoja de vida",
  facultad: "Solo la Facultad",
  autorizadas: "La Facultad y las empresas autorizadas",
};

export function formatMonth(iso: string | null) {
  if (!iso) return "";
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

export function daysSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function freshness(iso: string | null) {
  const days = daysSince(iso);
  if (days === null) return { text: "Sin confirmar", tone: "muted" as const };
  if (days === 0) return { text: "Confirmado hoy", tone: "good" as const };
  const text = `Confirmado hace ${days} ${days === 1 ? "día" : "días"}`;
  return { text, tone: days < 30 ? ("good" as const) : ("warn" as const) };
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
