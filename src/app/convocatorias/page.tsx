import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { CallCard } from "@/components/call-card";
import { CALL_SELECT, type CallWithRelations, callLogoUrl, todayCo } from "@/lib/calls";

const FILTER =
  "rounded-lg border border-borde bg-white px-3 py-1.5 text-sm font-black text-azul-oscuro/80 transition-colors hover:bg-celeste aria-[current=page]:border-azul aria-[current=page]:bg-azul aria-[current=page]:text-white";

export const metadata: Metadata = { title: "Convocatorias abiertas" };
export const dynamic = "force-dynamic";

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ programa?: string; ver?: string }> }) {
  const { programa, ver } = await searchParams;
  const closed = ver === "cerradas";
  const programId = Number(programa) || null;
  const today = todayCo();
  const supabase = await createClient();

  let query = supabase.from("calls").select(CALL_SELECT);
  query = closed
    ? query.or(`status.eq.cerrada,and(status.eq.publicada,deadline.lt.${today})`).order("deadline", { ascending: false }).limit(30)
    : query.eq("status", "publicada").gte("deadline", today).order("deadline");
  const [{ data }, { data: programs }] = await Promise.all([
    query,
    supabase.from("programs").select("id, name").eq("level", "pregrado").eq("active", true).order("sort"),
  ]);

  const calls = ((data ?? []) as unknown as CallWithRelations[]).filter(
    (c) => !programId || c.call_programs.length === 0 || c.call_programs.some((p) => p.program_id === programId),
  );

  const link = (params: { programa?: number | null; ver?: string | null }) => {
    const sp = new URLSearchParams();
    if (params.programa) sp.set("programa", String(params.programa));
    if (params.ver) sp.set("ver", params.ver);
    const qs = sp.toString();
    return `/convocatorias${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        kicker="Prácticas"
        icon={Megaphone}
        title={closed ? "Convocatorias cerradas" : "Convocatorias abiertas"}
        description="Ofertas de práctica que la Facultad publica para sus estudiantes de pregrado. Para postularte, ingresa con tu cuenta @unal.edu.co y completa tu perfil."
      />
      <div className="wrap space-y-6 pb-12">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Filtrar convocatorias">
          <Link href={link({ programa: programId })} className={FILTER} aria-current={!closed ? "page" : undefined}>
            Abiertas
          </Link>
          <Link href={link({ programa: programId, ver: "cerradas" })} className={FILTER} aria-current={closed ? "page" : undefined}>
            Cerradas
          </Link>
          <span className="mx-2 hidden h-6 w-px bg-borde sm:block" />
          <Link href={link({ ver: closed ? "cerradas" : null })} className={FILTER} aria-current={!programId ? "page" : undefined}>
            Todos los programas
          </Link>
          {(programs ?? []).map((p) => (
            <Link key={p.id} href={link({ programa: p.id, ver: closed ? "cerradas" : null })} className={FILTER} aria-current={programId === p.id ? "page" : undefined}>
              {p.name}
            </Link>
          ))}
        </nav>

        {calls.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={closed ? "No hay convocatorias cerradas" : "No hay convocatorias abiertas"}
            text={closed ? "Aquí aparecen las convocatorias cuya fecha límite ya pasó." : "Cuando la Facultad publique una oferta de práctica para tu programa, aparecerá aquí."}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {calls.map((c, i) => (
              <Reveal key={c.id} index={i}>
                <CallCard call={c} logoUrl={callLogoUrl(supabase, c)} href={`/convocatorias/${c.id}`} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
