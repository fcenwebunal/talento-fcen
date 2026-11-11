import type { Role } from "@/lib/types";

export const ROLE_LABEL: Record<Role, string> = {
  user: "Usuario",
  student: "Estudiante",
  company: "Empresa",
  staff: "Facultad",
  admin: "Administrador",
};

export const ROLE_HOME: Record<Role, string> = {
  user: "/cuenta",
  student: "/estudiante",
  company: "/empresa",
  staff: "/admin",
  admin: "/admin",
};

export const ROLE_HINT: Record<Role, string> = {
  user: "Cuenta nueva, sin rol: solo edita su cuenta",
  student: "Crea su perfil y lo ven las empresas",
  company: "Registra su organización y busca talento",
  staff: "Panel de la Facultad; da roles a cuentas nuevas",
  admin: "Todo el panel, incluidos todos los roles",
};

export const ROLES: Role[] = ["user", "student", "company", "staff", "admin"];
export const ASSIGNABLE_ROLES: Role[] = ["student", "company", "staff", "admin"];
// Mirrors public.staff_assignable(): the Facultad gives these to a «usuario» or a pending registration, never administrator
export const STAFF_ASSIGNABLE: Role[] = ["student", "company", "staff"];

export function assignableBy(role: Role): Role[] {
  return role === "admin" ? ASSIGNABLE_ROLES : role === "staff" ? STAFF_ASSIGNABLE : [];
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
