import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { StudentDetailView } from "@/components/student-detail";
import { PageHeader } from "@/components/ui/page-header";
import type { StudentDetail } from "@/lib/types";
import { previewAs } from "@/lib/cv";

export const metadata: Metadata = { title: "Cómo me ven las empresas" };
export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ nivel?: string }> }) {
  const session = await requireRole(["student"]);
  const { nivel } = await searchParams;
  const authorized = nivel === "autorizada";
  const supabase = await createClient();
  const [{ data }, { data: consents }, { data: photo }] = await Promise.all([
    supabase.rpc("get_student_detail", { p_student: session.userId }),
    supabase.from("students").select("consent_contact").eq("id", session.userId).single(),
    supabase.from("documents").select("path").eq("student_id", session.userId).eq("kind", "foto").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const detail = data as StudentDetail;
  const showContact = authorized && !!consents?.consent_contact;
  const photoUrl = showContact && photo ? (await supabase.storage.from("documentos").createSignedUrl(photo.path, 3600)).data?.signedUrl : null;
  const shown = previewAs(detail, { authorized, consentContact: !!consents?.consent_contact });

  return (
    <>
      <PageHeader
        className="no-print"
        kicker="Vista previa"
        icon={Eye}
        title="Así ven tu perfil las empresas"
        description="Cambia de nivel para ver qué muestra la plataforma en cada caso."
        actions={
          <Link href="/estudiante" className="btn btn-secondary">
            <ArrowLeft /> Mi panel
          </Link>
        }
      >
        <div className="mt-5 inline-flex rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-borde bg-white p-1 shadow-sm">
          <Link href="/estudiante/vista-previa" className={`flex items-center gap-2 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] px-4 py-2 text-sm font-black ${!authorized ? "bg-azul text-white" : "text-suave hover:text-azul"}`}>
            <EyeOff className="h-4 w-4" /> Empresa registrada
          </Link>
          <Link href="/estudiante/vista-previa?nivel=autorizada" className={`flex items-center gap-2 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] px-4 py-2 text-sm font-black ${authorized ? "bg-azul text-white" : "text-suave hover:text-azul"}`}>
            <Lock className="h-4 w-4" /> Empresa autorizada
          </Link>
        </div>
      </PageHeader>
      <div className="wrap">
        {authorized && !consents?.consent_contact && (
          <p className="no-print mb-6 flex gap-2 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] bg-amarillo/15 p-4 text-sm text-amarillo-tinta">
            <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            No has aceptado compartir tu contacto, así que las empresas autorizadas también ven tu perfil sin nombre ni contacto.
          </p>
        )}
        <StudentDetailView detail={shown} photoUrl={photoUrl} cvHref={`/cv/${session.userId}?nivel=${authorized ? "autorizada" : "registrada"}`} viewer={authorized ? "una empresa autorizada" : "una empresa registrada (perfil anónimo)"} />
      </div>
    </>
  );
}
