export type CallStatus = "borrador" | "publicada" | "cerrada";
export type ApplicationStatus = "recibida" | "en_revision" | "enviada" | "seleccionada" | "no_seleccionada" | "retirada";
export type ContractType = "convenio_practica" | "contrato_aprendizaje" | "vinculacion_formativa" | "pasantia" | "otro";
export type CallLanguage = { language: string; level: string };

export type Call = {
  id: string;
  code: number;
  status: CallStatus;
  company_id: string | null;
  company_name: string;
  company_brand: string | null;
  logo_path: string | null;
  title: string;
  summary: string | null;
  openings: number | null;
  start_date: string | null;
  deadline: string;
  profile: string | null;
  academic_requirement: string | null;
  enforce_requirements: boolean;
  min_progress: number | null;
  min_papa: number | null;
  duties: string | null;
  knowledge: string | null;
  languages: CallLanguage[];
  contract_type: ContractType | null;
  paid: boolean;
  stipend: number | null;
  stipend_note: string | null;
  duration_months: number | null;
  schedule: string | null;
  city: string | null;
  modality: "presencial" | "remota" | "hibrida" | null;
  benefits: string | null;
  extra_info: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CallWithRelations = Call & {
  call_programs: { program_id: number; programs: { name: string } | null }[];
  call_skills: { skill_id: number; level: number; skills: { name: string; icon_path: string | null } | null }[];
  companies: { name: string; logo_path: string | null } | null;
};

export const CALL_SELECT =
  "*, call_programs(program_id, programs(name)), call_skills(skill_id, level, skills(name, icon_path)), companies(name, logo_path)";

export type ReadinessItem = { key: string; label: string; section: string; ok: boolean; value?: number | null; verified?: string };

export type Readiness = {
  open: boolean;
  student: boolean;
  can_apply: boolean;
  enforced?: boolean;
  profile?: ReadinessItem[];
  profile_ok?: boolean;
  requirements?: ReadinessItem[];
  requirements_ok?: boolean;
  recommended?: ReadinessItem[];
  application?: { id: number; status: ApplicationStatus; created_at: string } | null;
};

export type Applicant = {
  id: number;
  student_id: string;
  status: ApplicationStatus;
  message: string | null;
  meets_requirements: boolean;
  created_at: string;
  status_changed_at: string;
  staff_note: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  headline: string | null;
  program: string | null;
  progress_pct: number | null;
  progress_verified: string;
  papa: number | null;
};

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  cerrada: "Cerrada",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  recibida: "Recibida",
  en_revision: "En revisión",
  enviada: "Enviada a la empresa",
  seleccionada: "Seleccionada",
  no_seleccionada: "No seleccionada",
  retirada: "Retirada",
};

export const APPLICATION_STATUS_CHIP: Record<ApplicationStatus, string> = {
  recibida: "chip-azul",
  en_revision: "chip-amarillo",
  enviada: "chip-azul",
  seleccionada: "chip-verde",
  no_seleccionada: "chip-naranja",
  retirada: "",
};

export const CONTRACT_LABEL: Record<ContractType, string> = {
  convenio_practica: "Convenio de práctica",
  contrato_aprendizaje: "Contrato de aprendizaje (cuota SENA)",
  vinculacion_formativa: "Vinculación formativa",
  pasantia: "Pasantía",
  otro: "Otro",
};

export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Calendar date in Colombia («2026-11-24»): a call stays open the whole day of its deadline
export function todayCo() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

export function isOpen(call: Pick<Call, "status" | "deadline">, today = todayCo()) {
  return call.status === "publicada" && call.deadline >= today;
}

export function daysLeft(deadline: string, today = todayCo()) {
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86_400_000);
}

export function deadlineText(deadline: string, today = todayCo()) {
  const days = daysLeft(deadline, today);
  if (days < 0) return "Cerrada";
  if (days === 0) return "Cierra hoy";
  if (days === 1) return "Cierra mañana";
  return `Quedan ${days} días`;
}

export function formatMoney(value: number | null) {
  if (value === null) return "";
  return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function formatLongDate(iso: string | null) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

// Free text typed one item per line («- Apoyar...», «1. Medir...») shown as a list
export function lines(value: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export function callPrograms(call: CallWithRelations) {
  return call.call_programs.map((p) => p.programs?.name).filter((n): n is string => !!n);
}

type StorageClient = { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } };

// The call's own logo, else the logo of the linked company
export function callLogoUrl(supabase: StorageClient, call: Pick<CallWithRelations, "logo_path" | "companies">) {
  if (call.logo_path) return supabase.storage.from("call-logos").getPublicUrl(call.logo_path).data.publicUrl;
  if (call.companies?.logo_path) return supabase.storage.from("logos").getPublicUrl(call.companies.logo_path).data.publicUrl;
  return null;
}

export function applyError(message = "") {
  if (/STUDENT_ONLY/.test(message)) return "Solo las cuentas con rol de estudiante pueden postularse.";
  if (/CALL_CLOSED/.test(message)) return "La convocatoria ya cerró.";
  if (/ALREADY_APPLIED/.test(message)) return "Ya te postulaste a esta convocatoria.";
  if (/PROFILE_INCOMPLETE/.test(message)) return "Completa los datos obligatorios de tu perfil antes de postularte.";
  if (/REQUIREMENTS_NOT_MET/.test(message)) return "No cumples los requisitos académicos de esta convocatoria.";
  if (/NOT_FOUND/.test(message)) return "La convocatoria no existe o ya no está publicada.";
  return "No se pudo completar. Inténtalo de nuevo.";
}
