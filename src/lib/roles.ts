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
  staff: "Panel de la Facultad; aprueba estudiantes",
  admin: "Todo el panel, incluidos los roles",
};

export const ROLES: Role[] = ["user", "student", "company", "staff", "admin"];
export const ASSIGNABLE_ROLES: Role[] = ["student", "company", "staff", "admin"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
