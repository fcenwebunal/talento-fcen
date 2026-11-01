import type { Role } from "@/lib/types";

export type IconName =
  | "home" | "student" | "company" | "skills" | "shield" | "login" | "dashboard" | "user" | "graduation"
  | "sparkles" | "briefcase" | "calendar" | "file" | "eye" | "search" | "star" | "check" | "users"
  | "building" | "list" | "history" | "key" | "route" | "help" | "scale" | "clock";

export type NavItem = { label: string; href: string; icon: IconName; group: string; keywords?: string };

const PUBLIC: NavItem[] = [
  { label: "Inicio", href: "/", icon: "home", group: "General" },
  { label: "Guía del estudiante", href: "/guia/estudiantes", icon: "student", group: "Guías" },
  { label: "¿Estoy listo para la práctica?", href: "/guia/estudiantes#listo", icon: "check", group: "Guías", keywords: "requisitos verificador" },
  { label: "La ruta en 7 pasos", href: "/guia/estudiantes#ruta", icon: "route", group: "Guías", keywords: "pasos proceso" },
  { label: "¿Cuándo empiezo a buscar?", href: "/guia/estudiantes#cuando", icon: "calendar", group: "Guías", keywords: "fechas calendario" },
  { label: "Formas de vinculación", href: "/guia/estudiantes#vinculacion", icon: "file", group: "Guías", keywords: "convenio contrato documentos" },
  { label: "Derechos y deberes", href: "/guia/estudiantes#derechos", icon: "scale", group: "Guías", keywords: "arl" },
  { label: "Preguntas frecuentes", href: "/guia/estudiantes#preguntas", icon: "help", group: "Guías" },
  { label: "Guía para empresas", href: "/guia/empresas", icon: "company", group: "Guías" },
  { label: "Requisitos para empresas", href: "/guia/empresas#requisitos", icon: "building", group: "Guías", keywords: "arl tutor" },
  { label: "Catálogo de habilidades", href: "/habilidades", icon: "skills", group: "General" },
  { label: "Tratamiento de datos personales", href: "/datos-personales", icon: "shield", group: "General", keywords: "privacidad" },
];

const STUDENT: NavItem[] = [
  { label: "Mi panel", href: "/estudiante", icon: "dashboard", group: "Mi perfil", keywords: "disponibilidad confirmar" },
  { label: "Datos personales", href: "/estudiante/perfil?seccion=personales", icon: "user", group: "Editar perfil" },
  { label: "Información académica", href: "/estudiante/perfil?seccion=academico", icon: "graduation", group: "Editar perfil", keywords: "programa avance" },
  { label: "Perfil y competencias", href: "/estudiante/perfil?seccion=perfil", icon: "sparkles", group: "Editar perfil", keywords: "habilidades skills" },
  { label: "Experiencia, proyectos e idiomas", href: "/estudiante/perfil?seccion=experiencia", icon: "briefcase", group: "Editar perfil" },
  { label: "Intereses y disponibilidad", href: "/estudiante/perfil?seccion=disponibilidad", icon: "calendar", group: "Editar perfil" },
  { label: "Documentos y autorización", href: "/estudiante/perfil?seccion=documentos", icon: "file", group: "Editar perfil", keywords: "hoja de vida consentimiento" },
  { label: "Cómo me ven las empresas", href: "/estudiante/vista-previa", icon: "eye", group: "Mi perfil" },
];

const COMPANY: NavItem[] = [
  { label: "Mi empresa", href: "/empresa", icon: "dashboard", group: "Empresa", keywords: "autorización" },
  { label: "Buscar talento", href: "/empresa/buscar", icon: "search", group: "Empresa", keywords: "perfiles estudiantes" },
  { label: "Favoritos", href: "/empresa/favoritos", icon: "star", group: "Empresa" },
];

const STAFF: NavItem[] = [
  { label: "Resumen", href: "/admin", icon: "dashboard", group: "Administración" },
  { label: "Empresas", href: "/admin/empresas", icon: "building", group: "Administración" },
  { label: "Empresas por autorizar", href: "/admin/empresas?estado=en_revision", icon: "clock", group: "Administración", keywords: "revisión" },
  { label: "Estudiantes", href: "/admin/estudiantes", icon: "users", group: "Administración" },
  { label: "Avance por verificar", href: "/admin/estudiantes?verificar=1", icon: "check", group: "Administración" },
  { label: "Catálogo de habilidades", href: "/admin/catalogo", icon: "list", group: "Administración" },
  { label: "Registros", href: "/admin/registros", icon: "history", group: "Administración", keywords: "exportaciones" },
  { label: "Roles", href: "/admin/usuarios", icon: "key", group: "Administración" },
];

export function navFor(role: Role | null): NavItem[] {
  const own = role === "student" ? STUDENT : role === "company" ? COMPANY : role ? STAFF : [];
  return [...own, ...PUBLIC, ...(role ? [] : [{ label: "Ingresar", href: "/ingresar", icon: "login" as const, group: "General" }])];
}
