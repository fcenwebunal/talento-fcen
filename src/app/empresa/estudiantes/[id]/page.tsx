import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

  const { data: fav } = await supabase.from("favorites").select("student_id").eq("company_id", session.company.id).eq("student_id", id).maybeSingle();

  return (
    <div className="wrap py-10">
      <Link href="/empresa/buscar" className="text-sm text-suave hover:text-azul">
        ← Volver a la búsqueda
      </Link>
      <div className="mt-4">
        <StudentDetailView
          detail={detail}
          actions={
            <>
              <FavoriteButton studentId={id} isFavorite={!!fav} />
              {detail.contact?.cv_path && (
                <a href={`/empresa/estudiantes/${id}/hoja-de-vida`} target="_blank" className="btn btn-primary">
                  Descargar hoja de vida
                </a>
              )}
            </>
          }
        />
      </div>
      {session.level < 2 && (
        <p className="mt-6 rounded-lg bg-superficie p-4 text-sm text-suave">
          Está viendo el perfil sin datos de contacto. Cuando la Facultad autorice a su organización, verá el nombre, el contacto y la
          hoja de vida de quienes lo permitieron.
        </p>
      )}
    </div>
  );
}
