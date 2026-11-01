import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { CompanyStatus } from "@/lib/types";
import { setCompanyStatus } from "../../actions";

export const metadata: Metadata = { title: "Empresa" };
export const dynamic = "force-dynamic";

export default async function AdminCompany({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: c }, { data: members }, { data: history }, { data: exportsLog }, { count: views }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase.from("company_members").select("contact_name, position, phone, member_role, profiles(email)").eq("company_id", id),
    supabase.from("status_history").select("from_status, to_status, reason, created_at").eq("entity", "company").eq("entity_id", id).order("created_at", { ascending: false }),
    supabase.from("exports_log").select("row_count, created_at").eq("company_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("contact_events").select("id", { count: "exact", head: true }).eq("company_id", id),
  ]);
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/empresas" className="text-sm text-suave hover:text-azul">
        <ArrowLeft className="mr-1 inline h-4 w-4 align-[-0.2rem]" aria-hidden="true" /> Empresas
      </Link>
      <div>
        <h1 className="display text-3xl text-azul-oscuro">{c.name}</h1>
        <p className="mt-1">
          <span className="chip chip-azul">{COMPANY_STATUS_LABEL[c.status as CompanyStatus]}</span>
          {c.authorized_until && <span className="ml-2 text-sm text-suave">Autorizada hasta {formatDate(c.authorized_until)}</span>}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item k="NIT" v={c.nit} />
            <Item k="Sector" v={c.sector} />
            <Item k="Tamaño" v={c.size} />
            <Item k="Ciudad" v={c.city} />
            <Item k="Entidad pública" v={c.is_public_entity ? "Sí" : "No"} />
            <Item k="Términos aceptados" v={formatDate(c.terms_accepted_at)} />
          </dl>
          {c.website && (
            <p className="mt-3">
              <a href={c.website} target="_blank" rel="noopener" className="text-azul-medio underline">
                {c.website}
              </a>
            </p>
          )}
          {c.description && <p className="mt-3 whitespace-pre-line text-suave">{c.description}</p>}
          <p className="mt-4">
            <a href="https://www.rues.org.co/" target="_blank" rel="noopener" className="text-azul-medio underline">
              Verificar el NIT en el RUES
            </a>
          </p>
          <h2 className="mt-6 font-black text-azul-oscuro">Personas de contacto</h2>
          <ul className="mt-2 space-y-2">
            {(members ?? []).map((m, i) => (
              <li key={i}>
                <strong>{m.contact_name}</strong>
                {m.position ? `, ${m.position}` : ""} · {(m.profiles as unknown as { email: string } | null)?.email} {m.phone ? `· ${m.phone}` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <form action={setCompanyStatus} className="card space-y-3">
            <input type="hidden" name="company_id" value={c.id} />
            <h2 className="font-black text-azul-oscuro">Decisión</h2>
            <label className="field">
              <span>Nota (se muestra a la empresa si se rechaza o suspende)</span>
              <textarea name="note" className="input" defaultValue={c.review_note ?? ""} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button name="status" value="autorizada" className="btn btn-primary">
                Autorizar (12 meses)
              </button>
              <button name="status" value="rechazada" className="btn btn-danger">
                Rechazar
              </button>
              <button name="status" value="suspendida" className="btn btn-danger">
                Suspender
              </button>
              <button name="status" value="registrada" className="btn btn-ghost">
                Volver a registrada
              </button>
            </div>
          </form>
          <div className="card text-sm">
            <h2 className="font-black text-azul-oscuro">Actividad</h2>
            <p className="mt-2">Consultas de contacto y descargas: <strong>{views ?? 0}</strong></p>
            <p className="mt-2 font-black">Exportaciones</p>
            <ul className="mt-1 space-y-1 text-suave">
              {(exportsLog ?? []).map((e, i) => (
                <li key={i}>
                  {formatDate(e.created_at)}: {e.row_count} filas
                </li>
              ))}
              {(exportsLog ?? []).length === 0 && <li>Ninguna</li>}
            </ul>
            <p className="mt-3 font-black">Historial</p>
            <ul className="mt-1 space-y-1 text-suave">
              {(history ?? []).map((h, i) => (
                <li key={i}>
                  {formatDate(h.created_at)}: {h.from_status ?? "?"} <ArrowRight className="mx-1 inline h-3 w-3 align-[-0.1rem]" aria-hidden="true" /> {h.to_status}
                  {h.reason ? ` (${h.reason})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-suave">{k}</dt>
      <dd className="font-black">{v || "No indicado"}</dd>
    </div>
  );
}
