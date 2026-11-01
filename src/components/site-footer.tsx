"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

const LINKS = [
  { href: "/guia/estudiantes", label: "Guía para estudiantes" },
  { href: "/guia/empresas", label: "Guía para empresas" },
  { href: "/habilidades", label: "Habilidades" },
  { href: "/datos-personales", label: "Datos personales" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (/^\/(estudiante|empresa|admin)/.test(pathname)) return null;

  return (
    <footer className="border-t border-borde bg-white">
      <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-suave">
        <p>
          <span className="font-black text-azul-oscuro">Talento FCEN</span> · Facultad de Ciencias Exactas y Naturales, UNAL Manizales
          <span className="chip chip-amarillo ml-2 py-0">Beta</span>
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Pie de página">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-azul">
              {l.label}
            </Link>
          ))}
          <a href="https://fcen.unal.edu.co" target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-azul">
            fcen.unal.edu.co <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
