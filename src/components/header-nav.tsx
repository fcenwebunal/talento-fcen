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

const LINKS = [
  { href: "/guia/estudiantes", label: "Estudiantes", icon: GraduationCap },
  { href: "/guia/empresas", label: "Empresas", icon: BriefcaseBusiness },
  { href: "/habilidades", label: "Habilidades", icon: Blocks },
];

export function HeaderNav({ role, name, email, avatarUrl, embedded = false }: { role: Role | null; name: string | null; email: string | null; avatarUrl: string | null; embedded?: boolean }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  const openPalette = () => window.dispatchEvent(new Event("open-palette"));
  const inApp = role ? pathname.startsWith(HOME[role]) : false;

  return (
    <>
      <header className={`masthead z-40 shadow-[0_6px_18px_-10px_rgb(0_0_0/0.45)] ${embedded ? "relative" : "sticky top-0"}`}>
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Link href={role ? HOME[role] : "/"} className="flex min-w-0 items-center gap-3">
            <span className="flex flex-col leading-tight">
              <span className="flex items-center gap-2 text-[0.6875rem] text-white/70">
                <span className="h-0.5 w-3.5 rounded bg-verde" /> Prácticas y talento
              </span>
              <span className="display text-lg">
                Talento <span className="text-verde">FCEN</span>
              </span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Principal">
            {role && (
              <Link href={HOME[role]} className="nav-pill" aria-current={inApp ? "page" : undefined}>
                <span className="nav-ico"><LayoutGrid aria-hidden="true" /></span> Mi espacio
              </Link>
            )}
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="nav-pill" aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
                <span className="nav-ico"><l.icon aria-hidden="true" /></span> {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
              aria-label="Ir a una sección"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Ir a…</span>
            </button>
            {role ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/cuenta" className="flex items-center gap-2 rounded-lg py-1 pl-2 pr-2 transition-colors hover:bg-white/10" title="Mi cuenta">
                  <Avatar name={name ?? email} seed={email ?? "x"} src={avatarUrl} size={30} />
                  <span className="hidden flex-col text-left leading-tight xl:flex">
                    <span className="max-w-[9rem] truncate text-sm font-black">{name?.split(" ")[0] ?? "Mi cuenta"}</span>
                    <span className="text-[0.6875rem] text-verde">{ROLE_LABEL[role]}</span>
                  </span>
                </Link>
                <form action="/auth/salir" method="post">
                  <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white" title="Cerrar sesión">
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
              <a
                href={`${PUBLIC_SITE}${pathname}`}
                target="_blank"
                rel="noopener"
                className="hidden items-center rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
                title="Abrir en pantalla completa"
                aria-label="Abrir en pantalla completa"
              >
                <Maximize2 className="h-4 w-4" />
              </a>
            )}
            <a
              href="https://fcen.unal.edu.co"
              target="_blank"
              rel="noopener"
              className="ml-2 hidden items-center gap-3 border-l border-white/15 pl-4 transition-opacity hover:opacity-80 xl:flex"
              aria-label="FCEN, Facultad de Ciencias Exactas y Naturales"
            >
              <span className="display text-2xl tracking-tight">FCEN</span>
              <span className="fm-brand-name">
                <span>Facultad de</span>
                <span>Ciencias Exactas</span>
                <span>&amp; Naturales</span>
              </span>
            </a>
            <button onClick={openPalette} className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setMenu(!menu)} className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden" aria-label="Menú" aria-expanded={menu}>
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className={`${embedded ? "absolute" : "fixed"} inset-x-0 top-16 z-30 border-b border-white/10 bg-azul-noche px-4 pb-5 pt-2 text-white shadow-2xl lg:hidden`} style={{ animation: "fade-up 0.25s var(--ease-out) both" }}>
          {role && (
            <Link href={HOME[role]} className="mb-1 flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <Avatar name={name ?? email} seed={email ?? "x"} src={avatarUrl} size={36} />
              <span className="flex-1">
                <span className="block font-black">{name ?? email}</span>
                <span className="text-xs text-verde">{ROLE_LABEL[role]} · Mi espacio</span>
              </span>
            </Link>
          )}
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10">
              <l.icon className="h-5 w-5 text-verde" aria-hidden="true" /> {l.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-white/10 pt-2">
            {role ? (
              <form action="/auth/salir" method="post">
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-white/80 hover:bg-white/10">
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

      <CommandPalette items={navFor(role)} />
    </>
  );
}
