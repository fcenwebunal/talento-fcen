import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { StudentDetailView } from "@/components/student-detail";
import type { StudentDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Cómo me ven las empresas" };
export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ nivel?: string }> }) {
  const session = await requireRole(["student"]);
  const { nivel } = await searchParams;
  const authorized = nivel === "autorizada";
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_student_detail", { p_student: session.userId });
  const detail = data as StudentDetail;
  const { data: consents } = await supabase.from("students").select("consent_contact").eq("id", session.userId).single();
  const showContact = authorized && !!consents?.consent_contact;
  const shown: StudentDetail = showContact
    ? detail
    : {
        ...detail,
        contact_visible: false,
        contact: null,
        projects: detail.projects.map((p) => ({ ...p, url: null })),
        skills: detail.skills.map((s) => ({ ...s, evidence_url: null })),
      };

  return (
    <div className="wrap py-10">
      <Link href="/estudiante" className="text-sm text-suave hover:text-azul">
        ← Volver a mi panel
      </Link>
      <h1 className="display mt-2 text-3xl text-azul-oscuro">Así ven tu perfil las empresas</h1>
      <div className="mt-4 inline-flex rounded-lg border border-borde bg-superficie p-1">
        <Link href="/estudiante/vista-previa" className={`rounded-md px-4 py-2 text-sm font-bold ${!authorized ? "bg-white text-azul shadow-sm" : "text-suave"}`}>
          Empresa registrada
        </Link>
        <Link href="/estudiante/vista-previa?nivel=autorizada" className={`rounded-md px-4 py-2 text-sm font-bold ${authorized ? "bg-white text-azul shadow-sm" : "text-suave"}`}>
          Empresa autorizada
        </Link>
      </div>
      {authorized && !consents?.consent_contact && (
        <p className="mt-4 rounded-lg bg-amarillo/15 p-3 text-sm text-amarillo-tinta">
          No has aceptado compartir tu contacto, así que las empresas autorizadas también ven tu perfil sin nombre ni contacto.
        </p>
      )}
      <div className="mt-6">
        <StudentDetailView detail={shown} />
      </div>
    </div>
  );
}
