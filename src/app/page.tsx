import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Stats = {
  students_listed: number;
  companies_authorized: number;
  by_program: { program: string; count: number }[];
  top_skills: { skill: string; count: number }[];
};

const PROGRAMS = [
  { name: "Estadística", skills: ["Análisis de datos", "Encuestas", "Pronósticos"] },
  { name: "Ciencias de la Computación", skills: ["Desarrollo de software", "Ciencia de datos", "Seguridad"] },
  { name: "Matemáticas", skills: ["Modelación", "Optimización", "Finanzas cuantitativas"] },
  { name: "Ingeniería Física", skills: ["Instrumentación", "Materiales y óptica", "Simulación"] },
  { name: "Ingeniería Biológica", skills: ["Bioprocesos", "Microbiología", "Biotecnología"] },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats");
  const stats = data as Stats | null;

  return (
    <>
      <section className="bg-azul-oscuro text-white">
        <div className="wrap grid items-center gap-10 py-14 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-verde">Prácticas y talento FCEN</p>
            <h1 className="display mt-3 text-4xl md:text-5xl">
              El talento de la Facultad, <span className="text-verde">a un clic</span> de las empresas
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Estudiantes y egresados recientes de la FCEN muestran lo que saben hacer. Las empresas encuentran a quien
              necesitan. Y la guía te acompaña en cada paso de la práctica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ingresar?como=estudiante" className="btn bg-verde text-azul-oscuro hover:brightness-105">
                Soy estudiante
              </Link>
              <Link href="/ingresar?como=empresa" className="btn border-white/40 text-white hover:bg-white/10">
                Soy empresa
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={stats?.students_listed ?? 0} label="perfiles buscando práctica" />
            <StatCard value={stats?.companies_authorized ?? 0} label="empresas autorizadas" />
            <StatCard value={5} label="pregrados" />
            <StatCard value={9} label="posgrados" />
          </div>
        </div>
      </section>

      <section className="wrap py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card border-t-4 border-t-azul">
            <h2 className="display text-2xl text-azul-oscuro">Para estudiantes</h2>
            <ol className="mt-4 space-y-3">
              <Step n={1} title="Arma tu perfil" text="Habilidades con su nivel y evidencia, proyectos, idiomas y disponibilidad." />
              <Step n={2} title="Deja que te encuentren" text="Las empresas ven tus habilidades; tus datos de contacto, solo si tú lo autorizas." />
              <Step n={3} title="Sigue la ruta" text="La guía te explica cómo formalizar tu práctica con la Facultad." />
            </ol>
            <Link href="/guia/estudiantes" className="btn btn-secondary mt-5">
              Ver la guía del estudiante
            </Link>
          </div>
          <div className="card border-t-4 border-t-verde">
            <h2 className="display text-2xl text-azul-oscuro">Para empresas</h2>
            <ol className="mt-4 space-y-3">
              <Step n={1} title="Regístrese gratis" text="Busque perfiles por habilidad, programa, disponibilidad y ciudad." />
              <Step n={2} title="Solicite la autorización" text="La Facultad valida su organización y habilita el contacto y las exportaciones." />
              <Step n={3} title="Contacte y seleccione" text="Con su propio proceso, y formalice la práctica con la Facultad." />
            </ol>
            <Link href="/guia/empresas" className="btn btn-secondary mt-5">
              Ver la guía para empresas
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-superficie">
        <div className="wrap py-14">
          <h2 className="display text-3xl text-azul-oscuro">Lo que saben hacer nuestros estudiantes</h2>
          <p className="mt-2 max-w-2xl text-suave">Algunas de las habilidades de cada programa de pregrado de la Facultad.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROGRAMS.map((p) => (
              <div key={p.name} className="card">
                <h3 className="font-bold text-azul-oscuro">{p.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s} className="chip chip-azul">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {stats && stats.top_skills.length > 0 && (
            <div className="mt-10">
              <h3 className="font-bold text-azul-oscuro">Habilidades más declaradas en la plataforma</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {stats.top_skills.map((s) => (
                  <span key={s.skill} className="chip chip-verde">
                    {s.skill} · {s.count}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link href="/habilidades" className="btn btn-primary mt-8">
            Explorar el catálogo de habilidades
          </Link>
        </div>
      </section>

      <section className="wrap py-14">
        <h2 className="display text-3xl text-azul-oscuro">Tus datos, protegidos por niveles</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Level title="Visitante" text="Ve la guía, el catálogo de habilidades y cifras generales. Nunca un perfil." />
          <Level title="Empresa registrada" text="Ve perfiles sin nombre, contacto ni foto: programa, habilidades, idiomas y disponibilidad." />
          <Level title="Empresa autorizada" text="Ve el contacto y la hoja de vida solo de quienes lo autorizaron. Cada consulta queda registrada." />
        </div>
      </section>
    </>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-5">
      <p className="display text-4xl text-verde">{value}</p>
      <p className="mt-1 text-sm text-white/80">{label}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azul text-white">{n}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-suave">{text}</p>
      </div>
    </li>
  );
}

function Level({ title, text }: { title: string; text: string }) {
  return (
    <div className="card">
      <p className="font-bold text-azul-oscuro">{title}</p>
      <p className="mt-1 text-sm text-suave">{text}</p>
    </div>
  );
}
