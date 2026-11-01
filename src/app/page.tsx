import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession, homeFor } from "@/lib/session";
import { Counter } from "@/components/ui/counter";
import { ConnectionNetwork } from "@/components/ui/connect-art";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats");
  const stats = data as { students_listed: number; companies_authorized: number } | null;

  return (
    <section className="relative overflow-hidden">
      <div className="bg-links absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_70%_40%,#000_20%,transparent_70%)]" />
      <div className="wrap relative grid min-h-[calc(100vh-8rem)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="stagger">
          <p className="kicker">Prácticas y talento FCEN</p>
          <h1 className="display mt-4 text-4xl text-azul-oscuro md:text-5xl">
            Conecta el talento de la Facultad con las organizaciones que lo buscan
          </h1>
          <p className="mt-4 max-w-xl text-lg text-suave">Elige cómo quieres entrar.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/ingresar?como=estudiante" className="card card-hover group flex flex-col gap-4 p-6">
              <span className="icon-tile h-12 w-12">
                <GraduationCap />
              </span>
              <span>
                <span className="display block text-xl text-azul-oscuro">Soy estudiante</span>
                <span className="mt-1 block text-sm text-suave">Crea tu perfil y deja que las empresas encuentren tus habilidades.</span>
              </span>
              <span className="mt-auto inline-flex items-center gap-2 font-black text-azul">
                Entrar con @unal.edu.co <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link href="/ingresar?como=empresa" className="card card-hover group flex flex-col gap-4 p-6">
              <span className="icon-tile icon-tile-verde h-12 w-12">
                <Building2 />
              </span>
              <span>
                <span className="display block text-xl text-azul-oscuro">Soy empresa</span>
                <span className="mt-1 block text-sm text-suave">Busque practicantes por habilidad, programa y disponibilidad.</span>
              </span>
              <span className="mt-auto inline-flex items-center gap-2 font-black text-verde-tinta">
                Registrar mi organización <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-suave">
            <span>
              <strong className="display text-xl text-azul-oscuro">
                <Counter value={stats?.students_listed ?? 0} />
              </strong>{" "}
              perfiles buscando práctica
            </span>
            <span>
              <strong className="display text-xl text-azul-oscuro">
                <Counter value={stats?.companies_authorized ?? 0} />
              </strong>{" "}
              empresas autorizadas
            </span>
            <Link href="/guia/estudiantes" className="inline-flex items-center gap-1.5 font-black text-azul hover:underline">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> ¿Cómo funciona?
            </Link>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-suave">
            <ShieldCheck className="h-4 w-4 text-verde-tinta" aria-hidden="true" /> Los datos de contacto solo se comparten si el estudiante lo autoriza.
          </p>
        </div>

        <div className="relative hidden lg:block" style={{ animation: "fade-in 0.8s 0.2s both" }}>
          <ConnectionNetwork className="w-full drop-shadow-sm" />
          <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full border border-borde bg-white px-3 py-1.5 text-xs shadow-md">
            <GraduationCap className="h-4 w-4 text-azul" aria-hidden="true" /> Estudiantes
          </div>
          <div className="absolute right-6 top-4 flex items-center gap-2 rounded-full border border-borde bg-white px-3 py-1.5 text-xs shadow-md">
            <Building2 className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Organizaciones
          </div>
        </div>
      </div>
    </section>
  );
}
