"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Blocks, GraduationCap, LayoutGrid, LogIn, LogOut, Maximize2, Menu, Search, X } from "lucide-react";
import { PUBLIC_SITE } from "@/lib/config";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui/avatar";
import { CommandPalette } from "./command-palette";
import { navFor } from "./nav-items";

const ROLE_LABEL: Record<Role, string> = { student: "Estudiante", company: "Empresa", staff: "Facultad", admin: "Administración" };
const HOME: Record<Role, string> = { student: "/estudiante", company: "/empresa", staff: "/admin", admin: "/admin" };

// Each guide is shown to visitors and to its own audience only; staff and admins see neither.
const LINKS: { href: string; label: string; icon: typeof Blocks; for?: Role }[] = [
  { href: "/guia/estudiantes", label: "Guía para estudiantes", icon: GraduationCap, for: "student" },
  { href: "/guia/empresas", label: "Guía para empresas", icon: BriefcaseBusiness, for: "company" },
  { href: "/habilidades", label: "Habilidades", icon: Blocks },
];

const ICON_BUTTON = "flex items-center rounded-lg p-2 text-azul-oscuro/70 transition-colors hover:bg-celeste hover:text-azul-oscuro";

export function HeaderNav({ role, name, email, avatarUrl, embedded = false }: { role: Role | null; name: string | null; email: string | null; avatarUrl: string | null; embedded?: boolean }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  const openPalette = () => window.dispatchEvent(new Event("open-palette"));
  const inApp = role ? pathname.startsWith(HOME[role]) : false;
  const links = LINKS.filter((l) => !l.for || !role || l.for === role);

  return (
    <>
      <header className={`appbar z-40 ${embedded ? "relative" : "sticky top-0"}`}>
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Link href={role ? HOME[role] : "/"} className="display shrink-0 text-lg text-azul-oscuro">
            Talento <span className="text-verde-tinta">FCEN</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Principal">
            {role && (
              <Link href={HOME[role]} className="nav-pill" aria-current={inApp ? "page" : undefined}>
                <span className="nav-ico"><LayoutGrid aria-hidden="true" /></span> Mi espacio
              </Link>
            )}
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="nav-pill" aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
                <span className="nav-ico"><l.icon aria-hidden="true" /></span> {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-borde bg-white px-3 py-1.5 text-sm text-suave transition-colors hover:bg-celeste hover:text-azul-oscuro md:flex"
              aria-label="Ir a una sección"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Ir a…</span>
            </button>
            {role ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/cuenta" className="flex items-center gap-2 rounded-lg py-1 pl-2 pr-2 transition-colors hover:bg-celeste" title="Mi cuenta">
                  <Avatar name={name ?? email} seed={email ?? "x"} src={avatarUrl} size={30} />
                  <span className="hidden flex-col text-left leading-tight xl:flex">
                    <span className="max-w-[9rem] truncate text-sm font-black text-azul-oscuro">{name?.split(" ")[0] ?? "Mi cuenta"}</span>
                    <span className="text-[0.6875rem] text-verde-tinta">{ROLE_LABEL[role]}</span>
                  </span>
                </Link>
                <form action="/auth/salir" method="post">
                  <button className={`${ICON_BUTTON} gap-1.5 px-2.5 text-sm`} title="Cerrar sesión">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> <span className="hidden xl:inline">Salir</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/ingresar" className="btn btn-accent btn-sm hidden md:inline-flex">
                <LogIn /> Ingresar
              </Link>
            )}
            {embedded && (
              <a href={`${PUBLIC_SITE}${pathname}`} target="_blank" rel="noopener" className={`${ICON_BUTTON} hidden md:flex`} title="Abrir en pantalla completa" aria-label="Abrir en pantalla completa">
                <Maximize2 className="h-4 w-4" />
              </a>
            )}
            <button onClick={openPalette} className={`${ICON_BUTTON} md:hidden`} aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setMenu(!menu)} className={`${ICON_BUTTON} lg:hidden`} aria-label="Menú" aria-expanded={menu}>
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menu && (
          <div className="absolute inset-x-0 top-full border-b border-borde bg-white px-4 pb-5 pt-2 text-azul-oscuro shadow-xl lg:hidden" style={{ animation: "fade-up 0.25s var(--ease-out) both" }}>
            {role && (
              <Link href={HOME[role]} className="mb-1 flex items-center gap-3 rounded-lg bg-celeste p-3">
                <Avatar name={name ?? email} seed={email ?? "x"} src={avatarUrl} size={36} />
                <span className="flex-1">
                  <span className="block font-black">{name ?? email}</span>
                  <span className="text-xs text-verde-tinta">{ROLE_LABEL[role]} · Mi espacio</span>
                </span>
              </Link>
            )}
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-celeste">
                <l.icon className="h-5 w-5 text-verde-tinta" aria-hidden="true" /> {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-borde pt-2">
              {role ? (
                <form action="/auth/salir" method="post">
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-suave hover:bg-celeste hover:text-azul-oscuro">
                    <LogOut className="h-5 w-5" /> Cerrar sesión
                  </button>
                </form>
              ) : (
                <Link href="/ingresar" className="btn btn-accent w-full">
                  <LogIn /> Ingresar
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <CommandPalette items={navFor(role)} />
    </>
  );
}
