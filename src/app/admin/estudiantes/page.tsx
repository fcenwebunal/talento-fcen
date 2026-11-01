import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_LABEL, VERIFIED_LABEL, formatDate } from "@/lib/labels";
import type { Availability } from "@/lib/types";

export const metadata: Metadata = { title: "Estudiantes" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  availability: Availability;
  progress_pct: number | null;
  progress_verified: string;
  last_confirmed_at: string | null;
  consent_anonymous: boolean;
  consent_contact: boolean;
  updated_at: string;
  profiles: { full_name: string | null; email: string } | null;
  programs: { name: string } | null;
};

export default async function AdminStudents({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; verificar?: string }> }) {
  const { estado, q, verificar } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("id, availability, progress_pct, progress_verified, last_confirmed_at, consent_anonymous, consent_contact, updated_at, profiles(full_name, email), programs(name)")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (estado) query = query.eq("availability", estado);
  if (verificar) query = query.neq("progress_verified", "coordinacion").not("progress_pct", "is", null);
  const { data } = await query;
  const needle = (q ?? "").toLowerCase();
  const rows = ((data ?? []) as unknown as Row[]).filter(
    (r) => !needle || `${r.profiles?.full_name ?? ""} ${r.profiles?.email ?? ""}`.toLowerCase().includes(needle)
  );

  return (
    <div>
      <h1 className="display text-3xl text-azul-oscuro">Estudiantes</h1>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Nombre o correo" className="input max-w-xs" />
        <select name="estado" defaultValue={estado ?? ""} className="input max-w-xs">
          <option value="">Todos los estados</option>
          {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
            <option key={k} value={k}>
              {AVAILABILITY_LABEL[k]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verificar" value="1" defaultChecked={!!verificar} /> Avance por verificar
        </label>
        <button className="btn btn-secondary">Filtrar</button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="table-fcen">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Programa</th>
              <th>Estado</th>
              <th>Avance</th>
              <th>Autorizaciones</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/estudiantes/${r.id}`} className="font-bold text-azul-medio underline underline-offset-2">
                    {r.profiles?.full_name || "Sin nombre"}
                  </Link>
                  <p className="text-xs text-suave">{r.profiles?.email}</p>
                </td>
                <td>{r.programs?.name ?? "Sin programa"}</td>
                <td>{AVAILABILITY_LABEL[r.availability]}</td>
                <td>
                  {r.progress_pct !== null ? `${r.progress_pct}%` : "—"}
                  <p className="text-xs text-suave">{VERIFIED_LABEL[r.progress_verified]}</p>
                </td>
                <td className="text-xs">
                  {r.consent_anonymous ? "Aparece" : "No aparece"}
                  <br />
                  {r.consent_contact ? "Comparte contacto" : "Sin contacto"}
                </td>
                <td>{formatDate(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="mt-4 text-suave">No hay estudiantes con esos filtros.</p>}
      </div>
    </div>
  );
}
