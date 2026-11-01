import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import { requestAuthorization } from "./actions";

export const metadata: Metadata = { title: "Mi empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyHome() {
  const session = await requireRole(["company"]);
  if (!session.company) redirect("/empresa/registro");
  const company = session.company;
  const supabase = await createClient();
  const { data: full } = await supabase.from("companies").select("review_note").eq("id", company.id).single();
  const { count: favorites } = await supabase.from("favorites").select("student_id", { count: "exact", head: true }).eq("company_id", company.id);

  const tone =
    company.status === "autorizada" ? "chip-verde" : company.status === "en_revision" ? "chip-amarillo" : company.status === "registrada" ? "chip-azul" : "chip-naranja";

  return (
    <div className="wrap py-10">
      <p className="text-sm text-suave">Hola{session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}</p>
      <h1 className="display text-3xl text-azul-oscuro">{company.name}</h1>
      <p className="mt-2">
        <span className={`chip ${tone}`}>{COMPANY_STATUS_LABEL[company.status]}</span>
        {company.status === "autorizada" && company.authorized_until && (
          <span className="ml-2 text-sm text-suave">Autorización vigente hasta el {formatDate(company.authorized_until)}</span>
        )}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card">
          <h2 className="text-lg font-bold text-azul-oscuro">Buscar talento</h2>
          <p className="mt-1 text-sm text-suave">
            Busque por habilidad, programa, área de interés, idioma, modalidad y ciudad.
            {session.level === 2
              ? " Como empresa autorizada, ve los datos de contacto de quienes lo permitieron y puede exportar listados."
              : " Por ahora ve los perfiles sin nombre ni datos de contacto."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/empresa/buscar" className="btn btn-primary">
              Buscar perfiles
            </Link>
            <Link href="/empresa/favoritos" className="btn btn-secondary">
              Mis favoritos ({favorites ?? 0})
            </Link>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-azul-oscuro">Autorización de la Facultad</h2>
          {company.status === "registrada" && (
            <>
              <p className="mt-2 text-sm text-suave">
                Pida la autorización para ver los datos de contacto y las hojas de vida, y exportar listados. La Facultad verifica la
                existencia de su organización y la persona de contacto.
              </p>
              {full?.review_note && <p className="mt-2 text-sm text-naranja">{full.review_note}</p>}
              <form action={requestAuthorization} className="mt-4">
                <button className="btn btn-primary">Solicitar autorización</button>
              </form>
            </>
          )}
          {company.status === "en_revision" && (
            <p className="mt-2 text-sm text-suave">Su solicitud está en revisión. La Facultad le avisará cuando quede autorizada.</p>
          )}
          {company.status === "autorizada" && (
            <p className="mt-2 text-sm text-suave">
              Su organización está autorizada. Recuerde usar los datos solo para seleccionar practicantes y eliminar los listados al terminar
              su proceso.
            </p>
          )}
          {company.status === "rechazada" && (
            <>
              <p className="mt-2 text-sm text-naranja">La solicitud no fue aprobada. {full?.review_note}</p>
              <form action={requestAuthorization} className="mt-4">
                <button className="btn btn-secondary">Volver a solicitar</button>
              </form>
            </>
          )}
          {company.status === "suspendida" && <p className="mt-2 text-sm text-naranja">El acceso de su organización está suspendido. {full?.review_note}</p>}
        </section>
      </div>

      <section className="mt-6 card bg-superficie">
        <h2 className="font-bold text-azul-oscuro">¿Cómo se vincula a un practicante?</h2>
        <p className="mt-1 text-sm text-suave">Formas de vinculación, documentos, obligaciones (como la ARL) y tiempos.</p>
        <Link href="/guia/empresas" className="btn btn-secondary mt-4">
          Abrir la guía para empresas
        </Link>
      </section>
    </div>
  );
}
