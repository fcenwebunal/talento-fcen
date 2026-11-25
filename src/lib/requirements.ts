// Required CV data chosen by the administrators (table profile_requirements, function profile_checklist).

export type RequirementItem = {
  key: string;
  section: string;
  label: string;
  required: boolean;
  min: number | null;
  max: number | null;
  value: number;
  ok: boolean;
};

export type RequirementConfig = {
  key: string;
  section: string;
  label: string;
  sort: number;
  max_count: number | null;
  required: boolean;
  min_count: number | null;
  updated_at: string;
  updated_by: string | null;
};

export const PROFILE_SECTIONS = [
  { id: "personales", label: "Datos personales" },
  { id: "academico", label: "Información académica" },
  { id: "perfil", label: "Perfil y competencias" },
  { id: "experiencia", label: "Experiencia, proyectos e idiomas" },
  { id: "disponibilidad", label: "Intereses y disponibilidad" },
  { id: "documentos", label: "Documentos y autorización" },
] as const;

export const SECTION_LABEL: Record<string, string> = Object.fromEntries(PROFILE_SECTIONS.map((s) => [s.id, s.label]));

export const isCountItem = (item: { max: number | null } | { max_count: number | null }) =>
  ("max" in item ? item.max : item.max_count) !== null;

// «Competencias técnicas (al menos 3)» for lists, the plain label for single data
export function requirementLabel(item: RequirementItem) {
  return item.max !== null && item.min !== null ? `${item.label} (al menos ${item.min})` : item.label;
}

export function missingRequired(items: RequirementItem[]) {
  return items.filter((i) => i.required && !i.ok);
}

export function missingBySection(items: RequirementItem[]) {
  const out: Record<string, RequirementItem[]> = {};
  for (const i of missingRequired(items)) (out[i.section] ??= []).push(i);
  return out;
}

export const LISTED_RULE =
  "Mientras falte algo obligatorio, tu hoja de vida no aparece ante las empresas y no puedes postularte a convocatorias.";
