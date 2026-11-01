"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Blocks, ChevronRight, GraduationCap, LogIn, LogOut, Menu, Search, X } from "lucide-react";
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

export function HeaderNav({ role, name, email }: { role: Role | null; name: string | null; email: string | null }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  const openPalette = () => window.dispatchEvent(new Event("open-palette"));
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-azul-noche/90 shadow-lg backdrop-blur-md" : "bg-azul-noche"}`}
      >
        <div className="h-[0.1875rem] bg-[linear-gradient(90deg,var(--verde)_0%,var(--verde)_40%,var(--azul-medio)_100%)]" />
        <div className="wrap flex items-center justify-between gap-3 py-2.5 text-white">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-verde font-black text-azul-noche transition-transform duration-300 group-hover:rotate-[-6deg]">
              <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/30" />
              <span className="relative text-lg">T</span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="display text-lg">
                Talento <span className="text-verde">FCEN</span>
              </span>
              <span className="hidden text-[0.6875rem] text-white/60 sm:block">Ciencias Exactas y Naturales · UNAL Manizales</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/10 ${isActive(l.href) ? "text-white" : "text-white/75"}`}
              >
                <l.icon className="h-4 w-4" aria-hidden="true" />
                {l.label}
                {isActive(l.href) && <span className="absolute inset-x-3 -bottom-[0.6875rem] h-[0.1875rem] rounded-t bg-verde" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
              aria-label="Ir a una sección"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Ir a…</span>
              <kbd className="rounded border border-white/20 px-1.5 text-[0.6875rem] text-white/60">Ctrl K</kbd>
            </button>
            {role ? (
              <div className="hidden items-center gap-1 lg:flex">
                <Link href={HOME[role]} className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/10">
                  <Avatar name={name ?? email} seed={email ?? "x"} size={30} />
                  <span className="flex flex-col text-left leading-tight">
                    <span className="max-w-[9rem] truncate text-sm font-black">{name?.split(" ")[0] ?? "Mi cuenta"}</span>
                    <span className="text-[0.6875rem] text-verde">{ROLE_LABEL[role]}</span>
                  </span>
                </Link>
                <form action="/auth/salir" method="post">
                  <button className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label="Salir" title="Salir">
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/ingresar" className="btn btn-accent btn-sm hidden lg:inline-flex">
                <LogIn />
                Ingresar
              </Link>
            )}
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
        <div className="fixed inset-x-0 top-[3.9rem] z-30 border-b border-white/10 bg-azul-noche px-4 pb-6 pt-2 text-white shadow-2xl lg:hidden" style={{ animation: "fade-up 0.25s var(--ease-out) both" }}>
          {role && (
            <Link href={HOME[role]} className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <Avatar name={name ?? email} seed={email ?? "x"} size={40} />
              <span className="flex-1">
                <span className="block font-black">{name ?? email}</span>
                <span className="text-xs text-verde">{ROLE_LABEL[role]}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-white/50" />
            </Link>
          )}
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10">
              <l.icon className="h-5 w-5 text-verde" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
          <div className="mt-3 border-t border-white/10 pt-3">
            {role ? (
              <form action="/auth/salir" method="post">
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-white/80 hover:bg-white/10">
                  <LogOut className="h-5 w-5" /> Salir
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
