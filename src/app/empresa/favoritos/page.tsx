import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, GraduationCap, Search, Star, UserX } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { StudentDetail } from "@/lib/types";
import { AVAILABILITY_LABEL, freshness } from "@/lib/labels";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { LevelDots } from "@/components/student-detail";

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
    <>
      <PageHeader kicker={session.company.name} icon={Star} title="Favoritos" description="Perfiles que guardó para revisar después." />
      <div className="wrap -mt-4">
        {details.length === 0 && (
          <EmptyState
            icon={Star}
            title="Aún no tiene favoritos"
            text="Guarde perfiles desde la búsqueda con el botón de estrella para compararlos después."
            action={
              <Link href="/empresa/buscar" className="btn btn-primary">
                <Search /> Buscar perfiles
              </Link>
            }
          />
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {details.map(({ id, detail }, i) =>
            detail ? (
              <Link key={id} href={`/empresa/estudiantes/${id}`} className="card card-hover group" style={{ animation: `fade-up 0.6s ${i * 60}ms var(--ease-out) both` }}>
                <div className="flex items-start gap-3">
                  <Avatar name={detail.contact?.full_name ?? detail.program} seed={id} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[0.6875rem] font-black uppercase tracking-widest text-suave">
                      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> <span className="truncate">{detail.program}</span>
                    </p>
                    <p className="font-black text-azul-oscuro">{detail.contact?.full_name ?? detail.headline ?? "Perfil"}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-suave group-hover:text-azul" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {detail.skills.slice(0, 5).map((s) => (
                    <span key={s.name} className="chip">
                      {s.name} <LevelDots level={s.level} />
                    </span>
                  ))}
                </div>
                <p className="mt-3 border-t border-borde pt-3 text-xs text-suave">
                  {AVAILABILITY_LABEL[detail.availability]} · {freshness(detail.last_confirmed_at).text}
                </p>
              </Link>
            ) : (
              <div key={id} className="card flex items-center gap-3 text-sm text-suave">
                <UserX className="h-5 w-5" aria-hidden="true" /> Este perfil ya no está disponible en las búsquedas.
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
