import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { CallCard } from "@/components/call-card";
import { CALL_SELECT, CALL_STATUS_LABEL, type CallStatus, type CallWithRelations, callLogoUrl, isOpen, todayCo } from "@/lib/calls";
import { AdminTitle } from "../admin-title";

export const metadata: Metadata = { title: "Convocatorias" };
export const dynamic = "force-dynamic";

type Row = CallWithRelations & { applications: { status: string }[] };

export default async function AdminCalls() {
  const supabase = await createClient();
  const { data } = await supabase.from("calls").select(`${CALL_SELECT}, applications(status)`).order("created_at", { ascending: false });
  const calls = (data ?? []) as unknown as Row[];
  const today = todayCo();

  const groups: { key: string; title: string; items: Row[] }[] = [
    { key: "abiertas", title: "Abiertas", items: calls.filter((c) => isOpen(c, today)) },
    { key: "borradores", title: "Borradores", items: calls.filter((c) => c.status === "borrador") },
    { key: "cerradas", title: "Cerradas", items: calls.filter((c) => c.status !== "borrador" && !isOpen(c, today)) },
  ];

  return (
    <div className="space-y-8">
      <AdminTitle
        icon={Megaphone}
        title="Convocatorias"
        description="Ofertas de práctica que se publican en «Convocatorias abiertas». Los estudiantes se postulan con su hoja de vida y aquí se revisan."
        actions={
          <Link href="/admin/convocatorias/nueva" className="btn btn-accent">
            <Plus /> Nueva convocatoria
          </Link>
        }
      />

      {calls.length === 0 ? (
        <EmptyState icon={Megaphone} title="Aún no hay convocatorias" text="Crea la primera con los datos que envió la empresa." />
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.key} className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-suave">
                {g.title} ({g.items.length})
              </h2>
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {g.items.map((c) => {
                  const active = c.applications.filter((a) => a.status !== "retirada").length;
                  const fresh = c.applications.filter((a) => a.status === "recibida").length;
                  return (
                    <CallCard
                      key={c.id}
                      call={c}
                      logoUrl={callLogoUrl(supabase, c)}
                      href={`/admin/convocatorias/${c.id}`}
                      footer={
                        <>
                          {c.status !== "publicada" && <span className="chip text-xs">{CALL_STATUS_LABEL[c.status as CallStatus]}</span>}
                          <span className="chip chip-azul text-xs">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" /> {active} {active === 1 ? "postulante" : "postulantes"}
                          </span>
                          {fresh > 0 && <span className="chip chip-amarillo text-xs">{fresh} sin revisar</span>}
                        </>
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
