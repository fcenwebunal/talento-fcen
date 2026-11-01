import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { StudentDetail } from "@/lib/types";
import { AVAILABILITY_LABEL, SKILL_LEVEL, freshness } from "@/lib/labels";

export const metadata: Metadata = { title: "Favoritos" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await requireRole(["company"]);
  if (!session.company) redirect("/empresa/registro");
  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("favorites")
    .select("student_id, created_at")
    .eq("company_id", session.company.id)
    .order("created_at", { ascending: false });

  const details = await Promise.all(
    (favs ?? []).map(async (f) => {
      const { data, error } = await supabase.rpc("get_student_detail", { p_student: f.student_id });
      return { id: f.student_id, detail: error ? null : (data as StudentDetail) };
    })
  );

  return (
    <div className="wrap py-10">
      <h1 className="display text-3xl text-azul-oscuro">Favoritos</h1>
      <p className="mt-1 text-suave">Perfiles que guardó para revisar después.</p>
      {details.length === 0 && (
        <p className="card mt-6 text-suave">
          Aún no tiene favoritos. <Link href="/empresa/buscar" className="text-azul-medio underline">Buscar perfiles</Link>
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {details.map(({ id, detail }) =>
          detail ? (
            <Link key={id} href={`/empresa/estudiantes/${id}`} className="card hover:border-azul">
              <p className="text-xs font-bold uppercase tracking-wide text-suave">{detail.program}</p>
              <p className="mt-1 font-bold text-azul-oscuro">{detail.contact?.full_name ?? detail.headline ?? "Perfil"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.skills.slice(0, 5).map((s) => (
                  <span key={s.name} className="chip">
                    {s.name} · {SKILL_LEVEL[s.level]}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-suave">
                {AVAILABILITY_LABEL[detail.availability]} · {freshness(detail.last_confirmed_at).text}
              </p>
            </Link>
          ) : (
            <div key={id} className="card text-sm text-suave">
              Este perfil ya no está disponible en las búsquedas.
            </div>
          )
        )}
      </div>
    </div>
  );
}
