"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, History, KeyRound, LayoutDashboard, ListChecks, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/admin/catalogo", label: "Habilidades", icon: ListChecks },
  { href: "/admin/registros", label: "Registros", icon: History },
  { href: "/admin/usuarios", label: "Roles", icon: KeyRound },
];

export function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Administración">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative flex shrink-0 items-center gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] px-3 py-2.5 text-sm font-black transition-all ${active ? "bg-azul text-white shadow-lg" : "text-azul-oscuro hover:bg-white hover:shadow-sm"}`}
          >
            <l.icon className={`h-4 w-4 ${active ? "text-verde" : "text-azul-medio"}`} aria-hidden="true" />
            {l.label}
            {l.href === "/admin/empresas" && pending > 0 && (
              <span className={`ml-auto rounded-full px-2 text-xs ${active ? "bg-verde text-azul-noche" : "bg-amarillo text-azul-noche"}`}>{pending}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
