import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = { title: "Registros" };
export const dynamic = "force-dynamic";

export default async function AdminRecords() {
  const supabase = await createClient();
  const [{ data: exportsLog }, { data: events }, { data: history }] = await Promise.all([
    supabase.from("exports_log").select("row_count, created_at, filters, companies(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("contact_events").select("kind, created_at, companies(name), student_id").order("created_at", { ascending: false }).limit(50),
    supabase.from("status_history").select("entity, from_status, to_status, reason, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const name = (v: unknown) => (v as { name?: string } | null)?.name ?? "Facultad";

  return (
    <div className="space-y-8">
      <h1 className="display text-3xl text-azul-oscuro">Registros</h1>
      <section>
        <h2 className="font-bold text-azul-oscuro">Exportaciones</h2>
        <table className="table-fcen mt-3">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Filas</th>
            </tr>
          </thead>
          <tbody>
            {(exportsLog ?? []).map((e, i) => (
              <tr key={i}>
                <td>{formatDate(e.created_at)}</td>
                <td>{name(e.companies)}</td>
                <td>{e.row_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-bold text-azul-oscuro">Consultas de contacto y descargas de hojas de vida</h2>
        <table className="table-fcen mt-3">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Acción</th>
              <th>Estudiante</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e, i) => (
              <tr key={i}>
                <td>{formatDate(e.created_at)}</td>
                <td>{name(e.companies)}</td>
                <td>{e.kind === "download_cv" ? "Descargó la hoja de vida" : "Vio el contacto"}</td>
                <td>
                  <a href={`/admin/estudiantes/${e.student_id}`} className="text-azul-medio underline">
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-bold text-azul-oscuro">Cambios de estado</h2>
        <table className="table-fcen mt-3">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {(history ?? []).map((h, i) => (
              <tr key={i}>
                <td>{formatDate(h.created_at)}</td>
                <td>{h.entity === "student" ? "Estudiante" : "Empresa"}</td>
                <td>
                  {h.from_status ?? "?"} → {h.to_status}
                  {h.reason ? ` (${h.reason})` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
