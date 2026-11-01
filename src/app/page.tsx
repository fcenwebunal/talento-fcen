import Link from "next/link";
import {
  ArrowRight, Atom, BadgeCheck, BarChart3, BriefcaseBusiness, Building2, Code2, Dna, Eye, EyeOff, FileSearch,
  GraduationCap, LineChart, Lock, Search, ShieldCheck, Sigma, Sparkles, UserRoundCheck, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { HelpTip } from "@/components/ui/help-tip";
import { Constellation, CornerLines, Plus, Rings, WaveDivider } from "@/components/ui/decor";

export const dynamic = "force-dynamic";

type Stats = {
  students_listed: number;
  companies_authorized: number;
  by_program: { program: string; count: number }[];
  top_skills: { skill: string; count: number }[];
};

const PROGRAMS = [
  { name: "Estadística", icon: BarChart3, skills: ["Análisis de datos", "Encuestas", "Pronósticos"] },
  { name: "Ciencias de la Computación", icon: Code2, skills: ["Software", "Ciencia de datos", "Seguridad"] },
  { name: "Matemáticas", icon: Sigma, skills: ["Modelación", "Optimización", "Finanzas"] },
  { name: "Ingeniería Física", icon: Atom, skills: ["Instrumentación", "Materiales", "Simulación"] },
  { name: "Ingeniería Biológica", icon: Dna, skills: ["Bioprocesos", "Microbiología", "Biotecnología"] },
];

const FLOATING = [
  { label: "Python · Avanzado", className: "left-[4%] top-[12%]", delay: "0s" },
  { label: "Series de tiempo", className: "right-[6%] top-[20%]", delay: "1.5s" },
  { label: "Instrumentación", className: "left-[10%] bottom-[18%]", delay: "3s" },
  { label: "Bioprocesos", className: "right-[12%] bottom-[10%]", delay: "2s" },
];

const MARQUEE = [
  "Python", "R", "Diseño de experimentos", "Aprendizaje automático", "Óptica", "Biorreactores", "SQL", "Optimización",
  "Seguridad informática", "Modelación matemática", "LabVIEW", "Bioinformática", "Power BI", "Econometría", "Sensores",
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats");
  const stats = data as Stats | null;

  return (
    <>
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="bg-dots-light mask-fade-b absolute inset-0" />
        <Rings className="animate-spin-slow absolute -right-40 -top-40 w-[40rem] text-verde" />
        <Constellation className="animate-float-slow absolute bottom-10 left-[38%] hidden w-72 text-white lg:block" />
        <Plus className="absolute left-[8%] top-24 w-5 text-verde/60" />
        <Plus className="absolute right-[42%] top-16 w-3 text-white/30" />

        <div className="wrap relative grid items-center gap-12 pb-28 pt-14 md:pt-20 lg:grid-cols-[1.25fr_1fr]">
          <div className="stagger">
            <p className="kicker kicker-light">Prácticas y talento FCEN</p>
            <h1 className="display mt-4 text-[2.6rem] leading-[1.02] md:text-6xl">
              El talento de la Facultad, <span className="text-gradient">a un clic</span> de las empresas
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Estudiantes y egresados recientes muestran lo que saben hacer. Las empresas encuentran a quien necesitan. Y la guía te
              acompaña en cada paso de la práctica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ingresar?como=estudiante" className="btn btn-accent btn-arrow">
                <GraduationCap /> Soy estudiante <ArrowRight />
              </Link>
              <Link href="/ingresar?como=empresa" className="btn btn-glass btn-arrow">
                <BriefcaseBusiness /> Soy empresa <ArrowRight />
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/60">
              <ShieldCheck className="h-4 w-4 text-verde" aria-hidden="true" /> Tus datos de contacto solo se comparten si tú lo autorizas
            </p>
          </div>

          <div className="relative hidden h-[26rem] lg:block" aria-hidden="true">
            <div className="absolute inset-8 rounded-[2rem_0.5rem_2rem_2rem] border border-white/15 bg-white/[0.04] backdrop-blur-sm" />
            <div className="absolute left-1/2 top-1/2 w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem_1.5rem_1.5rem_0.375rem] bg-white p-5 text-texto shadow-2xl" style={{ animation: "scale-in 0.8s 0.2s var(--ease-out) both" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#13477c,#0c6896)] font-black text-white">EP</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-suave">Estadística</p>
                  <p className="font-black text-azul-oscuro">Perfil anónimo</p>
                </div>
                <span className="chip chip-verde ml-auto">
                  <span className="status-dot live" /> Disponible
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["R · Avanzado", "Encuestas", "Power BI", "SQL"].map((s) => (
                  <span key={s} className="chip chip-azul">{s}</span>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-suave">
                  <span>Coincidencia con su búsqueda</span>
                  <span className="font-black text-azul">4 de 5</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2">
                  <div className="h-full w-4/5 rounded-full bg-[linear-gradient(90deg,var(--azul-medio),var(--verde))]" />
                </div>
              </div>
            </div>
            {FLOATING.map((f) => (
              <span key={f.label} className={`chip chip-dark absolute animate-float ${f.className}`} style={{ animationDelay: f.delay }}>
                <Sparkles className="text-verde" /> {f.label}
              </span>
            ))}
          </div>
        </div>

        <div className="wrap relative -mb-1 pb-0">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-t-[1.5rem] border border-b-0 border-white/10 bg-white/10 md:grid-cols-4">
            {[
              { value: stats?.students_listed ?? 0, label: "perfiles buscando práctica", icon: Users },
              { value: stats?.companies_authorized ?? 0, label: "empresas autorizadas", icon: Building2 },
              { value: 5, label: "pregrados", icon: GraduationCap },
              { value: 9, label: "posgrados", icon: BadgeCheck },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-azul-noche/60 px-5 py-5 backdrop-blur">
                <span className="icon-tile icon-tile-dark">
                  <s.icon />
                </span>
                <div>
                  <p className="display text-3xl text-white">
                    <Counter value={s.value} />
                  </p>
                  <p className="text-xs text-white/60">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mask-fade-x overflow-hidden border-y border-borde bg-white py-4" aria-hidden="true">
        <div className="animate-marquee flex w-max gap-3">
          {[...MARQUEE, ...MARQUEE].map((s, i) => (
            <span key={i} className="chip">
              <Sparkles className="text-verde-tinta" /> {s}
            </span>
          ))}
        </div>
      </div>

      <section className="wrap py-20">
        <Reveal className="max-w-2xl">
          <p className="kicker">Cómo funciona</p>
          <h2 className="display mt-3 text-3xl text-azul-oscuro md:text-4xl">Dos caminos, un mismo punto de encuentro</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[
            {
              title: "Para estudiantes",
              icon: GraduationCap,
              tone: "",
              href: "/guia/estudiantes",
              cta: "Ver la guía del estudiante",
              steps: [
                { icon: UserRoundCheck, title: "Arma tu perfil", text: "Habilidades con nivel y evidencia, proyectos, idiomas y disponibilidad." },
                { icon: Eye, title: "Deja que te encuentren", text: "Las empresas ven tus habilidades; tu contacto, solo si lo autorizas." },
                { icon: FileSearch, title: "Sigue la ruta", text: "La guía te explica cómo formalizar tu práctica con la Facultad." },
              ],
            },
            {
              title: "Para empresas",
              icon: BriefcaseBusiness,
              tone: "icon-tile-verde",
              href: "/guia/empresas",
              cta: "Ver la guía para empresas",
              steps: [
                { icon: Building2, title: "Regístrese gratis", text: "Busque perfiles por habilidad, programa, disponibilidad y ciudad." },
                { icon: BadgeCheck, title: "Solicite la autorización", text: "La Facultad valida su organización y habilita contacto y exportaciones." },
                { icon: Search, title: "Contacte y seleccione", text: "Con su propio proceso, y formalice la práctica con la Facultad." },
              ],
            },
          ].map((block, b) => (
            <Reveal key={block.title} index={b} className="card card-hover overflow-hidden p-7">
              <CornerLines className="absolute -right-4 -top-4 w-28 text-azul" />
              <div className="flex items-center gap-3">
                <span className={`icon-tile ${block.tone}`}>
                  <block.icon />
                </span>
                <h3 className="display text-2xl text-azul-oscuro">{block.title}</h3>
              </div>
              <ol className="mt-6 space-y-5">
                {block.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="relative flex flex-col items-center">
                      <span className="display flex h-9 w-9 items-center justify-center rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-azul text-sm text-white">{i + 1}</span>
                      {i < block.steps.length - 1 && <span className="mt-1 w-px flex-1 bg-borde" />}
                    </span>
                    <div className="pb-1">
                      <p className="flex items-center gap-2 font-black">
                        <s.icon className="h-4 w-4 text-azul-medio" aria-hidden="true" /> {s.title}
                      </p>
                      <p className="mt-0.5 text-sm text-suave">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href={block.href} className="btn btn-secondary btn-arrow mt-7">
                {block.cta} <ArrowRight />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative bg-superficie">
        <WaveDivider className="absolute inset-x-0 -top-px rotate-180" fill="var(--fondo)" />
        <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
        <div className="wrap relative py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="kicker">Talento por programa</p>
              <h2 className="display mt-3 text-3xl text-azul-oscuro md:text-4xl">Lo que saben hacer nuestros estudiantes</h2>
            </div>
            <Link href="/habilidades" className="btn btn-primary btn-arrow">
              Catálogo completo <ArrowRight />
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.name} index={i} className={`card card-hover ${i < 2 ? "lg:col-span-3" : "lg:col-span-2"} ${i === 0 ? "notch" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className={`icon-tile ${i % 2 ? "icon-tile-verde" : ""}`}>
                    <p.icon />
                  </span>
                  <h3 className="font-black text-azul-oscuro">{p.name}</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s} className="chip chip-azul">{s}</span>
                  ))}
                </div>
              </Reveal>
            ))}
            <Reveal index={5} className="card-dark sm:col-span-2 lg:col-span-2">
              <LineChart className="h-8 w-8 text-verde" aria-hidden="true" />
              <p className="display mt-3 text-xl">Y nueve posgrados</p>
              <p className="mt-1 text-sm text-white/70">Actuaría, ciencia de datos, nanotecnología, energía solar, física y matemática aplicada.</p>
            </Reveal>
          </div>
          {stats && stats.top_skills.length > 0 && (
            <Reveal className="card mt-8">
              <h3 className="flex items-center gap-2 font-black text-azul-oscuro">
                <Sparkles className="h-5 w-5 text-verde-tinta" aria-hidden="true" /> Habilidades más declaradas en la plataforma
                <HelpTip>Cuenta solo los perfiles que hoy aparecen ante empresas. No muestra quiénes son.</HelpTip>
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {stats.top_skills.map((s) => (
                  <span key={s.skill} className="chip chip-verde">
                    {s.skill} <strong>{s.count}</strong>
                  </span>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="wrap py-20">
        <Reveal className="max-w-2xl">
          <p className="kicker">Privacidad por niveles</p>
          <h2 className="display mt-3 text-3xl text-azul-oscuro md:text-4xl">Cada quien ve solo lo que le corresponde</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: EyeOff, title: "Visitante", text: "La guía, el catálogo de habilidades y cifras generales. Nunca un perfil.", tone: "" },
            { icon: Eye, title: "Empresa registrada", text: "Perfiles sin nombre, contacto ni foto: programa, habilidades, idiomas y disponibilidad.", tone: "icon-tile-amarillo" },
            { icon: Lock, title: "Empresa autorizada", text: "Contacto y hoja de vida solo de quienes lo autorizaron. Cada consulta queda registrada.", tone: "icon-tile-verde" },
          ].map((l, i) => (
            <Reveal key={l.title} index={i} className="card card-hover">
              <span className="absolute right-5 top-5 display text-5xl text-superficie-2">0{i + 1}</span>
              <span className={`icon-tile ${l.tone}`}>
                <l.icon />
              </span>
              <p className="mt-4 font-black text-azul-oscuro">{l.title}</p>
              <p className="mt-1 text-sm text-suave">{l.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="card-dark mt-14 grid items-center gap-6 p-8 md:grid-cols-[1fr_auto] md:p-10">
          <Rings className="absolute -right-24 -top-24 w-80 text-verde" />
          <div className="relative">
            <p className="display text-2xl md:text-3xl">¿Listo para empezar?</p>
            <p className="mt-2 max-w-xl text-white/75">Crea tu perfil con tu cuenta @unal.edu.co o registra tu organización en un par de minutos.</p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Link href="/ingresar?como=estudiante" className="btn btn-accent">
              <GraduationCap /> Crear mi perfil
            </Link>
            <Link href="/ingresar?como=empresa" className="btn btn-glass">
              <Building2 /> Registrar empresa
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
