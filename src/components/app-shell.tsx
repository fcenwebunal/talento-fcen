import { Suspense } from "react";
import { LogOut } from "lucide-react";
import type { Session } from "@/lib/session";
import { Avatar } from "./ui/avatar";
import { SideNav, MobileTabs, type SideItem } from "./side-nav";

const ROLE_LABEL = { student: "Estudiante", company: "Empresa", staff: "Facultad", admin: "Administración" } as const;

export const STUDENT_NAV: SideItem[] = [
  { href: "/estudiante", label: "Inicio", icon: "dashboard", exact: true },
  {
    href: "/estudiante/perfil",
    label: "Mi perfil",
    icon: "userPen",
    children: [
      { href: "/estudiante/perfil?seccion=personales", label: "Datos personales", param: "personales" },
      { href: "/estudiante/perfil?seccion=academico", label: "Académico", param: "academico" },
      { href: "/estudiante/perfil?seccion=perfil", label: "Competencias", param: "perfil" },
      { href: "/estudiante/perfil?seccion=experiencia", label: "Experiencia", param: "experiencia" },
      { href: "/estudiante/perfil?seccion=disponibilidad", label: "Disponibilidad", param: "disponibilidad" },
      { href: "/estudiante/perfil?seccion=documentos", label: "Documentos", param: "documentos" },
    ],
  },
  { href: "/estudiante/vista-previa", label: "Cómo me ven", icon: "eye" },
  { href: "/cuenta", label: "Mi cuenta", icon: "account" },
  { href: "/guia/estudiantes", label: "Guía de prácticas", icon: "route", external: true },
];

export const COMPANY_NAV: SideItem[] = [
  { href: "/empresa", label: "Inicio", icon: "dashboard", exact: true },
  { href: "/empresa/buscar", label: "Buscar talento", icon: "search" },
  { href: "/empresa/favoritos", label: "Favoritos", icon: "star" },
  { href: "/cuenta", label: "Mi cuenta y empresa", icon: "account" },
  { href: "/guia/empresas", label: "Cómo vincular", icon: "route", external: true },
];

export const ADMIN_NAV: SideItem[] = [
  { href: "/admin", label: "Resumen", icon: "dashboard", exact: true },
  { href: "/admin/empresas", label: "Empresas", icon: "building", badgeKey: "pendingCompanies" },
  { href: "/admin/estudiantes", label: "Estudiantes", icon: "users", badgeKey: "pendingProgress" },
  { href: "/admin/catalogo", label: "Habilidades", icon: "list" },
  { href: "/admin/registros", label: "Registros", icon: "history" },
  { href: "/admin/usuarios", label: "Roles", icon: "key" },
  { href: "/cuenta", label: "Mi cuenta", icon: "account" },
];

export function AppShell({
  session,
  items,
  badges = {},
  children,
}: {
  session: Session;
  items: SideItem[];
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const title = session.role === "company" ? session.company?.name ?? "Mi empresa" : session.fullName ?? session.email;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-borde bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-borde p-4">
          <Avatar name={title} seed={session.company?.id ?? session.email} src={session.avatarUrl} size={40} square={session.role === "company"} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-azul-oscuro">{title}</p>
            <p className="text-xs text-verde-tinta">{ROLE_LABEL[session.role]}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <Suspense>
            <SideNav items={items} badges={badges} />
          </Suspense>
        </div>
        <div className="border-t border-borde p-3">
          <form action="/auth/salir" method="post">
            <button className="side-link w-full text-suave">
              <LogOut aria-hidden="true" /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="app-main min-w-0 bg-superficie px-4 pb-24 pt-6 md:px-8 lg:pb-10">{children}</main>
      <MobileTabs items={items} badges={badges} />
    </div>
  );
}
