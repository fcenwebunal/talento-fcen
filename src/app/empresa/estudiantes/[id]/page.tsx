import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileDown, Lock } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StudentDetailView } from "@/components/student-detail";
import type { StudentDetail } from "@/lib/types";
import { FavoriteButton } from "./favorite-button";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function CompanyStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["company"]);
  if (!session.company || session.level < 1) redirect("/empresa");
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_student_detail", { p_student: id });
  if (error || !data) notFound();
  const detail = data as StudentDetail;

  const [{ data: fav }, photos] = await Promise.all([
    supabase.from("favorites").select("student_id").eq("company_id", session.company.id).eq("student_id", id).maybeSingle(),
    detail.contact_visible ? supabase.storage.from("documentos").list(`${id}/foto`, { limit: 1, sortBy: { column: "created_at", order: "desc" } }) : Promise.resolve({ data: null }),
  ]);
  const photoFile = photos.data?.[0];
  const photoUrl = photoFile ? (await supabase.storage.from("documentos").createSignedUrl(`${id}/foto/${photoFile.name}`, 3600)).data?.signedUrl : null;

  return (
    <div className="bg-dots">
      <div className="wrap py-8">
        <Link href="/empresa/buscar" className="no-print mb-4 inline-flex items-center gap-2 text-sm font-black text-suave hover:text-azul">
          <ArrowLeft className="h-4 w-4" /> Volver a la búsqueda
        </Link>
        {session.level < 2 && (
          <p className="no-print mb-4 flex gap-3 rounded-[1rem_1rem_1rem_0.25rem] border border-borde bg-white p-4 text-sm text-suave shadow-sm">
            <Lock className="h-5 w-5 shrink-0 text-azul-medio" aria-hidden="true" />
            Está viendo la hoja de vida sin datos de contacto. Cuando la Facultad autorice a su organización, verá el nombre, el contacto y los enlaces de quienes lo permitieron.
          </p>
        )}
        <StudentDetailView
          detail={detail}
          photoUrl={photoUrl}
          viewer={session.level < 2 ? "empresa registrada (perfil anónimo)" : detail.contact_visible ? "empresa autorizada" : "empresa autorizada, sin contacto compartido"}
          actions={
            <>
              <FavoriteButton studentId={id} isFavorite={!!fav} />
              {detail.contact?.cv_path && (
                <a href={`/empresa/estudiantes/${id}/hoja-de-vida`} target="_blank" className="btn btn-secondary" title="La hoja de vida que subió el propio estudiante">
                  <FileDown /> PDF del estudiante
                </a>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}
