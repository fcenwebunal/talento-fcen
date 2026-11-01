import Link from "next/link";
import { ArrowUpRight, Blocks, BriefcaseBusiness, GraduationCap, ShieldCheck } from "lucide-react";
import { CornerLines, Rings, WaveDivider } from "./ui/decor";

const LINKS = [
  { href: "/guia/estudiantes", label: "Guía para estudiantes", icon: GraduationCap },
  { href: "/guia/empresas", label: "Guía para empresas", icon: BriefcaseBusiness },
  { href: "/habilidades", label: "Habilidades de la Facultad", icon: Blocks },
  { href: "/datos-personales", label: "Tratamiento de datos personales", icon: ShieldCheck },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-azul-noche text-white">
      <WaveDivider className="absolute inset-x-0 -top-px rotate-180" />
      <Rings className="animate-spin-slow absolute -bottom-40 -right-32 w-[28rem] text-verde" />
      <CornerLines className="absolute left-0 top-16 w-28 text-white" />
      <div className="wrap relative grid gap-10 pb-10 pt-24 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-2xl">
            Talento <span className="text-verde">FCEN</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Facultad de Ciencias Exactas y Naturales, Universidad Nacional de Colombia, Sede Manizales. Conectamos el talento de la
            Facultad con las organizaciones que lo necesitan.
          </p>
          <span className="chip chip-dark mt-4">
            <span className="status-dot live text-amarillo" /> Versión beta
          </span>
        </div>
        <nav aria-label="Pie de página">
          <p className="text-xs font-black uppercase tracking-widest text-white/50">Explorar</p>
          <ul className="mt-3 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                  <l.icon className="h-4 w-4 text-verde" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/50">La Facultad</p>
          <a href="https://fcen.unal.edu.co" target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            fcen.unal.edu.co <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-6 text-xs text-white/50">
            Atajo: pulsa <kbd className="rounded border border-white/20 px-1">Ctrl K</kbd> para ir a cualquier sección.
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="wrap py-4 text-xs text-white/50">Universidad Nacional de Colombia · Sede Manizales</p>
      </div>
    </footer>
  );
}
